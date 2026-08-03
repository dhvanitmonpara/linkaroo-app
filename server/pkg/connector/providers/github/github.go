package github

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/models"
	pipelineModels "linkaroo-app/server/pkg/pipeline/models"
)

func applyGitHubHeaders(req *http.Request, token string) {
	req.Header.Set("User-Agent", "Linkaroo-App/1.0")
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	if token != "" {
		cleanToken := strings.TrimSpace(token)
		if strings.HasPrefix(cleanToken, "Bearer ") {
			cleanToken = strings.TrimPrefix(cleanToken, "Bearer ")
		}
		if strings.HasPrefix(cleanToken, "github_pat_") || strings.HasPrefix(cleanToken, "gho_") || strings.HasPrefix(cleanToken, "ghu_") {
			req.Header.Set("Authorization", "Bearer "+cleanToken)
		} else {
			req.Header.Set("Authorization", "token "+cleanToken)
		}
	}
}

const (
	ProviderGitHub = "GITHUB"
)

// GitHubRepository represents a minimal GitHub API repository response struct for normalization.
type GitHubRepository struct {
	ID          int64     `json:"id"`
	NodeID      string    `json:"node_id"`
	Name        string    `json:"name"`
	FullName    string    `json:"full_name"`
	Description string    `json:"description"`
	HTMLURL     string    `json:"html_url"`
	Language    string    `json:"language"`
	Stargazers  int       `json:"stargazers_count"`
	Forks       int       `json:"forks_count"`
	Private     bool      `json:"private"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	PushedAt    time.Time `json:"pushed_at"`
	Owner       struct {
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
		HTMLURL   string `json:"html_url"`
	} `json:"owner"`
}

// GitHubConnector is the reference implementation of a Linkaroo third-party connector for GitHub.
type GitHubConnector struct {
	mu           sync.RWMutex
	instanceID   string
	authCfg      *auth.AuthConfig
	state        models.LifecycleState
	httpClient   *http.Client
	baseURL      string
	capabilities models.CapabilitySet
}

// NewGitHubConnector instantiates a new GitHubConnector instance.
func NewGitHubConnector(instanceID string) *GitHubConnector {
	return &GitHubConnector{
		instanceID: instanceID,
		state:      models.StateRegistered,
		httpClient: &http.Client{Timeout: 10 * time.Second},
		baseURL:    "https://api.github.com",
		capabilities: models.NewCapabilitySet(
			models.CapabilityReadItems,
			models.CapabilitySearch,
			models.CapabilityIncrementalSync,
		),
	}
}

// Ensure GitHubConnector implements interfaces.Connector, ItemFetcher, Searcher, Syncable
var (
	_ interfaces.Connector   = (*GitHubConnector)(nil)
	_ interfaces.ItemFetcher = (*GitHubConnector)(nil)
	_ interfaces.Searcher    = (*GitHubConnector)(nil)
	_ interfaces.Syncable    = (*GitHubConnector)(nil)
)

func (g *GitHubConnector) ID() string {
	return g.instanceID
}

func (g *GitHubConnector) Name() string {
	return "GitHub Connector"
}

func (g *GitHubConnector) Provider() string {
	return ProviderGitHub
}

func (g *GitHubConnector) Capabilities() models.CapabilitySet {
	return g.capabilities
}

func (g *GitHubConnector) AuthMechanism() auth.AuthMechanism {
	return auth.AuthMechanismPAT
}

func (g *GitHubConnector) State() models.LifecycleState {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.state
}

func (g *GitHubConnector) Health(ctx context.Context) models.HealthStatus {
	g.mu.RLock()
	defer g.mu.RUnlock()

	start := time.Now()
	if g.authCfg == nil {
		return models.HealthStatus{
			Level:        models.HealthStatusUnhealthy,
			LastChecked:  time.Now(),
			ErrorMessage: "connector not authenticated",
		}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, g.baseURL+"/user", nil)
	if err != nil {
		return models.HealthStatus{
			Level:        models.HealthStatusDegraded,
			LastChecked:  time.Now(),
			ErrorMessage: err.Error(),
		}
	}

	token := g.authCfg.GetToken()
	applyGitHubHeaders(req, token)

	resp, err := g.httpClient.Do(req)
	latency := time.Since(start).Milliseconds()
	if err != nil {
		return models.HealthStatus{
			Level:        models.HealthStatusDegraded,
			LastChecked:  time.Now(),
			LatencyMs:    latency,
			ErrorMessage: err.Error(),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return models.HealthStatus{
			Level:       models.HealthStatusHealthy,
			LastChecked: time.Now(),
			LatencyMs:   latency,
		}
	}

	return models.HealthStatus{
		Level:        models.HealthStatusUnhealthy,
		LastChecked:  time.Now(),
		LatencyMs:    latency,
		ErrorMessage: fmt.Sprintf("github status: %s", resp.Status),
	}
}

func (g *GitHubConnector) Connect(ctx context.Context, authCfg *auth.AuthConfig) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.authCfg = authCfg
	g.state = models.StateConnected
	return nil
}

func (g *GitHubConnector) Disconnect(ctx context.Context) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.authCfg = nil
	g.state = models.StateDisconnected
	return nil
}

func (g *GitHubConnector) Refresh(ctx context.Context) error {
	// PAT does not expire dynamically in standard GitHub, but method is provided for interface compliance
	return nil
}

func (g *GitHubConnector) Fetch(ctx context.Context, itemID string) (*models.NormalizedItem, error) {
	g.mu.RLock()
	token := ""
	if g.authCfg != nil {
		token = g.authCfg.GetToken()
	}
	g.mu.RUnlock()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/repositories/%s", g.baseURL, itemID), nil)
	if err != nil {
		return nil, err
	}
	applyGitHubHeaders(req, token)

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, models.NewConnectorError(models.ErrCodeNetworkError, g.instanceID, ProviderGitHub, "network error during fetch", true, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, models.NewConnectorError(models.ErrCodeProviderError, g.instanceID, ProviderGitHub, fmt.Sprintf("github status: %d", resp.StatusCode), false, nil)
	}

	var repo GitHubRepository
	if err := json.NewDecoder(resp.Body).Decode(&repo); err != nil {
		return nil, err
	}

	return g.normalizeRepository(repo), nil
}

func (g *GitHubConnector) Search(ctx context.Context, query string, opts interfaces.SearchOptions) ([]*models.NormalizedItem, error) {
	g.mu.RLock()
	token := ""
	if g.authCfg != nil {
		token = g.authCfg.GetToken()
	}
	g.mu.RUnlock()

	url := fmt.Sprintf("%s/search/repositories?q=%s", g.baseURL, query)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	applyGitHubHeaders(req, token)

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, models.NewConnectorError(models.ErrCodeNetworkError, g.instanceID, ProviderGitHub, "network error during search", true, err)
	}
	defer resp.Body.Close()

	var searchResult struct {
		Items []GitHubRepository `json:"items"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&searchResult); err != nil {
		return nil, err
	}

	items := make([]*models.NormalizedItem, 0, len(searchResult.Items))
	for _, repo := range searchResult.Items {
		items = append(items, g.normalizeRepository(repo))
	}

	return items, nil
}

func (g *GitHubConnector) Sync(ctx context.Context, opts interfaces.SyncOptions, itemHandler func(item *models.NormalizedItem) error) (interfaces.SyncResult, error) {
	start := time.Now()
	g.mu.RLock()
	token := ""
	if g.authCfg != nil {
		token = g.authCfg.GetToken()
	}
	g.mu.RUnlock()

	url := fmt.Sprintf("%s/user/repos?sort=updated&direction=desc&per_page=50", g.baseURL)
	if opts.Incremental && opts.Checkpoint != "" {
		// Example cursor checkpoint logic using GitHub repo ID or timestamp
		url += "&since=" + opts.Checkpoint
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return interfaces.SyncResult{}, err
	}
	applyGitHubHeaders(req, token)

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return interfaces.SyncResult{}, models.NewConnectorError(models.ErrCodeNetworkError, g.instanceID, ProviderGitHub, "failed to sync user repositories", true, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return interfaces.SyncResult{}, models.NewConnectorError(models.ErrCodeProviderError, g.instanceID, ProviderGitHub, fmt.Sprintf("sync error: %s", resp.Status), false, nil)
	}

	var repos []GitHubRepository
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return interfaces.SyncResult{}, err
	}

	var latestRepoID string
	imported := 0

	for _, repo := range repos {
		item := g.normalizeRepository(repo)
		if itemHandler != nil {
			if err := itemHandler(item); err != nil {
				return interfaces.SyncResult{
					ItemsFetched:  len(repos),
					ItemsImported: imported,
					StartTime:     start,
					EndTime:       time.Now(),
				}, err
			}
		}
		imported++
		latestRepoID = strconv.FormatInt(repo.ID, 10)
	}

	return interfaces.SyncResult{
		ItemsFetched:  len(repos),
		ItemsImported: imported,
		NewCheckpoint: latestRepoID,
		HasMore:       false,
		StartTime:     start,
		EndTime:       time.Now(),
	}, nil
}

// normalizeRepository transforms GitHubRepository into a normalized Linkaroo content object.
func (g *GitHubConnector) normalizeRepository(repo GitHubRepository) *models.NormalizedItem {
	var thumbnail *pipelineModels.ImageRef
	if repo.Owner.AvatarURL != "" {
		thumbnail = &pipelineModels.ImageRef{
			URL:  repo.Owner.AvatarURL,
			Type: "avatar",
		}
	}

	authors := []pipelineModels.Author{
		{
			Name: repo.Owner.Login,
			Role: "owner",
			URL:  repo.Owner.HTMLURL,
		},
	}

	metadata := map[string]any{
		"full_name":  repo.FullName,
		"language":   repo.Language,
		"stargazers": repo.Stargazers,
		"forks":      repo.Forks,
		"private":    repo.Private,
	}

	rawMeta := map[string]any{
		"node_id":   repo.NodeID,
		"pushed_at": repo.PushedAt.Format(time.RFC3339),
	}

	return &models.NormalizedItem{
		ItemID:        strconv.FormatInt(repo.ID, 10),
		Provider:      ProviderGitHub,
		CanonicalType: pipelineModels.MediaTypeGitHubRepository,
		Source:        pipelineModels.SourceGitHub,
		Title:         repo.Name,
		Subtitle:      repo.FullName,
		Description:   repo.Description,
		Authors:       authors,
		Thumbnail:     thumbnail,
		Metadata:      metadata,
		OriginalURL:   repo.HTMLURL,
		Language:      repo.Language,
		CreatedTime:   repo.CreatedAt,
		UpdatedTime:   repo.UpdatedAt,
		RawMetadata:   rawMeta,
		Checksum:      strconv.FormatInt(repo.ID, 10) + ":" + repo.UpdatedAt.Format(time.RFC3339),
	}
}

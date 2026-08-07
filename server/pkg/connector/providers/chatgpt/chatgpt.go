package chatgpt

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/models"
	pipelineModels "linkaroo-app/server/pkg/pipeline/models"
)

const (
	ProviderChatGPT = "CHATGPT"
)

type OpenAIModel struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	OwnedBy string `json:"owned_by"`
}

type OpenAIModelListResponse struct {
	Object string        `json:"object"`
	Data   []OpenAIModel `json:"data"`
}

type ChatGPTConnector struct {
	mu           sync.RWMutex
	instanceID   string
	authCfg      *auth.AuthConfig
	state        models.LifecycleState
	httpClient   *http.Client
	baseURL      string
	capabilities models.CapabilitySet
}

func NewChatGPTConnector(instanceID string) *ChatGPTConnector {
	return &ChatGPTConnector{
		instanceID: instanceID,
		state:      models.StateRegistered,
		httpClient: &http.Client{Timeout: 15 * time.Second},
		baseURL:    "https://api.openai.com/v1",
		capabilities: models.NewCapabilitySet(
			models.CapabilityReadItems,
		),
	}
}

func (c *ChatGPTConnector) ID() string {
	return c.instanceID
}

func (c *ChatGPTConnector) Name() string {
	return "ChatGPT / OpenAI Connector"
}

func (c *ChatGPTConnector) Provider() string {
	return ProviderChatGPT
}

func (c *ChatGPTConnector) Capabilities() models.CapabilitySet {
	return c.capabilities
}

func (c *ChatGPTConnector) AuthMechanism() auth.AuthMechanism {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.authCfg != nil && c.authCfg.Mechanism != "" {
		return c.authCfg.Mechanism
	}
	return auth.AuthMechanismAPIKey
}

func (c *ChatGPTConnector) State() models.LifecycleState {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.state
}

func (c *ChatGPTConnector) applyAuthHeaders(req *http.Request) {
	if c.authCfg == nil {
		return
	}
	token := strings.TrimSpace(c.authCfg.GetToken())
	if token != "" {
		if strings.HasPrefix(token, "Bearer ") {
			req.Header.Set("Authorization", token)
		} else {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	}
	if c.authCfg.APIKey != nil && c.authCfg.APIKey.Header != "" {
		headerName := c.authCfg.APIKey.Header
		val := c.authCfg.APIKey.Key
		if c.authCfg.APIKey.Prefix != "" {
			val = fmt.Sprintf("%s %s", c.authCfg.APIKey.Prefix, val)
		}
		req.Header.Set(headerName, val)
	}
	if orgID, ok := c.authCfg.CustomParams["openai_organization"]; ok && orgID != "" {
		req.Header.Set("OpenAI-Organization", orgID)
	}
	if projectID, ok := c.authCfg.CustomParams["openai_project"]; ok && projectID != "" {
		req.Header.Set("OpenAI-Project", projectID)
	}
}

func (c *ChatGPTConnector) Health(ctx context.Context) models.HealthStatus {
	c.mu.RLock()
	token := c.authCfg.GetToken()
	c.mu.RUnlock()

	if token == "" {
		return models.HealthStatus{
			Level:        models.HealthStatusUnhealthy,
			ErrorMessage: "Connector is unauthenticated",
			LastChecked:  time.Now(),
		}
	}

	start := time.Now()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/models", nil)
	if err != nil {
		return models.HealthStatus{
			Level:        models.HealthStatusUnhealthy,
			ErrorMessage: fmt.Sprintf("Failed to construct health check request: %v", err),
			LastChecked:  time.Now(),
		}
	}

	c.mu.RLock()
	c.applyAuthHeaders(req)
	c.mu.RUnlock()

	resp, err := c.httpClient.Do(req)
	latency := time.Since(start).Milliseconds()
	if err != nil {
		return models.HealthStatus{
			Level:        models.HealthStatusUnhealthy,
			ErrorMessage: fmt.Sprintf("Health check network request failed: %v", err),
			LastChecked:  time.Now(),
			LatencyMs:    latency,
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
		ErrorMessage: fmt.Sprintf("API responded with status code %d", resp.StatusCode),
		LastChecked:  time.Now(),
		LatencyMs:    latency,
	}
}

func (c *ChatGPTConnector) Connect(ctx context.Context, authCfg *auth.AuthConfig) error {
	if authCfg == nil || authCfg.GetToken() == "" {
		return fmt.Errorf("invalid authentication configuration: missing token or key")
	}

	c.mu.Lock()
	c.authCfg = authCfg
	c.state = models.StateConfigured
	c.mu.Unlock()

	health := c.Health(ctx)
	c.mu.Lock()
	defer c.mu.Unlock()

	if !health.IsHealthy() {
		c.state = models.StateFailed
		return fmt.Errorf("authentication failed: %s", health.ErrorMessage)
	}

	c.state = models.StateConnected
	return nil
}

func (c *ChatGPTConnector) Disconnect(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.authCfg = nil
	c.state = models.StateDisconnected
	return nil
}

func (c *ChatGPTConnector) Refresh(ctx context.Context) error {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.authCfg == nil {
		return fmt.Errorf("connector is not configured")
	}
	return nil
}

func (c *ChatGPTConnector) Fetch(ctx context.Context, itemID string) (*models.NormalizedItem, error) {
	c.mu.RLock()
	if c.state != models.StateConnected {
		c.mu.RUnlock()
		return nil, fmt.Errorf("connector is not connected")
	}
	c.mu.RUnlock()

	cleanID := strings.TrimSpace(itemID)
	if cleanID == "" {
		return nil, fmt.Errorf("item ID cannot be empty")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/models/%s", c.baseURL, cleanID), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.mu.RLock()
	c.applyAuthHeaders(req)
	c.mu.RUnlock()

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var modelData OpenAIModel
	if err := json.NewDecoder(resp.Body).Decode(&modelData); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return c.normalizeModelItem(modelData), nil
}

func (c *ChatGPTConnector) Search(ctx context.Context, query string, opts interfaces.SearchOptions) ([]*models.NormalizedItem, error) {
	c.mu.RLock()
	if c.state != models.StateConnected {
		c.mu.RUnlock()
		return nil, fmt.Errorf("connector is not connected")
	}
	c.mu.RUnlock()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/models", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create search request: %w", err)
	}

	c.mu.RLock()
	c.applyAuthHeaders(req)
	c.mu.RUnlock()

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("search request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("search API error code: %d", resp.StatusCode)
	}

	var listResp OpenAIModelListResponse
	if err := json.NewDecoder(resp.Body).Decode(&listResp); err != nil {
		return nil, fmt.Errorf("failed to decode search result: %w", err)
	}

	var results []*models.NormalizedItem
	cleanQuery := strings.ToLower(strings.TrimSpace(query))

	for _, item := range listResp.Data {
		if cleanQuery == "" || strings.Contains(strings.ToLower(item.ID), cleanQuery) || strings.Contains(strings.ToLower(item.OwnedBy), cleanQuery) {
			results = append(results, c.normalizeModelItem(item))
		}
		if opts.Limit > 0 && len(results) >= opts.Limit {
			break
		}
	}

	return results, nil
}

func (c *ChatGPTConnector) Sync(ctx context.Context, opts interfaces.SyncOptions, itemHandler func(item *models.NormalizedItem) error) (interfaces.SyncResult, error) {
	startTime := time.Now()
	result := interfaces.SyncResult{
		StartTime: startTime,
	}

	c.mu.RLock()
	if c.state != models.StateConnected {
		c.mu.RUnlock()
		result.EndTime = time.Now()
		return result, fmt.Errorf("connector is not connected")
	}
	c.mu.RUnlock()

	items, err := c.Search(ctx, "", interfaces.SearchOptions{})
	if err != nil {
		result.EndTime = time.Now()
		result.Errors = append(result.Errors, pipelineModels.ExtractionError{
			Stage:   "SYNC",
			Message: err.Error(),
		})
		return result, err
	}

	result.ItemsFetched = len(items)
	for _, item := range items {
		if itemHandler != nil {
			if err := itemHandler(item); err != nil {
				result.Errors = append(result.Errors, pipelineModels.ExtractionError{
					Stage:   "SYNC_HANDLER",
					Message: fmt.Sprintf("Failed processing item %s: %v", item.ItemID, err),
				})
				continue
			}
		}
		result.ItemsImported++
	}

	result.EndTime = time.Now()
	return result, nil
}

func (c *ChatGPTConnector) normalizeModelItem(item OpenAIModel) *models.NormalizedItem {
	createdAt := time.Unix(item.Created, 0)
	if item.Created == 0 {
		createdAt = time.Now()
	}

	authors := []pipelineModels.Author{
		{
			Name: item.OwnedBy,
			Role: "owner",
		},
	}

	return &models.NormalizedItem{
		ItemID:        item.ID,
		Provider:      ProviderChatGPT,
		CanonicalType: pipelineModels.MediaTypeDocument,
		Source:        "CHATGPT",
		Title:         fmt.Sprintf("OpenAI Model: %s", item.ID),
		Subtitle:      fmt.Sprintf("Owned by %s", item.OwnedBy),
		Description:   fmt.Sprintf("OpenAI model %s owned by %s", item.ID, item.OwnedBy),
		Authors:       authors,
		OriginalURL:   fmt.Sprintf("https://platform.openai.com/docs/models/%s", item.ID),
		CreatedTime:   createdAt,
		UpdatedTime:   time.Now(),
		Metadata: map[string]any{
			"object":   item.Object,
			"owned_by": item.OwnedBy,
			"created":  item.Created,
			"provider": ProviderChatGPT,
		},
	}
}

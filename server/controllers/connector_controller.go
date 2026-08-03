package controllers

import (
	"net/http"
	"strings"

	"linkaroo-app/server/db"
	modelsDB "linkaroo-app/server/models"
	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/manager"
	"linkaroo-app/server/pkg/connector/models"
	githubProvider "linkaroo-app/server/pkg/connector/providers/github"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var GlobalConnectorManager *manager.Manager

func init() {
	GlobalConnectorManager = manager.NewManager()

	// Register reference GitHub provider
	_ = GlobalConnectorManager.RegisterProvider(githubProvider.ProviderGitHub, func(id string) interfaces.Connector {
		return githubProvider.NewGitHubConnector(id)
	})
}

// ProviderInfo represents provider metadata returned to the frontend.
type ProviderInfo struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Category     string   `json:"category"`
	Description  string   `json:"description"`
	AuthType     string   `json:"auth_type"`
	Capabilities []string `json:"capabilities"`
	IsSupported  bool     `json:"is_supported"`
}

// GetConnectorProviders returns all third-party connector providers.
func GetConnectorProviders(c *gin.Context) {
	registered := GlobalConnectorManager.Registry().ListProviders()
	registeredMap := make(map[string]bool)
	for _, p := range registered {
		registeredMap[strings.ToUpper(p)] = true
	}

	providers := []ProviderInfo{
		{
			ID:           "GITHUB",
			Name:         "GitHub",
			Category:     "Developer",
			Description:  "Sync repositories, code snippets, and gists as vault items.",
			AuthType:     "PERSONAL_ACCESS_TOKEN",
			Capabilities: []string{"READ_ITEMS", "SEARCH", "INCREMENTAL_SYNC"},
			IsSupported:  registeredMap["GITHUB"],
		},
		{
			ID:           "GOOGLE_DRIVE",
			Name:         "Google Drive",
			Category:     "Cloud Storage",
			Description:  "Sync documents, PDFs, and spreadsheets from your Google Drive.",
			AuthType:     "OAUTH2",
			Capabilities: []string{"READ_ITEMS", "SEARCH", "INCREMENTAL_SYNC", "FILE_DOWNLOAD"},
			IsSupported:  registeredMap["GOOGLE_DRIVE"],
		},
		{
			ID:           "NOTION",
			Name:         "Notion",
			Category:     "Productivity",
			Description:  "Mount Notion workspace pages and databases into Linkaroo.",
			AuthType:     "API_KEY",
			Capabilities: []string{"READ_ITEMS", "SEARCH", "INCREMENTAL_SYNC"},
			IsSupported:  registeredMap["NOTION"],
		},
		{
			ID:           "SLACK",
			Name:         "Slack",
			Category:     "Communication",
			Description:  "Save saved messages and canvas documents from Slack channels.",
			AuthType:     "OAUTH2",
			Capabilities: []string{"READ_ITEMS", "SEARCH"},
			IsSupported:  registeredMap["SLACK"],
		},
		{
			ID:           "SPOTIFY",
			Name:         "Spotify",
			Category:     "Media",
			Description:  "Import saved albums, playlists, and podcast episodes.",
			AuthType:     "OAUTH2",
			Capabilities: []string{"READ_ITEMS"},
			IsSupported:  registeredMap["SPOTIFY"],
		},
		{
			ID:           "DROPBOX",
			Name:         "Dropbox",
			Category:     "Cloud Storage",
			Description:  "Sync cloud files and shared documents from Dropbox.",
			AuthType:     "OAUTH2",
			Capabilities: []string{"READ_ITEMS", "FILE_DOWNLOAD"},
			IsSupported:  registeredMap["DROPBOX"],
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"data": providers,
	})
}

// ConnectorInstanceDTO represents active connector status sent to frontend.
type ConnectorInstanceDTO struct {
	ID           string               `json:"id"`
	Provider     string               `json:"provider"`
	State        models.LifecycleState `json:"state"`
	Health       models.HealthStatus  `json:"health"`
	Capabilities []models.Capability  `json:"capabilities"`
}

// GetUserConnectors lists all connected instances for the user.
func GetUserConnectors(c *gin.Context) {
	connectors := GlobalConnectorManager.ListConnectors()
	dtos := make([]ConnectorInstanceDTO, 0, len(connectors))

	for _, conn := range connectors {
		health := conn.Health(c.Request.Context())
		state, _ := GlobalConnectorManager.GetState(conn.ID())

		dtos = append(dtos, ConnectorInstanceDTO{
			ID:           conn.ID(),
			Provider:     conn.Provider(),
			State:        state,
			Health:       health,
			Capabilities: conn.Capabilities().ToSlice(),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": dtos,
	})
}

type ConnectRequest struct {
	Provider string `json:"provider"`
	Token    string `json:"token"`
}

// ConnectUserConnector instantiates and connects a connector.
func ConnectUserConnector(c *gin.Context) {
	var req ConnectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	providerUpper := strings.ToUpper(strings.TrimSpace(req.Provider))
	if !GlobalConnectorManager.Registry().IsRegistered(providerUpper) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported connector provider: " + req.Provider})
		return
	}

	instanceID := providerUpper + "-" + uuid.New().String()[:8]
	conn, err := GlobalConnectorManager.CreateConnector(providerUpper, instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	cleanToken := strings.TrimSpace(req.Token)
	var authCfg *auth.AuthConfig
	switch conn.AuthMechanism() {
	case auth.AuthMechanismPAT:
		authCfg = &auth.AuthConfig{
			Mechanism: auth.AuthMechanismPAT,
			PAT:       &auth.PATData{Token: cleanToken},
		}
	case auth.AuthMechanismAPIKey:
		authCfg = &auth.AuthConfig{
			Mechanism: auth.AuthMechanismAPIKey,
			APIKey:    &auth.APIKeyData{Key: cleanToken},
		}
	default:
		authCfg = &auth.AuthConfig{
			Mechanism: auth.AuthMechanismOAuth2,
			OAuth2:    &auth.OAuth2Data{AccessToken: cleanToken},
		}
	}

	if err := GlobalConnectorManager.ConnectConnector(c.Request.Context(), instanceID, authCfg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect: " + err.Error()})
		return
	}

	state, _ := GlobalConnectorManager.GetState(instanceID)
	c.JSON(http.StatusOK, gin.H{
		"message": "Connector connected successfully",
		"data": ConnectorInstanceDTO{
			ID:           instanceID,
			Provider:     conn.Provider(),
			State:        state,
			Health:       conn.Health(c.Request.Context()),
			Capabilities: conn.Capabilities().ToSlice(),
		},
	})
}

// DisconnectUserConnector disconnects a connector instance.
func DisconnectUserConnector(c *gin.Context) {
	instanceID := c.Param("id")
	if err := GlobalConnectorManager.DisconnectConnector(c.Request.Context(), instanceID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Connector disconnected successfully",
	})
}

type SyncRequest struct {
	UserId string `json:"userId"`
}

// SyncUserConnector triggers synchronization for a connector instance.
func SyncUserConnector(c *gin.Context) {
	instanceID := c.Param("id")

	var req SyncRequest
	_ = c.ShouldBindJSON(&req)

	var targetUserID uuid.UUID
	if req.UserId != "" {
		targetUserID, _ = uuid.Parse(req.UserId)
	}

	var targetCollection modelsDB.Collection
	if targetUserID != uuid.Nil {
		_ = db.DB.Where("created_by_id = ?", targetUserID).First(&targetCollection).Error
	}

	res, err := GlobalConnectorManager.SyncConnector(c.Request.Context(), instanceID, false, func(item *models.NormalizedItem) error {
		if item == nil || item.OriginalURL == "" {
			return nil
		}

		imgURL := ""
		if item.Thumbnail != nil {
			imgURL = item.Thumbnail.URL
		}

		linkObj, err := getOrCreateLink(item.OriginalURL, item.Title, item.Description, imgURL, "github-repo")
		if err != nil {
			return err
		}

		if targetUserID != uuid.Nil && targetCollection.ID != uuid.Nil {
			title := item.Title
			desc := item.Description
			_, _ = getOrCreateUserLink(targetUserID, targetCollection.ID, linkObj.ID, &title, &desc)
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Sync failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sync completed successfully",
		"data":    res,
	})
}

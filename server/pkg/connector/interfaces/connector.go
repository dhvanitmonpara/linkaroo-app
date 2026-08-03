package interfaces

import (
	"context"
	"time"

	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/models"
	pipelineModels "linkaroo-app/server/pkg/pipeline/models"
)

// SearchOptions provides parameter constraints for search queries.
type SearchOptions struct {
	Limit  int            `json:"limit,omitempty"`
	Offset int            `json:"offset,omitempty"`
	Filter map[string]any `json:"filter,omitempty"`
}

// SyncOptions provides control parameters for full or incremental synchronization.
type SyncOptions struct {
	Incremental bool   `json:"incremental"`
	Checkpoint  string `json:"checkpoint,omitempty"`
	BatchSize   int    `json:"batch_size,omitempty"`
}

// SyncResult details the outcome of a synchronization operation.
type SyncResult struct {
	ItemsFetched  int                          `json:"items_fetched"`
	ItemsImported int                          `json:"items_imported"`
	NewCheckpoint string                       `json:"new_checkpoint,omitempty"`
	HasMore       bool                         `json:"has_more"`
	StartTime     time.Time                    `json:"start_time"`
	EndTime       time.Time                    `json:"end_time"`
	Errors        []pipelineModels.ExtractionError `json:"errors,omitempty"`
}

// Connector is the foundational interface that every Linkaroo third-party connector MUST implement.
type Connector interface {
	ID() string
	Name() string
	Provider() string
	Capabilities() models.CapabilitySet
	AuthMechanism() auth.AuthMechanism
	State() models.LifecycleState
	Health(ctx context.Context) models.HealthStatus
	Connect(ctx context.Context, authCfg *auth.AuthConfig) error
	Disconnect(ctx context.Context) error
	Refresh(ctx context.Context) error
}

// ItemFetcher is an optional capability interface for connectors that support single item retrieval.
type ItemFetcher interface {
	Fetch(ctx context.Context, itemID string) (*models.NormalizedItem, error)
}

// Searcher is an optional capability interface for connectors that support querying items.
type Searcher interface {
	Search(ctx context.Context, query string, opts SearchOptions) ([]*models.NormalizedItem, error)
}

// Syncable is an optional capability interface for connectors that support full or incremental item synchronization.
type Syncable interface {
	Sync(ctx context.Context, opts SyncOptions, itemHandler func(item *models.NormalizedItem) error) (SyncResult, error)
}

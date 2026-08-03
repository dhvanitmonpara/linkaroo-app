package sync

import (
	"context"
	"fmt"
	"sync"
	"time"

	"linkaroo-app/server/pkg/connector/events"
	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/models"
)

// SyncProgress holds real-time execution status of an active sync operation.
type SyncProgress struct {
	ConnectorID   string    `json:"connector_id"`
	Provider      string    `json:"provider"`
	Incremental   bool      `json:"incremental"`
	ItemsFetched  int       `json:"items_fetched"`
	ItemsImported int       `json:"items_imported"`
	Status        string    `json:"status"` // "RUNNING", "COMPLETED", "FAILED"
	StartedAt     time.Time `json:"started_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	Error         string    `json:"error,omitempty"`
}

// SyncEngine orchestrates background sync operations across connectors.
type SyncEngine struct {
	mu              sync.RWMutex
	checkpointStore CheckpointStore
	eventBus        events.EventBus
	retryPolicy     RetryPolicy
	activeSyncs     map[string]*SyncProgress
}

// NewSyncEngine instantiates a SyncEngine with optional checkpoint store, event bus, and retry policy.
func NewSyncEngine(cpStore CheckpointStore, eventBus events.EventBus, retryPolicy *RetryPolicy) *SyncEngine {
	if cpStore == nil {
		cpStore = NewMemoryCheckpointStore()
	}
	if retryPolicy == nil {
		p := DefaultRetryPolicy()
		retryPolicy = &p
	}
	return &SyncEngine{
		checkpointStore: cpStore,
		eventBus:        eventBus,
		retryPolicy:     *retryPolicy,
		activeSyncs:     make(map[string]*SyncProgress),
	}
}

// RunSync executes full or incremental sync for a given connector instance in a fault-isolated manner.
func (e *SyncEngine) RunSync(ctx context.Context, connector interfaces.Connector, incremental bool, itemHandler func(item *models.NormalizedItem) error) (interfaces.SyncResult, error) {
	connID := connector.ID()
	provider := connector.Provider()

	// Capability check
	syncable, ok := connector.(interfaces.Syncable)
	if !ok {
		return interfaces.SyncResult{}, models.NewConnectorError(
			models.ErrCodeCapabilityUnsupported,
			connID,
			provider,
			"connector does not implement Syncable interface",
			false,
			nil,
		)
	}

	if incremental && !connector.Capabilities().Has(models.CapabilityIncrementalSync) {
		return interfaces.SyncResult{}, models.NewConnectorError(
			models.ErrCodeCapabilityUnsupported,
			connID,
			provider,
			"incremental sync is not supported by connector capabilities",
			false,
			nil,
		)
	}

	// Retrieve checkpoint if incremental
	var checkpointCursor string
	if incremental {
		cp, err := e.checkpointStore.GetCheckpoint(ctx, connID)
		if err == nil && cp != nil {
			checkpointCursor = cp.Cursor
		}
	}

	// Setup progress tracking
	progress := &SyncProgress{
		ConnectorID: connID,
		Provider:    provider,
		Incremental: incremental,
		Status:      "RUNNING",
		StartedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	e.mu.Lock()
	e.activeSyncs[connID] = progress
	e.mu.Unlock()

	defer func() {
		e.mu.Lock()
		delete(e.activeSyncs, connID)
		e.mu.Unlock()
	}()

	// Emit SyncStarted Event
	if e.eventBus != nil {
		e.eventBus.Publish(events.Event{
			Type:        events.EventSyncStarted,
			ConnectorID: connID,
			Provider:    provider,
			Timestamp:   time.Now(),
			Payload: map[string]any{
				"incremental": incremental,
				"checkpoint":  checkpointCursor,
			},
		})
	}

	opts := interfaces.SyncOptions{
		Incremental: incremental,
		Checkpoint:  checkpointCursor,
		BatchSize:   100,
	}

	seenItems := make(map[string]bool)
	var finalResult interfaces.SyncResult

	err := e.retryPolicy.Execute(ctx, "sync", func() error {
		res, syncErr := syncable.Sync(ctx, opts, func(item *models.NormalizedItem) error {
			if item == nil || item.ItemID == "" {
				return nil
			}

			// Duplicate prevention
			if seenItems[item.ItemID] {
				return nil
			}
			seenItems[item.ItemID] = true

			progress.ItemsFetched++
			progress.UpdatedAt = time.Now()

			if itemHandler != nil {
				if err := itemHandler(item); err != nil {
					return fmt.Errorf("itemHandler failed for item %s: %w", item.ItemID, err)
				}
			}

			progress.ItemsImported++

			// Emit ItemImported event
			if e.eventBus != nil {
				e.eventBus.Publish(events.Event{
					Type:        events.EventItemImported,
					ConnectorID: connID,
					Provider:    provider,
					Timestamp:   time.Now(),
					Item:        item,
				})
			}

			return nil
		})

		finalResult = res
		return syncErr
	})

	if err != nil {
		progress.Status = "FAILED"
		progress.Error = err.Error()
		progress.UpdatedAt = time.Now()

		if e.eventBus != nil {
			e.eventBus.Publish(events.Event{
				Type:        events.EventSyncFailed,
				ConnectorID: connID,
				Provider:    provider,
				Timestamp:   time.Now(),
				Err:         err,
			})
		}
		return finalResult, err
	}

	// Update checkpoint if new checkpoint cursor is returned
	if finalResult.NewCheckpoint != "" {
		_ = e.checkpointStore.SaveCheckpoint(ctx, Checkpoint{
			ConnectorID:  connID,
			Cursor:       finalResult.NewCheckpoint,
			LastSyncedAt: time.Now(),
			ItemCount:    int64(progress.ItemsImported),
		})
	}

	progress.Status = "COMPLETED"
	progress.UpdatedAt = time.Now()

	// Emit SyncCompleted event
	if e.eventBus != nil {
		e.eventBus.Publish(events.Event{
			Type:        events.EventSyncCompleted,
			ConnectorID: connID,
			Provider:    provider,
			Timestamp:   time.Now(),
			Payload: map[string]any{
				"items_fetched":  progress.ItemsFetched,
				"items_imported": progress.ItemsImported,
				"new_checkpoint": finalResult.NewCheckpoint,
			},
		})
	}

	return finalResult, nil
}

// GetProgress fetches the current sync progress for an active connector sync.
func (e *SyncEngine) GetProgress(connectorID string) (*SyncProgress, bool) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	progress, ok := e.activeSyncs[connectorID]
	if !ok {
		return nil, false
	}
	cp := *progress
	return &cp, true
}

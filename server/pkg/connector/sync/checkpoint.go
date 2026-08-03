package sync

import (
	"context"
	"sync"
	"time"
)

// Checkpoint represents stored sync position state for incremental synchronizations.
type Checkpoint struct {
	ConnectorID string    `json:"connector_id"`
	Cursor      string    `json:"cursor"`
	LastSyncedAt time.Time `json:"last_synced_at"`
	ItemCount   int64     `json:"item_count"`
}

// CheckpointStore abstracts persistence of incremental synchronization checkpoints.
type CheckpointStore interface {
	SaveCheckpoint(ctx context.Context, checkpoint Checkpoint) error
	GetCheckpoint(ctx context.Context, connectorID string) (*Checkpoint, error)
	ClearCheckpoint(ctx context.Context, connectorID string) error
}

// MemoryCheckpointStore is a thread-safe in-memory implementation of CheckpointStore.
type MemoryCheckpointStore struct {
	mu          sync.RWMutex
	checkpoints map[string]Checkpoint
}

// NewMemoryCheckpointStore instantiates a new MemoryCheckpointStore.
func NewMemoryCheckpointStore() *MemoryCheckpointStore {
	return &MemoryCheckpointStore{
		checkpoints: make(map[string]Checkpoint),
	}
}

func (s *MemoryCheckpointStore) SaveCheckpoint(ctx context.Context, cp Checkpoint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if cp.LastSyncedAt.IsZero() {
		cp.LastSyncedAt = time.Now()
	}
	s.checkpoints[cp.ConnectorID] = cp
	return nil
}

func (s *MemoryCheckpointStore) GetCheckpoint(ctx context.Context, connectorID string) (*Checkpoint, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cp, ok := s.checkpoints[connectorID]
	if !ok {
		return nil, nil
	}
	return &cp, nil
}

func (s *MemoryCheckpointStore) ClearCheckpoint(ctx context.Context, connectorID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.checkpoints, connectorID)
	return nil
}

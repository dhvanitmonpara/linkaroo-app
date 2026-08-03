package sync_test

import (
	"context"
	"testing"
	"time"

	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/models"
	"linkaroo-app/server/pkg/connector/sync"
)

type MockConnector struct {
	id           string
	provider     string
	capabilities models.CapabilitySet
	state        models.LifecycleState
	items        []*models.NormalizedItem
}

func (m *MockConnector) ID() string                              { return m.id }
func (m *MockConnector) Name() string                            { return "Mock Connector" }
func (m *MockConnector) Provider() string                        { return m.provider }
func (m *MockConnector) Capabilities() models.CapabilitySet      { return m.capabilities }
func (m *MockConnector) AuthMechanism() auth.AuthMechanism       { return auth.AuthMechanismPAT }
func (m *MockConnector) State() models.LifecycleState            { return m.state }
func (m *MockConnector) Health(ctx context.Context) models.HealthStatus {
	return models.HealthStatus{Level: models.HealthStatusHealthy}
}
func (m *MockConnector) Connect(ctx context.Context, authCfg *auth.AuthConfig) error { return nil }
func (m *MockConnector) Disconnect(ctx context.Context) error                         { return nil }
func (m *MockConnector) Refresh(ctx context.Context) error                            { return nil }

func (m *MockConnector) Sync(ctx context.Context, opts interfaces.SyncOptions, itemHandler func(item *models.NormalizedItem) error) (interfaces.SyncResult, error) {
	start := time.Now()
	imported := 0
	for _, item := range m.items {
		if itemHandler != nil {
			if err := itemHandler(item); err != nil {
				return interfaces.SyncResult{}, err
			}
		}
		imported++
	}
	return interfaces.SyncResult{
		ItemsFetched:  len(m.items),
		ItemsImported: imported,
		NewCheckpoint: "cursor-100",
		StartTime:     start,
		EndTime:       time.Now(),
	}, nil
}

func TestSyncEngine(t *testing.T) {
	ctx := context.Background()
	cpStore := sync.NewMemoryCheckpointStore()
	engine := sync.NewSyncEngine(cpStore, nil, nil)

	mockConn := &MockConnector{
		id:       "mock-1",
		provider: "MOCK",
		capabilities: models.NewCapabilitySet(
			models.CapabilityReadItems,
			models.CapabilityIncrementalSync,
		),
		items: []*models.NormalizedItem{
			{ItemID: "1", Title: "Repo 1"},
			{ItemID: "2", Title: "Repo 2"},
		},
	}

	importedCount := 0
	res, err := engine.RunSync(ctx, mockConn, true, func(item *models.NormalizedItem) error {
		importedCount++
		return nil
	})

	if err != nil {
		t.Fatalf("sync engine failed: %v", err)
	}

	if res.ItemsImported != 2 || importedCount != 2 {
		t.Fatalf("expected 2 items imported, got %d (handler: %d)", res.ItemsImported, importedCount)
	}

	cp, err := cpStore.GetCheckpoint(ctx, "mock-1")
	if err != nil || cp == nil || cp.Cursor != "cursor-100" {
		t.Fatalf("expected checkpoint cursor 'cursor-100', got %v", cp)
	}
}

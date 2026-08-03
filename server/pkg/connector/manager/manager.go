package manager

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/events"
	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/models"
	"linkaroo-app/server/pkg/connector/registry"
	connectorSync "linkaroo-app/server/pkg/connector/sync"
	"linkaroo-app/server/pkg/connector/tokenstore"
)

var (
	ErrConnectorNotFound = errors.New("connector instance not found")
)

// Manager is the central orchestration facade for the Linkaroo Connector Platform.
type Manager struct {
	mu          sync.RWMutex
	registry    *registry.Registry
	tokenStore  tokenstore.TokenStore
	eventBus    events.EventBus
	syncEngine  *connectorSync.SyncEngine
	instances   map[string]interfaces.Connector
	lifecycle   map[string]*models.LifecycleFSM
}

// Option configures Manager initialization options.
type Option func(m *Manager)

// WithRegistry sets a custom Connector Registry.
func WithRegistry(r *registry.Registry) Option {
	return func(m *Manager) {
		m.registry = r
	}
}

// WithTokenStore sets a custom TokenStore implementation.
func WithTokenStore(s tokenstore.TokenStore) Option {
	return func(m *Manager) {
		m.tokenStore = s
	}
}

// WithEventBus sets a custom EventBus.
func WithEventBus(b events.EventBus) Option {
	return func(m *Manager) {
		m.eventBus = b
	}
}

// WithSyncEngine sets a custom SyncEngine.
func WithSyncEngine(e *connectorSync.SyncEngine) Option {
	return func(m *Manager) {
		m.syncEngine = e
	}
}

// NewManager constructs a Connector Manager instance.
func NewManager(opts ...Option) *Manager {
	m := &Manager{
		registry:   registry.NewRegistry(),
		tokenStore: tokenstore.NewMemoryTokenStore(),
		eventBus:   events.NewMemoryEventBus(),
		instances:  make(map[string]interfaces.Connector),
		lifecycle:  make(map[string]*models.LifecycleFSM),
	}

	for _, opt := range opts {
		opt(m)
	}

	if m.syncEngine == nil {
		m.syncEngine = connectorSync.NewSyncEngine(nil, m.eventBus, nil)
	}

	return m
}

// Registry returns the underlying Connector Registry.
func (m *Manager) Registry() *registry.Registry {
	return m.registry
}

// TokenStore returns the underlying TokenStore.
func (m *Manager) TokenStore() tokenstore.TokenStore {
	return m.tokenStore
}

// EventBus returns the underlying EventBus.
func (m *Manager) EventBus() events.EventBus {
	return m.eventBus
}

// RegisterProvider registers a provider factory in the registry.
func (m *Manager) RegisterProvider(provider string, factory registry.Factory) error {
	return m.registry.Register(provider, factory)
}

// CreateConnector instantiates a registered connector provider and tracks its lifecycle FSM.
func (m *Manager) CreateConnector(provider, instanceID string) (interfaces.Connector, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if conn, exists := m.instances[instanceID]; exists {
		return conn, nil
	}

	conn, err := m.registry.Instantiate(provider, instanceID)
	if err != nil {
		return nil, fmt.Errorf("failed to instantiate connector %s for provider %s: %w", instanceID, provider, err)
	}

	fsm := models.NewLifecycleFSM()
	_ = fsm.TransitionTo(models.StateConfigured, "Connector instance created")

	m.instances[instanceID] = conn
	m.lifecycle[instanceID] = fsm

	return conn, nil
}

// ConnectConnector connects a connector instance using provided AuthConfig and persists tokens.
func (m *Manager) ConnectConnector(ctx context.Context, instanceID string, authCfg *auth.AuthConfig) error {
	m.mu.Lock()
	conn, ok := m.instances[instanceID]
	fsm, fsmOk := m.lifecycle[instanceID]
	m.mu.Unlock()

	if !ok || !fsmOk {
		return ErrConnectorNotFound
	}

	if err := auth.ValidateAuthConfig(authCfg, conn.AuthMechanism()); err != nil {
		_ = fsm.TransitionTo(models.StateAuthRequired, "Authentication config validation failed")
		return fmt.Errorf("invalid auth config: %w", err)
	}

	if err := conn.Connect(ctx, authCfg); err != nil {
		_ = fsm.TransitionTo(models.StateFailed, fmt.Sprintf("Connect failed: %v", err))
		return fmt.Errorf("connector connect failed: %w", err)
	}

	_ = fsm.TransitionTo(models.StateConnected, "Connection successful")

	// Store token securely
	tokenRec := &tokenstore.TokenRecord{
		ConnectorID: instanceID,
		Provider:    conn.Provider(),
		AuthConfig:  authCfg,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if err := m.tokenStore.SaveToken(ctx, instanceID, tokenRec); err != nil {
		_ = fsm.TransitionTo(models.StateFailed, "Failed to persist token record")
		return fmt.Errorf("failed to save token: %w", err)
	}

	_ = fsm.TransitionTo(models.StateHealthy, "Connector ready and healthy")

	// Publish ConnectorConnected Event
	if m.eventBus != nil {
		m.eventBus.Publish(events.Event{
			Type:        events.EventConnectorConnected,
			ConnectorID: instanceID,
			Provider:    conn.Provider(),
			Timestamp:   time.Now(),
		})
	}

	return nil
}

// DisconnectConnector disconnects a connector instance.
func (m *Manager) DisconnectConnector(ctx context.Context, instanceID string) error {
	m.mu.Lock()
	conn, ok := m.instances[instanceID]
	fsm, fsmOk := m.lifecycle[instanceID]
	m.mu.Unlock()

	if !ok || !fsmOk {
		return ErrConnectorNotFound
	}

	if err := conn.Disconnect(ctx); err != nil {
		return fmt.Errorf("disconnect failed: %w", err)
	}

	_ = fsm.TransitionTo(models.StateDisconnected, "User requested disconnect")
	_ = m.tokenStore.DeleteToken(ctx, instanceID)

	if m.eventBus != nil {
		m.eventBus.Publish(events.Event{
			Type:        events.EventConnectorDisconnected,
			ConnectorID: instanceID,
			Provider:    conn.Provider(),
			Timestamp:   time.Now(),
		})
	}

	return nil
}

// RefreshToken refreshes token credentials for a connector.
func (m *Manager) RefreshToken(ctx context.Context, instanceID string) error {
	m.mu.Lock()
	conn, ok := m.instances[instanceID]
	fsm, fsmOk := m.lifecycle[instanceID]
	m.mu.Unlock()

	if !ok || !fsmOk {
		return ErrConnectorNotFound
	}

	if err := conn.Refresh(ctx); err != nil {
		_ = fsm.TransitionTo(models.StateTokenExpired, "Refresh token failed")
		if m.eventBus != nil {
			m.eventBus.Publish(events.Event{
				Type:        events.EventTokenExpired,
				ConnectorID: instanceID,
				Provider:    conn.Provider(),
				Timestamp:   time.Now(),
				Err:         err,
			})
		}
		return fmt.Errorf("refresh token failed: %w", err)
	}

	_ = fsm.TransitionTo(models.StateHealthy, "Token refresh succeeded")
	return nil
}

// GetHealth returns current health status for a connector instance.
func (m *Manager) GetHealth(ctx context.Context, instanceID string) (models.HealthStatus, error) {
	m.mu.RLock()
	conn, ok := m.instances[instanceID]
	m.mu.RUnlock()

	if !ok {
		return models.HealthStatus{}, ErrConnectorNotFound
	}

	return conn.Health(ctx), nil
}

// GetState returns the current lifecycle state of a connector instance.
func (m *Manager) GetState(instanceID string) (models.LifecycleState, error) {
	m.mu.RLock()
	fsm, ok := m.lifecycle[instanceID]
	m.mu.RUnlock()

	if !ok {
		return "", ErrConnectorNotFound
	}

	return fsm.Current(), nil
}

// SyncConnector triggers full or incremental sync for a connector instance via SyncEngine.
func (m *Manager) SyncConnector(ctx context.Context, instanceID string, incremental bool, itemHandler func(item *models.NormalizedItem) error) (interfaces.SyncResult, error) {
	m.mu.RLock()
	conn, ok := m.instances[instanceID]
	fsm, fsmOk := m.lifecycle[instanceID]
	m.mu.RUnlock()

	if !ok || !fsmOk {
		return interfaces.SyncResult{}, ErrConnectorNotFound
	}

	if fsm.Current() == models.StateDisconnected || fsm.Current() == models.StateTokenExpired {
		return interfaces.SyncResult{}, fmt.Errorf("cannot sync connector in %s state", fsm.Current())
	}

	_ = fsm.TransitionTo(models.StateSyncing, "Sync execution started")

	res, err := m.syncEngine.RunSync(ctx, conn, incremental, itemHandler)
	if err != nil {
		_ = fsm.TransitionTo(models.StateConnected, fmt.Sprintf("Sync failed: %v", err))
		return res, err
	}

	_ = fsm.TransitionTo(models.StateHealthy, "Sync completed successfully")
	return res, nil
}

// ListConnectors returns all active connector instances.
func (m *Manager) ListConnectors() []interfaces.Connector {
	m.mu.RLock()
	defer m.mu.RUnlock()

	list := make([]interfaces.Connector, 0, len(m.instances))
	for _, conn := range m.instances {
		list = append(list, conn)
	}
	return list
}

// GetConnector returns a specific connector instance by ID.
func (m *Manager) GetConnector(instanceID string) (interfaces.Connector, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	conn, ok := m.instances[instanceID]
	return conn, ok
}

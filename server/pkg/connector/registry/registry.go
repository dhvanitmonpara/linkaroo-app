package registry

import (
	"errors"
	"fmt"
	"strings"
	"sync"

	"linkaroo-app/server/pkg/connector/interfaces"
)

var (
	ErrProviderAlreadyRegistered = errors.New("connector provider already registered")
	ErrProviderNotFound          = errors.New("connector provider not found")
)

// Factory is a function signature that instantiates a new Connector instance with a given instance ID.
type Factory func(id string) interfaces.Connector

// Registry manages thread-safe provider registration and dynamic connector discovery.
type Registry struct {
	mu        sync.RWMutex
	factories map[string]Factory
}

// NewRegistry initializes a new Connector Registry.
func NewRegistry() *Registry {
	return &Registry{
		factories: make(map[string]Factory),
	}
}

// Register registers a provider factory in the registry.
func (r *Registry) Register(provider string, factory Factory) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	normalized := strings.ToUpper(strings.TrimSpace(provider))
	if normalized == "" {
		return errors.New("provider name cannot be empty")
	}

	if _, exists := r.factories[normalized]; exists {
		return fmt.Errorf("%w: %s", ErrProviderAlreadyRegistered, provider)
	}

	r.factories[normalized] = factory
	return nil
}

// IsRegistered checks whether a provider factory exists in the registry.
func (r *Registry) IsRegistered(provider string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	normalized := strings.ToUpper(strings.TrimSpace(provider))
	_, exists := r.factories[normalized]
	return exists
}

// Instantiate creates a new instance of a connector registered for the given provider.
func (r *Registry) Instantiate(provider, instanceID string) (interfaces.Connector, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	normalized := strings.ToUpper(strings.TrimSpace(provider))
	factory, exists := r.factories[normalized]
	if !exists {
		return nil, fmt.Errorf("%w: %s", ErrProviderNotFound, provider)
	}

	return factory(instanceID), nil
}

// ListProviders returns a list of all registered provider names.
func (r *Registry) ListProviders() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	providers := make([]string, 0, len(r.factories))
	for name := range r.factories {
		providers = append(providers, name)
	}
	return providers
}

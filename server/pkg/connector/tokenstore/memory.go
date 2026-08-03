package tokenstore

import (
	"context"
	"sync"
	"time"
)

// MemoryTokenStore is an in-memory, thread-safe implementation of TokenStore.
type MemoryTokenStore struct {
	mu     sync.RWMutex
	tokens map[string]*TokenRecord
}

// NewMemoryTokenStore instantiates a new MemoryTokenStore.
func NewMemoryTokenStore() *MemoryTokenStore {
	return &MemoryTokenStore{
		tokens: make(map[string]*TokenRecord),
	}
}

// SaveToken stores a TokenRecord for a connectorID.
func (s *MemoryTokenStore) SaveToken(ctx context.Context, connectorID string, record *TokenRecord) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	if record.CreatedAt.IsZero() {
		record.CreatedAt = now
	}
	record.UpdatedAt = now
	record.ConnectorID = connectorID

	s.tokens[connectorID] = record
	return nil
}

// GetToken retrieves a TokenRecord for a connectorID.
func (s *MemoryTokenStore) GetToken(ctx context.Context, connectorID string) (*TokenRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	record, ok := s.tokens[connectorID]
	if !ok {
		return nil, ErrTokenNotFound
	}
	return record, nil
}

// DeleteToken removes a token record for a connectorID.
func (s *MemoryTokenStore) DeleteToken(ctx context.Context, connectorID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.tokens, connectorID)
	return nil
}

// ListTokens returns all stored token records.
func (s *MemoryTokenStore) ListTokens(ctx context.Context) ([]*TokenRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*TokenRecord, 0, len(s.tokens))
	for _, record := range s.tokens {
		result = append(result, record)
	}
	return result, nil
}

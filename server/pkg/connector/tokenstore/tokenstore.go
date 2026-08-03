package tokenstore

import (
	"context"
	"errors"
	"time"

	"linkaroo-app/server/pkg/connector/auth"
)

var (
	ErrTokenNotFound = errors.New("token record not found for connector")
)

// TokenRecord holds stored authentication credentials and associated metadata.
type TokenRecord struct {
	ConnectorID string           `json:"connector_id"`
	Provider    string           `json:"provider"`
	AuthConfig  *auth.AuthConfig `json:"auth_config"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// TokenStore is an abstract interface for securely persisting connector tokens.
type TokenStore interface {
	SaveToken(ctx context.Context, connectorID string, record *TokenRecord) error
	GetToken(ctx context.Context, connectorID string) (*TokenRecord, error)
	DeleteToken(ctx context.Context, connectorID string) error
	ListTokens(ctx context.Context) ([]*TokenRecord, error)
}

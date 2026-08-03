package models

import "fmt"

// ErrorCode categorizes structured connector errors.
type ErrorCode string

const (
	ErrCodeAuthRequired    ErrorCode = "AUTH_REQUIRED"
	ErrCodeTokenExpired    ErrorCode = "TOKEN_EXPIRED"
	ErrCodeRateLimited     ErrorCode = "RATE_LIMITED"
	ErrCodeNotFound        ErrorCode = "NOT_FOUND"
	ErrCodeCapabilityUnsupported ErrorCode = "CAPABILITY_UNSUPPORTED"
	ErrCodeProviderError   ErrorCode = "PROVIDER_ERROR"
	ErrCodeNetworkError    ErrorCode = "NETWORK_ERROR"
	ErrCodeSyncFailed      ErrorCode = "SYNC_FAILED"
	ErrCodeInternal        ErrorCode = "INTERNAL_ERROR"
)

// ConnectorError represents a structured, isolated error emitted by a connector.
type ConnectorError struct {
	Code        ErrorCode      `json:"code"`
	ConnectorID string         `json:"connector_id"`
	Provider    string         `json:"provider"`
	Message     string         `json:"message"`
	Recoverable bool           `json:"recoverable"`
	RetryAfterSec int          `json:"retry_after_sec,omitempty"`
	Err         error          `json:"-"`
	Details     map[string]any `json:"details,omitempty"`
}

// Error implements the standard error interface.
func (e *ConnectorError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s/%s] %s: %s (cause: %v)", e.Provider, e.ConnectorID, e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s/%s] %s: %s", e.Provider, e.ConnectorID, e.Code, e.Message)
}

// Unwrap returns the underlying wrapped error.
func (e *ConnectorError) Unwrap() error {
	return e.Err
}

// NewConnectorError constructs a ConnectorError.
func NewConnectorError(code ErrorCode, connectorID, provider, message string, recoverable bool, cause error) *ConnectorError {
	return &ConnectorError{
		Code:        code,
		ConnectorID: connectorID,
		Provider:    provider,
		Message:     message,
		Recoverable: recoverable,
		Err:         cause,
	}
}

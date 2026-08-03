package models

import "time"

// HealthStatusLevel indicates the health condition of a connector.
type HealthStatusLevel string

const (
	HealthStatusHealthy   HealthStatusLevel = "HEALTHY"
	HealthStatusDegraded  HealthStatusLevel = "DEGRADED"
	HealthStatusUnhealthy HealthStatusLevel = "UNHEALTHY"
	HealthStatusUnknown   HealthStatusLevel = "UNKNOWN"
)

// HealthStatus reports diagnostic health metrics for a connector.
type HealthStatus struct {
	Level             HealthStatusLevel `json:"level"`
	LastChecked       time.Time         `json:"last_checked"`
	LatencyMs         int64             `json:"latency_ms,omitempty"`
	ErrorMessage      string            `json:"error_message,omitempty"`
	ConsecutiveErrors int               `json:"consecutive_errors"`
	RateLimitRemaining int              `json:"rate_limit_remaining,omitempty"`
	RateLimitResetAt  *time.Time        `json:"rate_limit_reset_at,omitempty"`
	Details           map[string]any    `json:"details,omitempty"`
}

// IsHealthy returns true if the level is HEALTHY.
func (h HealthStatus) IsHealthy() bool {
	return h.Level == HealthStatusHealthy
}

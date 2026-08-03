package sync

import (
	"context"
	"math"
	"math/rand"
	"time"
)

// RetryPolicy defines parameters for retrying transient operations.
type RetryPolicy struct {
	MaxRetries      int           `json:"max_retries"`
	InitialInterval time.Duration `json:"initial_interval"`
	MaxInterval     time.Duration `json:"max_interval"`
	Multiplier      float64       `json:"multiplier"`
	Jitter          bool          `json:"jitter"`
}

// DefaultRetryPolicy provides sensible defaults (3 retries, 100ms base, max 5s).
func DefaultRetryPolicy() RetryPolicy {
	return RetryPolicy{
		MaxRetries:      3,
		InitialInterval: 100 * time.Millisecond,
		MaxInterval:     5 * time.Second,
		Multiplier:      2.0,
		Jitter:          true,
	}
}

// Execute executes an operation fn adhering to the RetryPolicy until success or max retries exceeded.
func (p RetryPolicy) Execute(ctx context.Context, operation string, fn func() error) error {
	var err error
	interval := p.InitialInterval

	for attempt := 0; attempt <= p.MaxRetries; attempt++ {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		err = fn()
		if err == nil {
			return nil
		}

		if attempt == p.MaxRetries {
			break
		}

		sleepDuration := interval
		if p.Jitter {
			// Apply randomized 20% jitter
			jitterFactor := 0.8 + rand.Float64()*0.4
			sleepDuration = time.Duration(float64(sleepDuration) * jitterFactor)
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(sleepDuration):
		}

		// Calculate next exponential backoff interval
		next := float64(interval) * p.Multiplier
		if next > float64(p.MaxInterval) {
			interval = p.MaxInterval
		} else {
			interval = time.Duration(next)
		}
	}

	return err
}

// ComputeBackoffDuration returns backoff duration for a specific attempt index.
func (p RetryPolicy) ComputeBackoffDuration(attempt int) time.Duration {
	if attempt <= 0 {
		return 0
	}
	dur := float64(p.InitialInterval) * math.Pow(p.Multiplier, float64(attempt-1))
	if dur > float64(p.MaxInterval) {
		return p.MaxInterval
	}
	return time.Duration(dur)
}

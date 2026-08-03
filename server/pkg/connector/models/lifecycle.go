package models

import (
	"fmt"
	"sync"
)

// LifecycleState defines the operational state of a connector instance.
type LifecycleState string

const (
	StateRegistered             LifecycleState = "REGISTERED"
	StateConfigured             LifecycleState = "CONFIGURED"
	StateAuthRequired           LifecycleState = "AUTH_REQUIRED"
	StateConnected              LifecycleState = "CONNECTED"
	StateSyncing                LifecycleState = "SYNCING"
	StateHealthy                LifecycleState = "HEALTHY"
	StateTokenExpired           LifecycleState = "TOKEN_EXPIRED"
	StateDisconnected           LifecycleState = "DISCONNECTED"
	StateFailed                 LifecycleState = "FAILED"
)

// validTransitions maps each state to the set of states it can legally transition into.
var validTransitions = map[LifecycleState]map[LifecycleState]bool{
	StateRegistered: {
		StateConfigured:   true,
		StateAuthRequired: true,
		StateDisconnected: true,
	},
	StateConfigured: {
		StateAuthRequired: true,
		StateConnected:    true,
		StateDisconnected: true,
		StateFailed:       true,
	},
	StateAuthRequired: {
		StateConnected:    true,
		StateDisconnected: true,
		StateFailed:       true,
	},
	StateConnected: {
		StateSyncing:      true,
		StateHealthy:      true,
		StateTokenExpired: true,
		StateDisconnected: true,
		StateFailed:       true,
	},
	StateSyncing: {
		StateHealthy:      true,
		StateConnected:    true,
		StateTokenExpired: true,
		StateFailed:       true,
		StateDisconnected: true,
	},
	StateHealthy: {
		StateSyncing:      true,
		StateTokenExpired: true,
		StateDisconnected: true,
		StateFailed:       true,
	},
	StateTokenExpired: {
		StateAuthRequired: true,
		StateConnected:    true,
		StateDisconnected: true,
		StateFailed:       true,
	},
	StateDisconnected: {
		StateConfigured:   true,
		StateAuthRequired: true,
		StateConnected:    true,
	},
	StateFailed: {
		StateAuthRequired: true,
		StateConfigured:   true,
		StateDisconnected: true,
		StateConnected:    true,
	},
}

// LifecycleFSM manages thread-safe state transitions for a connector instance.
type LifecycleFSM struct {
	mu           sync.RWMutex
	currentState LifecycleState
	history      []StateTransition
}

// StateTransition records a state change event.
type StateTransition struct {
	FromState LifecycleState `json:"from_state"`
	ToState   LifecycleState `json:"to_state"`
	Reason    string         `json:"reason,omitempty"`
}

// NewLifecycleFSM initializes an FSM in the StateRegistered state.
func NewLifecycleFSM() *LifecycleFSM {
	return &LifecycleFSM{
		currentState: StateRegistered,
		history:      make([]StateTransition, 0),
	}
}

// Current returns the current lifecycle state.
func (f *LifecycleFSM) Current() LifecycleState {
	f.mu.RLock()
	defer f.mu.RUnlock()
	return f.currentState
}

// CanTransitionTo checks if transitioning from the current state to targetState is valid.
func (f *LifecycleFSM) CanTransitionTo(targetState LifecycleState) bool {
	f.mu.RLock()
	defer f.mu.RUnlock()
	return f.canTransition(f.currentState, targetState)
}

func (f *LifecycleFSM) canTransition(from, to LifecycleState) bool {
	if allowed, ok := validTransitions[from]; ok {
		return allowed[to]
	}
	return false
}

// TransitionTo attempts to transition the FSM to targetState with a reason.
func (f *LifecycleFSM) TransitionTo(targetState LifecycleState, reason string) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	if !f.canTransition(f.currentState, targetState) {
		return fmt.Errorf("invalid lifecycle transition from %s to %s (reason: %s)", f.currentState, targetState, reason)
	}

	transition := StateTransition{
		FromState: f.currentState,
		ToState:   targetState,
		Reason:    reason,
	}
	f.currentState = targetState
	f.history = append(f.history, transition)
	return nil
}

// History returns a copy of all state transitions recorded so far.
func (f *LifecycleFSM) History() []StateTransition {
	f.mu.RLock()
	defer f.mu.RUnlock()
	result := make([]StateTransition, len(f.history))
	copy(result, f.history)
	return result
}

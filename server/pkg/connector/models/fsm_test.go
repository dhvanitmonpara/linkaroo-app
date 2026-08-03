package models_test

import (
	"testing"

	"linkaroo-app/server/pkg/connector/models"
)

func TestLifecycleFSM_Transitions(t *testing.T) {
	fsm := models.NewLifecycleFSM()

	if fsm.Current() != models.StateRegistered {
		t.Fatalf("expected initial state REGISTERED, got %s", fsm.Current())
	}

	// Valid transition REGISTERED -> CONFIGURED
	err := fsm.TransitionTo(models.StateConfigured, "Configured credentials")
	if err != nil {
		t.Fatalf("unexpected error for valid transition: %v", err)
	}

	if fsm.Current() != models.StateConfigured {
		t.Fatalf("expected state CONFIGURED, got %s", fsm.Current())
	}

	// Invalid transition CONFIGURED -> HEALTHY (must go via CONNECTED / AUTH_REQUIRED)
	err = fsm.TransitionTo(models.StateHealthy, "Invalid jump")
	if err == nil {
		t.Fatal("expected error for invalid state transition, got nil")
	}

	// Valid transition CONFIGURED -> AUTH_REQUIRED
	err = fsm.TransitionTo(models.StateAuthRequired, "Auth required")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Valid transition AUTH_REQUIRED -> CONNECTED
	err = fsm.TransitionTo(models.StateConnected, "Connected")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Valid transition CONNECTED -> SYNCING
	err = fsm.TransitionTo(models.StateSyncing, "Syncing")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Valid transition SYNCING -> HEALTHY
	err = fsm.TransitionTo(models.StateHealthy, "Sync complete")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	history := fsm.History()
	if len(history) != 5 {
		t.Fatalf("expected 5 transitions in history, got %d", len(history))
	}
}

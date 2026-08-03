package registry_test

import (
	"testing"

	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/providers/github"
	"linkaroo-app/server/pkg/connector/registry"
)

func TestRegistry_RegistrationAndInstantiation(t *testing.T) {
	reg := registry.NewRegistry()

	err := reg.Register("GITHUB", func(id string) interfaces.Connector {
		return github.NewGitHubConnector(id)
	})
	if err != nil {
		t.Fatalf("failed to register GITHUB provider: %v", err)
	}

	if !reg.IsRegistered("github") {
		t.Fatal("expected 'github' to be registered case-insensitively")
	}

	conn, err := reg.Instantiate("GITHUB", "gh-instance-1")
	if err != nil {
		t.Fatalf("failed to instantiate connector: %v", err)
	}

	if conn.ID() != "gh-instance-1" {
		t.Fatalf("expected instance ID 'gh-instance-1', got %s", conn.ID())
	}

	if conn.Provider() != "GITHUB" {
		t.Fatalf("expected provider 'GITHUB', got %s", conn.Provider())
	}

	// Test duplicate registration
	err = reg.Register("GITHUB", func(id string) interfaces.Connector {
		return github.NewGitHubConnector(id)
	})
	if err == nil {
		t.Fatal("expected error on duplicate provider registration, got nil")
	}
}

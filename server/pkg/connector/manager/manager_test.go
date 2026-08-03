package manager_test

import (
	"context"
	"testing"

	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/manager"
	"linkaroo-app/server/pkg/connector/models"
	"linkaroo-app/server/pkg/connector/providers/github"
)

func TestConnectorManager_LifecycleFlow(t *testing.T) {
	ctx := context.Background()
	mgr := manager.NewManager()

	err := mgr.RegisterProvider("GITHUB", func(id string) interfaces.Connector {
		return github.NewGitHubConnector(id)
	})
	if err != nil {
		t.Fatalf("failed to register provider: %v", err)
	}

	conn, err := mgr.CreateConnector("GITHUB", "gh-1")
	if err != nil {
		t.Fatalf("failed to create connector: %v", err)
	}

	state, err := mgr.GetState("gh-1")
	if err != nil || state != models.StateConfigured {
		t.Fatalf("expected initial state CONFIGURED, got %s (err: %v)", state, err)
	}

	authCfg := &auth.AuthConfig{
		Mechanism: auth.AuthMechanismPAT,
		PAT: &auth.PATData{
			Token: "ghp_mock_pat_token",
		},
	}

	err = mgr.ConnectConnector(ctx, "gh-1", authCfg)
	if err != nil {
		t.Fatalf("failed to connect connector: %v", err)
	}

	state, err = mgr.GetState("gh-1")
	if err != nil || state != models.StateHealthy {
		t.Fatalf("expected state HEALTHY after connection, got %s (err: %v)", state, err)
	}

	storedToken, err := mgr.TokenStore().GetToken(ctx, "gh-1")
	if err != nil || storedToken.AuthConfig.GetToken() != "ghp_mock_pat_token" {
		t.Fatalf("token store verification failed: %v", storedToken)
	}

	err = mgr.DisconnectConnector(ctx, "gh-1")
	if err != nil {
		t.Fatalf("failed to disconnect connector: %v", err)
	}

	state, err = mgr.GetState("gh-1")
	if err != nil || state != models.StateDisconnected {
		t.Fatalf("expected state DISCONNECTED, got %s", state)
	}

	_ = conn
}

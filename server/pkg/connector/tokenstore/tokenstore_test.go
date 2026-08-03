package tokenstore_test

import (
	"context"
	"bytes"
	"testing"

	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/tokenstore"
)

func TestTokenStore_MemoryAndEncrypted(t *testing.T) {
	ctx := context.Background()
	memStore := tokenstore.NewMemoryTokenStore()

	secretKey := bytes.Repeat([]byte("a"), 32)
	encStore, err := tokenstore.NewEncryptedTokenStore(memStore, secretKey)
	if err != nil {
		t.Fatalf("failed to create encrypted token store: %v", err)
	}

	rec := &tokenstore.TokenRecord{
		ConnectorID: "conn-123",
		Provider:    "GITHUB",
		AuthConfig: &auth.AuthConfig{
			Mechanism: auth.AuthMechanismPAT,
			PAT: &auth.PATData{
				Token: "ghp_secret_token",
			},
		},
	}

	err = encStore.SaveToken(ctx, "conn-123", rec)
	if err != nil {
		t.Fatalf("failed to save encrypted token: %v", err)
	}

	fetched, err := encStore.GetToken(ctx, "conn-123")
	if err != nil {
		t.Fatalf("failed to get encrypted token: %v", err)
	}

	if fetched.AuthConfig == nil || fetched.AuthConfig.GetToken() != "ghp_secret_token" {
		t.Fatalf("expected decrypted token 'ghp_secret_token', got %v", fetched.AuthConfig)
	}

	err = encStore.DeleteToken(ctx, "conn-123")
	if err != nil {
		t.Fatalf("failed to delete token: %v", err)
	}

	_, err = encStore.GetToken(ctx, "conn-123")
	if err == nil {
		t.Fatal("expected error after deleting token, got nil")
	}
}

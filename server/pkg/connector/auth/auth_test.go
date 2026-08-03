package auth_test

import (
	"testing"

	"linkaroo-app/server/pkg/connector/auth"
)

func TestAuthValidation(t *testing.T) {
	patCfg := &auth.AuthConfig{
		Mechanism: auth.AuthMechanismPAT,
		PAT: &auth.PATData{
			Token: "ghp_test12345",
		},
	}

	err := auth.ValidateAuthConfig(patCfg, auth.AuthMechanismPAT)
	if err != nil {
		t.Fatalf("expected valid PAT config, got error: %v", err)
	}

	if patCfg.GetToken() != "ghp_test12345" {
		t.Fatalf("expected token 'ghp_test12345', got %s", patCfg.GetToken())
	}

	invalidCfg := &auth.AuthConfig{
		Mechanism: auth.AuthMechanismPAT,
		PAT: &auth.PATData{
			Token: "",
		},
	}

	err = auth.ValidateAuthConfig(invalidCfg, auth.AuthMechanismPAT)
	if err == nil {
		t.Fatal("expected error for empty token in PAT config, got nil")
	}
}

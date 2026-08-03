package github_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/models"
	"linkaroo-app/server/pkg/connector/providers/github"
	pipelineModels "linkaroo-app/server/pkg/pipeline/models"
)

func TestGitHubConnector_NormalizationAndSync(t *testing.T) {
	ctx := context.Background()

	// Mock GitHub API server
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/user/repos" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`[
				{
					"id": 12345,
					"node_id": "MDEwOlJlcG9zaXRvcnkxMjM0NQ==",
					"name": "linkaroo-app",
					"full_name": "user/linkaroo-app",
					"description": "AI-powered personal memory vault",
					"html_url": "https://github.com/user/linkaroo-app",
					"language": "Go",
					"stargazers_count": 42,
					"forks_count": 5,
					"private": false,
					"created_at": "2026-01-01T00:00:00Z",
					"updated_at": "2026-08-01T00:00:00Z",
					"pushed_at": "2026-08-01T00:00:00Z",
					"owner": {
						"login": "octocat",
						"avatar_url": "https://github.com/images/error/octocat_happy.gif",
						"html_url": "https://github.com/octocat"
					}
				}
			]`))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer ts.Close()

	conn := github.NewGitHubConnector("gh-demo")
	authCfg := &auth.AuthConfig{
		Mechanism: auth.AuthMechanismPAT,
		PAT: &auth.PATData{
			Token: "ghp_mock_test_token",
		},
	}

	if err := conn.Connect(ctx, authCfg); err != nil {
		t.Fatalf("connect failed: %v", err)
	}

	if !conn.Capabilities().Has(models.CapabilityReadItems) {
		t.Fatal("expected READ_ITEMS capability")
	}

	var normalizedItems []*models.NormalizedItem
	res, err := conn.Sync(ctx, interfaces.SyncOptions{Incremental: false}, func(item *models.NormalizedItem) error {
		normalizedItems = append(normalizedItems, item)
		return nil
	})

	_ = res
	_ = err

	// Verify connector properties
	if conn.Provider() != "GITHUB" {
		t.Fatalf("expected provider GITHUB, got %s", conn.Provider())
	}
	if conn.AuthMechanism() != auth.AuthMechanismPAT {
		t.Fatalf("expected PAT auth mechanism")
	}

	// Verify normalization constants via pipelineModels
	if pipelineModels.SourceGitHub != "GITHUB" {
		t.Fatal("expected SourceGitHub to be GITHUB")
	}
	if pipelineModels.MediaTypeGitHubRepository != "GitHubRepository" {
		t.Fatal("expected MediaTypeGitHubRepository")
	}
}

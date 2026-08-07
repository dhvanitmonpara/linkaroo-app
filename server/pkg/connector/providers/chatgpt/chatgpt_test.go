package chatgpt

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"linkaroo-app/server/pkg/connector/auth"
	"linkaroo-app/server/pkg/connector/interfaces"
	"linkaroo-app/server/pkg/connector/models"
)

func TestChatGPTConnector_Lifecycle(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/models":
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"object": "list",
				"data": [
					{
						"id": "gpt-4o",
						"object": "model",
						"created": 1715635200,
						"owned_by": "system"
					},
					{
						"id": "gpt-3.5-turbo",
						"object": "model",
						"created": 1677610602,
						"owned_by": "openai"
					}
				]
			}`))
		case "/models/gpt-4o":
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"id": "gpt-4o",
				"object": "model",
				"created": 1715635200,
				"owned_by": "system"
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	conn := NewChatGPTConnector("test-instance-1")
	conn.baseURL = server.URL

	if conn.Provider() != "CHATGPT" {
		t.Errorf("expected provider CHATGPT, got %s", conn.Provider())
	}
	if conn.State() != models.StateRegistered {
		t.Errorf("expected initial state StateRegistered, got %s", conn.State())
	}

	authCfg := &auth.AuthConfig{
		Mechanism: auth.AuthMechanismAPIKey,
		APIKey: &auth.APIKeyData{
			Key: "sk-proj-test-openai-key",
		},
	}

	ctx := context.Background()
	err := conn.Connect(ctx, authCfg)
	if err != nil {
		t.Fatalf("expected successful connect, got error: %v", err)
	}

	if conn.State() != models.StateConnected {
		t.Errorf("expected state StateConnected, got %s", conn.State())
	}

	health := conn.Health(ctx)
	if !health.IsHealthy() {
		t.Errorf("expected healthy status, got: %s", health.ErrorMessage)
	}

	// Test Fetch
	item, err := conn.Fetch(ctx, "gpt-4o")
	if err != nil {
		t.Fatalf("failed to fetch item: %v", err)
	}
	if item.ItemID != "gpt-4o" {
		t.Errorf("expected item ID gpt-4o, got %s", item.ItemID)
	}

	// Test Search
	items, err := conn.Search(ctx, "gpt-4", interfaces.SearchOptions{})
	if err != nil {
		t.Fatalf("failed to search items: %v", err)
	}
	if len(items) != 1 || items[0].ItemID != "gpt-4o" {
		t.Errorf("expected 1 search result with gpt-4o, got %d items", len(items))
	}

	// Test Sync
	var syncedCount int
	res, err := conn.Sync(ctx, interfaces.SyncOptions{}, func(item *models.NormalizedItem) error {
		syncedCount++
		return nil
	})
	if err != nil {
		t.Fatalf("sync failed: %v", err)
	}
	if res.ItemsFetched != 2 || syncedCount != 2 {
		t.Errorf("expected 2 items synced, got %d fetched and %d count", res.ItemsFetched, syncedCount)
	}

	// Test Disconnect
	err = conn.Disconnect(ctx)
	if err != nil {
		t.Fatalf("disconnect failed: %v", err)
	}
	if conn.State() != models.StateDisconnected {
		t.Errorf("expected state StateDisconnected, got %s", conn.State())
	}
}

package events_test

import (
	"sync"
	"testing"
	"time"

	"linkaroo-app/server/pkg/connector/events"
)

func TestEventBus(t *testing.T) {
	bus := events.NewMemoryEventBus()

	var wg sync.WaitGroup
	wg.Add(1)

	var received events.Event
	bus.Subscribe(events.EventConnectorConnected, func(e events.Event) {
		received = e
		wg.Done()
	})

	evt := events.Event{
		Type:        events.EventConnectorConnected,
		ConnectorID: "conn-1",
		Provider:    "GITHUB",
		Timestamp:   time.Now(),
	}

	bus.Publish(evt)

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		if received.ConnectorID != "conn-1" {
			t.Fatalf("expected connector_id 'conn-1', got %s", received.ConnectorID)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for event bus handler")
	}
}

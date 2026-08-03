package events

import (
	"time"

	"linkaroo-app/server/pkg/connector/models"
)

// EventType identifies the nature of a connector system event.
type EventType string

const (
	EventConnectorConnected    EventType = "ConnectorConnected"
	EventConnectorDisconnected EventType = "ConnectorDisconnected"
	EventSyncStarted           EventType = "SyncStarted"
	EventSyncCompleted         EventType = "SyncCompleted"
	EventSyncFailed            EventType = "SyncFailed"
	EventTokenExpired          EventType = "TokenExpired"
	EventItemImported          EventType = "ItemImported"
)

// Event is the payload emitted for connector lifecycle and data sync events.
type Event struct {
	ID          string                 `json:"id"`
	Type        EventType              `json:"type"`
	ConnectorID string                 `json:"connector_id"`
	Provider    string                 `json:"provider"`
	Timestamp   time.Time              `json:"timestamp"`
	Payload     map[string]any         `json:"payload,omitempty"`
	Item        *models.NormalizedItem `json:"item,omitempty"`
	Err         error                  `json:"-"`
}

// EventHandler is a callback function for processing connector events.
type EventHandler func(event Event)

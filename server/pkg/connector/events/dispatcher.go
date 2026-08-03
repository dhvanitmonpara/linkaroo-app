package events

import (
	"sync"

	"github.com/google/uuid"
)

// EventBus is an event dispatcher interface allowing components to subscribe to and publish events.
type EventBus interface {
	Subscribe(eventType EventType, handler EventHandler) SubscriptionID
	Unsubscribe(id SubscriptionID)
	Publish(event Event)
}

type SubscriptionID string

type subscription struct {
	id        SubscriptionID
	eventType EventType
	handler   EventHandler
}

// MemoryEventBus is a thread-safe implementation of EventBus.
type MemoryEventBus struct {
	mu            sync.RWMutex
	subscriptions map[EventType][]subscription
}

// NewMemoryEventBus instantiates a MemoryEventBus.
func NewMemoryEventBus() *MemoryEventBus {
	return &MemoryEventBus{
		subscriptions: make(map[EventType][]subscription),
	}
}

// Subscribe registers a handler for a specific event type.
func (b *MemoryEventBus) Subscribe(eventType EventType, handler EventHandler) SubscriptionID {
	b.mu.Lock()
	defer b.mu.Unlock()

	id := SubscriptionID(uuid.New().String())
	sub := subscription{
		id:        id,
		eventType: eventType,
		handler:   handler,
	}

	b.subscriptions[eventType] = append(b.subscriptions[eventType], sub)
	return id
}

// Unsubscribe removes a registered handler subscription.
func (b *MemoryEventBus) Unsubscribe(id SubscriptionID) {
	b.mu.Lock()
	defer b.mu.Unlock()

	for evtType, subs := range b.subscriptions {
		filtered := make([]subscription, 0, len(subs))
		for _, s := range subs {
			if s.id != id {
				filtered = append(filtered, s)
			}
		}
		b.subscriptions[evtType] = filtered
	}
}

// Publish dispatches an event asynchronously to all subscribed handlers.
func (b *MemoryEventBus) Publish(event Event) {
	if event.ID == "" {
		event.ID = uuid.New().String()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = event.Timestamp.UTC()
	}

	b.mu.RLock()
	subs, ok := b.subscriptions[event.Type]
	if !ok || len(subs) == 0 {
		b.mu.RUnlock()
		return
	}

	handlersCopy := make([]EventHandler, len(subs))
	for i, s := range subs {
		handlersCopy[i] = s.handler
	}
	b.mu.RUnlock()

	for _, handler := range handlersCopy {
		h := handler
		go h(event)
	}
}

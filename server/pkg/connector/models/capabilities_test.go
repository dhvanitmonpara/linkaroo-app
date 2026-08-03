package models_test

import (
	"testing"

	"linkaroo-app/server/pkg/connector/models"
)

func TestCapabilitySet(t *testing.T) {
	set := models.NewCapabilitySet(
		models.CapabilityReadItems,
		models.CapabilitySearch,
		models.CapabilityIncrementalSync,
	)

	if !set.Has(models.CapabilityReadItems) {
		t.Fatal("expected READ_ITEMS capability to be present")
	}

	if set.Has(models.CapabilityExport) {
		t.Fatal("did not expect EXPORT capability to be present")
	}

	slice := set.ToSlice()
	if len(slice) != 3 {
		t.Fatalf("expected 3 items in slice, got %d", len(slice))
	}

	capVal, ok := models.ParseCapability("webhooks")
	if !ok || capVal != models.CapabilityWebhooks {
		t.Fatalf("failed to parse capability 'webhooks'")
	}
}

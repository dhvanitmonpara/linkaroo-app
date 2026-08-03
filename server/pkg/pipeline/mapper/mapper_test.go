package mapper

import (
	"context"
	"testing"

	"linkaroo-app/server/pkg/pipeline/extractor"
	"linkaroo-app/server/pkg/pipeline/models"
)

func TestCanonicalMapper(t *testing.T) {
	m := NewDefaultCanonicalMapper()
	ctx := context.Background()

	t.Run("Map Valid Extracted Book", func(t *testing.T) {
		item := models.RawItem{ID: "item-123", URL: "https://www.goodreads.com/book/show/1"}
		data := &extractor.ExtractedData{
			SourceType:    models.SourceGoodreads,
			SuggestedType: models.MediaTypeBook,
			Title:         "Design Patterns",
			Authors:       []models.Author{{Name: "Gang of Four"}},
			BookDetails:   &models.BookDetails{Format: "Hardcover"},
			Confidence:    0.95,
		}

		result, err := m.MapToCanonical(ctx, item, models.SourceGoodreads, data)
		if err != nil {
			t.Fatalf("MapToCanonical error: %v", err)
		}
		if result.ItemID != "item-123" {
			t.Errorf("ItemID = %v, want item-123", result.ItemID)
		}
		if result.CanonicalType != models.MediaTypeBook {
			t.Errorf("CanonicalType = %v, want Book", result.CanonicalType)
		}
		if result.Title != "Design Patterns" {
			t.Errorf("Title = %v, want Design Patterns", result.Title)
		}
		if result.BookDetails == nil || result.BookDetails.Format != "Hardcover" {
			t.Errorf("Expected BookDetails, got %v", result.BookDetails)
		}
	})

	t.Run("Map Nil ExtractedData Fallback", func(t *testing.T) {
		item := models.RawItem{URL: "https://unknown.com/page"}
		result, err := m.MapToCanonical(ctx, item, models.SourceUnknown, nil)
		if err != nil {
			t.Fatalf("MapToCanonical error: %v", err)
		}
		if result.CanonicalType != models.MediaTypeUnknown {
			t.Errorf("CanonicalType = %v, want Unknown", result.CanonicalType)
		}
		if result.Title != "https://unknown.com/page" {
			t.Errorf("Title = %v, want URL fallback", result.Title)
		}
		if len(result.Errors) == 0 {
			t.Errorf("Expected extraction error logged in result.Errors")
		}
	})
}

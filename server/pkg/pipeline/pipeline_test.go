package pipeline

import (
	"context"
	"errors"
	"testing"

	"linkaroo-app/server/pkg/pipeline/extractor"
	"linkaroo-app/server/pkg/pipeline/models"
)

type FailingExtractor struct{}

func (f *FailingExtractor) SourceType() models.SourceType { return "FAILING_SOURCE" }
func (f *FailingExtractor) CanHandle(ctx context.Context, item models.RawItem) bool {
	return item.HintSourceType == "FAILING_SOURCE"
}
func (f *FailingExtractor) Extract(ctx context.Context, item models.RawItem) (*extractor.ExtractedData, error) {
	return nil, errors.New("simulated network outage")
}

func TestPipeline(t *testing.T) {
	mockFetcher := extractor.NewMemoryHTTPFetcher()
	mockFetcher.HTMLMap["https://www.youtube.com/watch?v=123"] = `
		<html><head>
			<title>Go Tutorial - YouTube</title>
			<meta property="og:description" content="Learn Go in 10 minutes">
		</head><body></body></html>
	`

	pipe := NewPipeline(mockFetcher)
	ctx := context.Background()

	t.Run("End to End YouTube Processing", func(t *testing.T) {
		item := models.RawItem{URL: "https://www.youtube.com/watch?v=123"}
		res, err := pipe.Process(ctx, item)
		if err != nil {
			t.Fatalf("Process error: %v", err)
		}
		if res.Source != models.SourceYouTube {
			t.Errorf("Source = %v, want YOUTUBE", res.Source)
		}
		if res.CanonicalType != models.MediaTypeVideo {
			t.Errorf("CanonicalType = %v, want Video", res.CanonicalType)
		}
		if res.Title != "Go Tutorial" {
			t.Errorf("Title = %v, want Go Tutorial", res.Title)
		}
	})

	t.Run("Resilience On Extraction Failure", func(t *testing.T) {
		pipe.RegisterExtractor(&FailingExtractor{})
		item := models.RawItem{URL: "https://fail.com", HintSourceType: "FAILING_SOURCE"}

		res, err := pipe.Process(ctx, item)
		if err != nil {
			t.Fatalf("Pipeline returned hard error instead of non-fatal result: %v", err)
		}
		if res == nil {
			t.Fatalf("Expected non-nil result")
		}
		if len(res.Errors) == 0 {
			t.Errorf("Expected extraction error recorded in result.Errors")
		}
	})

	t.Run("Unknown Source Graceful Result", func(t *testing.T) {
		item := models.RawItem{Text: ""} // Empty raw item
		res, err := pipe.Process(ctx, item)
		if err != nil {
			t.Fatalf("Process error: %v", err)
		}
		if res.CanonicalType != models.MediaTypeUnknown {
			t.Errorf("CanonicalType = %v, want Unknown", res.CanonicalType)
		}
	})
}

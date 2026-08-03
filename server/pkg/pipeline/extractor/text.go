package extractor

import (
	"context"
	"strings"

	"linkaroo-app/server/pkg/pipeline/models"
)

// TextExtractor extracts metadata from plain text items and user notes.
type TextExtractor struct{}

func NewTextExtractor() *TextExtractor {
	return &TextExtractor{}
}

func (e *TextExtractor) SourceType() models.SourceType {
	return models.SourceText
}

func (e *TextExtractor) CanHandle(ctx context.Context, item models.RawItem) bool {
	if item.HintSourceType == models.SourceText {
		return true
	}
	return !item.IsURL() && !item.HasPayload() && strings.TrimSpace(item.Text) != ""
}

func (e *TextExtractor) Extract(ctx context.Context, item models.RawItem) (*ExtractedData, error) {
	text := strings.TrimSpace(item.Text)
	lines := strings.Split(text, "\n")

	title := "Note"
	if len(lines) > 0 && strings.TrimSpace(lines[0]) != "" {
		title = strings.TrimSpace(lines[0])
		if len(title) > 80 {
			title = title[:77] + "..."
		}
	}

	description := text
	if len(description) > 300 {
		description = description[:297] + "..."
	}

	extracted := &ExtractedData{
		SourceType:    models.SourceText,
		SuggestedType: models.MediaTypeNote,
		Title:         title,
		Description:   description,
		Confidence:    0.90,
		RawMetadata: map[string]any{
			"character_count": len(text),
			"line_count":      len(lines),
		},
	}

	return extracted, nil
}

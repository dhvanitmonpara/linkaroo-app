package extractor

import (
	"context"
	"path/filepath"
	"strings"

	"linkaroo-app/server/pkg/pipeline/models"
)

// ImageExtractor extracts metadata from direct image uploads and image URLs.
type ImageExtractor struct{}

func NewImageExtractor() *ImageExtractor {
	return &ImageExtractor{}
}

func (e *ImageExtractor) SourceType() models.SourceType {
	return models.SourceLocalImage
}

func (e *ImageExtractor) CanHandle(ctx context.Context, item models.RawItem) bool {
	if item.HintSourceType == models.SourceLocalImage {
		return true
	}
	if strings.HasPrefix(item.MIMEType, "image/") {
		return true
	}
	ext := strings.ToLower(filepath.Ext(item.Filename))
	return ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".webp" || ext == ".gif"
}

func (e *ImageExtractor) Extract(ctx context.Context, item models.RawItem) (*ExtractedData, error) {
	title := item.Filename
	if title == "" {
		title = "Uploaded Image"
	}

	canonicalType := models.MediaTypeImage
	if strings.Contains(strings.ToLower(title), "screenshot") || strings.Contains(strings.ToLower(item.Filename), "screen_shot") {
		canonicalType = models.MediaTypeScreenshot
	}

	format := strings.TrimPrefix(strings.ToLower(filepath.Ext(item.Filename)), ".")
	if format == "" && item.MIMEType != "" {
		parts := strings.Split(item.MIMEType, "/")
		if len(parts) > 1 {
			format = parts[1]
		}
	}

	extracted := &ExtractedData{
		SourceType:    models.SourceLocalImage,
		SuggestedType: canonicalType,
		Title:         title,
		Description:   "Local image binary file (" + format + ")",
		Confidence:    0.98,
		ImageDetails: &models.ImageDetails{
			Format: format,
		},
		RawMetadata: map[string]any{
			"file_size_bytes": len(item.Payload),
			"mime_type":       item.MIMEType,
		},
	}

	return extracted, nil
}

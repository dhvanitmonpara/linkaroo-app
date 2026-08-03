package mapper

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"linkaroo-app/server/pkg/pipeline/extractor"
	"linkaroo-app/server/pkg/pipeline/models"
)

// CanonicalMapper transforms raw extracted metadata into a unified NormalizedResult.
type CanonicalMapper interface {
	MapToCanonical(ctx context.Context, item models.RawItem, source models.SourceType, data *extractor.ExtractedData) (*models.NormalizedResult, error)
}

// DefaultCanonicalMapper implements standard canonical normalization logic.
type DefaultCanonicalMapper struct{}

func NewDefaultCanonicalMapper() *DefaultCanonicalMapper {
	return &DefaultCanonicalMapper{}
}

func (m *DefaultCanonicalMapper) MapToCanonical(ctx context.Context, item models.RawItem, source models.SourceType, data *extractor.ExtractedData) (*models.NormalizedResult, error) {
	now := time.Now().UTC()

	itemID := item.ID
	if itemID == "" {
		itemID = uuid.New().String()
	}

	res := &models.NormalizedResult{
		ItemID:      itemID,
		Source:      source,
		CreatedTime: now,
		OriginalURL: item.URL,
		RawMetadata: make(map[string]any),
		Errors:      make([]models.ExtractionError, 0),
	}

	if data == nil {
		res.CanonicalType = models.MediaTypeUnknown
		res.Title = fallbackTitle(item)
		res.Confidence = 0.1
		res.AddError("mapping", "MISSING_DATA", "ExtractedData was nil; created fallback result")
		return res, nil
	}

	// Canonical MediaType Determination
	res.CanonicalType = m.determineCanonicalType(source, data.SuggestedType)

	// Primary Fields
	res.Title = data.Title
	if res.Title == "" {
		res.Title = fallbackTitle(item)
	}
	res.Subtitle = data.Subtitle
	res.Description = data.Description
	res.Authors = data.Authors
	res.Images = data.Images
	res.Thumbnail = data.Thumbnail
	res.Language = data.Language
	res.Confidence = data.Confidence

	// Merge Raw Metadata
	if data.RawMetadata != nil {
		res.RawMetadata = data.RawMetadata
	}

	// Domain Sub-structs
	res.BookDetails = data.BookDetails
	res.ProductDetails = data.ProductDetails
	res.VideoDetails = data.VideoDetails
	res.PDFDetails = data.PDFDetails
	res.ImageDetails = data.ImageDetails

	return res, nil
}

func (m *DefaultCanonicalMapper) determineCanonicalType(source models.SourceType, suggested models.MediaType) models.MediaType {
	if suggested != "" && suggested != models.MediaTypeUnknown {
		return suggested
	}

	switch source {
	case models.SourceYouTube:
		return models.MediaTypeVideo
	case models.SourceGoodreads:
		return models.MediaTypeBook
	case models.SourceIMDb:
		return models.MediaTypeMovie
	case models.SourceAmazon:
		return models.MediaTypeProduct
	case models.SourceLocalImage:
		return models.MediaTypeImage
	case models.SourceLocalPDF:
		return models.MediaTypePDF
	case models.SourceText:
		return models.MediaTypeNote
	case models.SourceArticle:
		return models.MediaTypeArticle
	default:
		return models.MediaTypeUnknown
	}
}

func fallbackTitle(item models.RawItem) string {
	if item.Filename != "" {
		return item.Filename
	}
	if item.IsURL() {
		return item.URL
	}
	if strings.TrimSpace(item.Text) != "" {
		t := strings.TrimSpace(item.Text)
		if len(t) > 50 {
			return t[:47] + "..."
		}
		return t
	}
	return "Untitled Saved Item"
}

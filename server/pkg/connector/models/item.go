package models

import (
	"time"

	pipelineModels "linkaroo-app/server/pkg/pipeline/models"
)

// NormalizedItem represents a canonical Linkaroo item produced by any connector.
// Connectors MUST return normalized items and never provider-specific raw structures.
type NormalizedItem struct {
	ItemID        string                     `json:"item_id"`
	Provider      string                     `json:"provider"`
	CanonicalType pipelineModels.MediaType   `json:"canonical_type"`
	Source        pipelineModels.SourceType `json:"source"`
	Title         string                     `json:"title"`
	Subtitle      string                     `json:"subtitle,omitempty"`
	Description   string                     `json:"description,omitempty"`
	Authors       []pipelineModels.Author    `json:"authors,omitempty"`
	Images        []pipelineModels.ImageRef  `json:"images,omitempty"`
	Thumbnail     *pipelineModels.ImageRef   `json:"thumbnail,omitempty"`
	Metadata      map[string]any             `json:"metadata,omitempty"`
	OriginalURL   string                     `json:"original_url,omitempty"`
	Language      string                     `json:"language,omitempty"`
	PublishDate   *time.Time                 `json:"publish_date,omitempty"`
	CreatedTime   time.Time                  `json:"created_time"`
	UpdatedTime   time.Time                  `json:"updated_time"`
	RawMetadata   map[string]any             `json:"raw_metadata,omitempty"`
	Checksum      string                     `json:"checksum,omitempty"`
}

// ToPipelineNormalized converts a connector NormalizedItem to pipeline NormalizedResult.
func (n *NormalizedItem) ToPipelineNormalized() *pipelineModels.NormalizedResult {
	if n == nil {
		return nil
	}
	return &pipelineModels.NormalizedResult{
		ItemID:        n.ItemID,
		CanonicalType: n.CanonicalType,
		Source:        n.Source,
		Title:         n.Title,
		Subtitle:      n.Subtitle,
		Description:   n.Description,
		Authors:       n.Authors,
		Images:        n.Images,
		Thumbnail:     n.Thumbnail,
		Metadata:      n.Metadata,
		OriginalURL:   n.OriginalURL,
		Language:      n.Language,
		PublishDate:   n.PublishDate,
		CreatedTime:   n.CreatedTime,
		RawMetadata:   n.RawMetadata,
		Confidence:    1.0,
	}
}

package extractor

import (
	"context"
	"path/filepath"
	"strings"

	"linkaroo-app/server/pkg/pipeline/models"
)

// PDFExtractor extracts metadata from direct PDF document uploads.
type PDFExtractor struct{}

func NewPDFExtractor() *PDFExtractor {
	return &PDFExtractor{}
}

func (e *PDFExtractor) SourceType() models.SourceType {
	return models.SourceLocalPDF
}

func (e *PDFExtractor) CanHandle(ctx context.Context, item models.RawItem) bool {
	if item.HintSourceType == models.SourceLocalPDF {
		return true
	}
	if item.MIMEType == "application/pdf" || strings.ToLower(filepath.Ext(item.Filename)) == ".pdf" {
		return true
	}
	if len(item.Payload) >= 4 && string(item.Payload[:4]) == "%PDF" {
		return true
	}
	return false
}

func (e *PDFExtractor) Extract(ctx context.Context, item models.RawItem) (*ExtractedData, error) {
	title := item.Filename
	if title == "" {
		title = "Document.pdf"
	}

	extracted := &ExtractedData{
		SourceType:    models.SourceLocalPDF,
		SuggestedType: models.MediaTypePDF,
		Title:         title,
		Description:   "PDF Document",
		Confidence:    0.98,
		PDFDetails: &models.PDFDetails{
			PageCount: 1, // Fallback default page estimate
			Producer:  "Linkaroo PDF Ingest",
		},
		RawMetadata: map[string]any{
			"file_size_bytes": len(item.Payload),
			"mime_type":       "application/pdf",
		},
	}

	return extracted, nil
}

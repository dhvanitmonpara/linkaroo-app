package extractor

import (
	"context"
	"io"

	"linkaroo-app/server/pkg/pipeline/models"
)

// ExtractedData represents intermediate raw extracted metadata from a source before canonical mapping.
type ExtractedData struct {
	SourceType      models.SourceType     `json:"source_type"`
	SuggestedType   models.MediaType      `json:"suggested_type"`
	Title           string                `json:"title"`
	Subtitle        string                `json:"subtitle,omitempty"`
	Description     string                `json:"description,omitempty"`
	Authors         []models.Author       `json:"authors,omitempty"`
	Images          []models.ImageRef     `json:"images,omitempty"`
	Thumbnail       *models.ImageRef      `json:"thumbnail,omitempty"`
	OriginalURL     string                `json:"original_url,omitempty"`
	Language        string                `json:"language,omitempty"`
	PublishDateStr  string                `json:"publish_date_str,omitempty"`
	RawMetadata     map[string]any        `json:"raw_metadata,omitempty"`
	Confidence      float64               `json:"confidence"`

	// Domain-specific detail structures
	BookDetails    *models.BookDetails    `json:"book_details,omitempty"`
	ProductDetails *models.ProductDetails `json:"product_details,omitempty"`
	VideoDetails   *models.VideoDetails   `json:"video_details,omitempty"`
	PDFDetails     *models.PDFDetails     `json:"pdf_details,omitempty"`
	ImageDetails   *models.ImageDetails   `json:"image_details,omitempty"`
}

// Extractor defines the standard interface for source-specific metadata extractors.
type Extractor interface {
	// SourceType returns the primary SourceType handled by this extractor.
	SourceType() models.SourceType
	// CanHandle evaluates whether this extractor can process the given RawItem.
	CanHandle(ctx context.Context, item models.RawItem) bool
	// Extract extracts metadata from the RawItem into an ExtractedData instance.
	Extract(ctx context.Context, item models.RawItem) (*ExtractedData, error)
}

// HTTPFetcher abstracts HTTP requests to allow deterministic mocking in unit tests.
type HTTPFetcher interface {
	FetchHTML(ctx context.Context, url string, headers map[string]string) (string, error)
	FetchBytes(ctx context.Context, url string) ([]byte, string, error)
}

// MemoryHTTPFetcher is a test helper / default fetcher that returns pre-loaded HTML content.
type MemoryHTTPFetcher struct {
	HTMLMap  map[string]string
	BytesMap map[string][]byte
}

func NewMemoryHTTPFetcher() *MemoryHTTPFetcher {
	return &MemoryHTTPFetcher{
		HTMLMap:  make(map[string]string),
		BytesMap: make(map[string][]byte),
	}
}

func (m *MemoryHTTPFetcher) FetchHTML(ctx context.Context, rawURL string, headers map[string]string) (string, error) {
	if html, ok := m.HTMLMap[rawURL]; ok {
		return html, nil
	}
	return "<html><head><title>Mock Page</title></head><body>Mock Content</body></html>", nil
}

func (m *MemoryHTTPFetcher) FetchBytes(ctx context.Context, rawURL string) ([]byte, string, error) {
	if b, ok := m.BytesMap[rawURL]; ok {
		return b, "application/octet-stream", nil
	}
	return []byte{}, "", io.EOF
}

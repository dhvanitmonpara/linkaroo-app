package extractor

import (
	"context"
	"testing"

	"linkaroo-app/server/pkg/pipeline/models"
)

func TestExtractors(t *testing.T) {
	ctx := context.Background()
	mockFetcher := NewMemoryHTTPFetcher()

	// Pre-populate mock HTML pages
	mockFetcher.HTMLMap["https://www.amazon.com/dp/B08N5WRWNW"] = `
		<html><head>
			<title>Clean Code: A Handbook of Agile Software Craftsmanship: Amazon.com</title>
			<meta name="description" content="Even bad code can function. But if code isn't clean...">
			<meta property="og:image" content="https://m.media-amazon.com/images/I/41xShLch03L._SX376_BO1,204,203,200_.jpg">
		</head><body>
			<span>Paperback</span>
			<a class="a-link-normal author">Robert C. Martin</a>
			<span>$35.99</span>
		</body></html>
	`

	mockFetcher.HTMLMap["https://www.amazon.com/dp/B000000000"] = `
		<html><head>
			<title>Amazon Prime Video Movie</title>
		</head><body>
			<span>Prime Video</span>
			<span>Directed by Christopher Nolan</span>
		</body></html>
	`

	mockFetcher.HTMLMap["https://www.youtube.com/watch?v=dQw4w9WgXcQ"] = `
		<html><head>
			<title>Rick Astley - Never Gonna Give You Up (Official Music Video) - YouTube</title>
			<meta property="og:description" content="The official video for Never Gonna Give You Up">
			<meta property="og:image" content="https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg">
			<meta property="og:video:tag" content="Rick Astley">
		</head><body></body></html>
	`

	mockFetcher.HTMLMap["https://www.goodreads.com/book/show/3735293-clean-code"] = `
		<html><head>
			<title>Clean Code by Robert C. Martin | Goodreads</title>
			<meta property="og:description" content="Even bad code can function...">
			<meta property="og:image" content="https://images.gr-assets.com/books/1436202607l/3735293.jpg">
			<meta property="books:author" content="Robert C. Martin">
		</head><body></body></html>
	`

	// Register Extractors
	registry := NewExtractorRegistry()
	amazonExt := NewAmazonExtractor(mockFetcher)
	youtubeExt := NewYouTubeExtractor(mockFetcher)
	goodreadsExt := NewGoodreadsExtractor(mockFetcher)
	imageExt := NewImageExtractor()
	pdfExt := NewPDFExtractor()
	textExt := NewTextExtractor()
	articleExt := NewArticleExtractor(mockFetcher)

	registry.Register(amazonExt)
	registry.Register(youtubeExt)
	registry.Register(goodreadsExt)
	registry.Register(imageExt)
	registry.Register(pdfExt)
	registry.Register(textExt)
	registry.SetFallback(articleExt)

	t.Run("Amazon Book Extraction", func(t *testing.T) {
		item := models.RawItem{URL: "https://www.amazon.com/dp/B08N5WRWNW"}
		ext, ok := registry.GetExtractor(ctx, models.SourceAmazon, item)
		if !ok {
			t.Fatalf("Failed to find extractor for Amazon URL")
		}
		data, err := ext.Extract(ctx, item)
		if err != nil {
			t.Fatalf("Extract error: %v", err)
		}
		if data.SuggestedType != models.MediaTypeBook {
			t.Errorf("SuggestedType = %v, want %v", data.SuggestedType, models.MediaTypeBook)
		}
		if data.Title == "" {
			t.Errorf("Expected title, got empty")
		}
	})

	t.Run("Amazon Prime Movie Extraction", func(t *testing.T) {
		item := models.RawItem{URL: "https://www.amazon.com/dp/B000000000"}
		ext, ok := registry.GetExtractor(ctx, models.SourceAmazon, item)
		if !ok {
			t.Fatalf("Failed to find extractor for Amazon Movie URL")
		}
		data, err := ext.Extract(ctx, item)
		if err != nil {
			t.Fatalf("Extract error: %v", err)
		}
		if data.SuggestedType != models.MediaTypeMovie {
			t.Errorf("SuggestedType = %v, want %v", data.SuggestedType, models.MediaTypeMovie)
		}
	})

	t.Run("YouTube Extraction", func(t *testing.T) {
		item := models.RawItem{URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
		ext, ok := registry.GetExtractor(ctx, models.SourceYouTube, item)
		if !ok {
			t.Fatalf("Failed to find YouTube extractor")
		}
		data, err := ext.Extract(ctx, item)
		if err != nil {
			t.Fatalf("Extract error: %v", err)
		}
		if data.SuggestedType != models.MediaTypeVideo {
			t.Errorf("SuggestedType = %v, want %v", data.SuggestedType, models.MediaTypeVideo)
		}
		if len(data.Authors) == 0 || data.Authors[0].Name != "Rick Astley" {
			t.Errorf("Expected author Rick Astley, got %v", data.Authors)
		}
	})

	t.Run("Goodreads Extraction", func(t *testing.T) {
		item := models.RawItem{URL: "https://www.goodreads.com/book/show/3735293-clean-code"}
		ext, ok := registry.GetExtractor(ctx, models.SourceGoodreads, item)
		if !ok {
			t.Fatalf("Failed to find Goodreads extractor")
		}
		data, err := ext.Extract(ctx, item)
		if err != nil {
			t.Fatalf("Extract error: %v", err)
		}
		if data.SuggestedType != models.MediaTypeBook {
			t.Errorf("SuggestedType = %v, want %v", data.SuggestedType, models.MediaTypeBook)
		}
	})

	t.Run("Local Image Extraction", func(t *testing.T) {
		item := models.RawItem{Filename: "screenshot.png", MIMEType: "image/png", Payload: []byte("fake_image_bytes")}
		ext, ok := registry.GetExtractor(ctx, models.SourceLocalImage, item)
		if !ok {
			t.Fatalf("Failed to find Image extractor")
		}
		data, err := ext.Extract(ctx, item)
		if err != nil {
			t.Fatalf("Extract error: %v", err)
		}
		if data.SuggestedType != models.MediaTypeScreenshot {
			t.Errorf("SuggestedType = %v, want %v", data.SuggestedType, models.MediaTypeScreenshot)
		}
	})

	t.Run("Local PDF Extraction", func(t *testing.T) {
		item := models.RawItem{Filename: "doc.pdf", MIMEType: "application/pdf", Payload: []byte("%PDF-1.5")}
		ext, ok := registry.GetExtractor(ctx, models.SourceLocalPDF, item)
		if !ok {
			t.Fatalf("Failed to find PDF extractor")
		}
		data, err := ext.Extract(ctx, item)
		if err != nil {
			t.Fatalf("Extract error: %v", err)
		}
		if data.SuggestedType != models.MediaTypePDF {
			t.Errorf("SuggestedType = %v, want %v", data.SuggestedType, models.MediaTypePDF)
		}
	})

	t.Run("Text Note Extraction", func(t *testing.T) {
		item := models.RawItem{Text: "Shopping List\n1. Apples\n2. Bananas"}
		ext, ok := registry.GetExtractor(ctx, models.SourceText, item)
		if !ok {
			t.Fatalf("Failed to find Text extractor")
		}
		data, err := ext.Extract(ctx, item)
		if err != nil {
			t.Fatalf("Extract error: %v", err)
		}
		if data.SuggestedType != models.MediaTypeNote {
			t.Errorf("SuggestedType = %v, want %v", data.SuggestedType, models.MediaTypeNote)
		}
		if data.Title != "Shopping List" {
			t.Errorf("Title = %v, want %v", data.Title, "Shopping List")
		}
	})
}

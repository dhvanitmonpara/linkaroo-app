package detector

import (
	"context"
	"testing"

	"linkaroo-app/server/pkg/pipeline/models"
)

func TestDetectorRegistry(t *testing.T) {
	registry := NewDetectorRegistry()
	registry.Register(NewURLDomainStrategy(100))
	registry.Register(NewMIMETypeStrategy(90))
	registry.Register(NewPlainTextStrategy(80))

	ctx := context.Background()

	tests := []struct {
		name       string
		item       models.RawItem
		wantSource models.SourceType
		minConf    float64
	}{
		{
			name:       "YouTube URL",
			item:       models.RawItem{URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
			wantSource: models.SourceYouTube,
			minConf:    0.90,
		},
		{
			name:       "YouTube Shortened URL",
			item:       models.RawItem{URL: "https://youtu.be/dQw4w9WgXcQ"},
			wantSource: models.SourceYouTube,
			minConf:    0.90,
		},
		{
			name:       "Amazon US URL",
			item:       models.RawItem{URL: "https://www.amazon.com/dp/B08N5WRWNW"},
			wantSource: models.SourceAmazon,
			minConf:    0.90,
		},
		{
			name:       "Amazon India URL",
			item:       models.RawItem{URL: "https://www.amazon.in/dp/B08N5WRWNW"},
			wantSource: models.SourceAmazon,
			minConf:    0.90,
		},
		{
			name:       "IMDb Title URL",
			item:       models.RawItem{URL: "https://www.imdb.com/title/tt0111161/"},
			wantSource: models.SourceIMDb,
			minConf:    0.90,
		},
		{
			name:       "Goodreads Book URL",
			item:       models.RawItem{URL: "https://www.goodreads.com/book/show/3735293-clean-code"},
			wantSource: models.SourceGoodreads,
			minConf:    0.90,
		},
		{
			name:       "Reddit Post URL",
			item:       models.RawItem{URL: "https://www.reddit.com/r/golang/comments/sample"},
			wantSource: models.SourceReddit,
			minConf:    0.90,
		},
		{
			name:       "GitHub Repo URL",
			item:       models.RawItem{URL: "https://github.com/golang/go"},
			wantSource: models.SourceGitHub,
			minConf:    0.90,
		},
		{
			name:       "PDF File Upload",
			item:       models.RawItem{Filename: "document.pdf", MIMEType: "application/pdf", Payload: []byte("%PDF-1.4 sample")},
			wantSource: models.SourceLocalPDF,
			minConf:    0.90,
		},
		{
			name:       "Image File Upload",
			item:       models.RawItem{Filename: "photo.png", MIMEType: "image/png", Payload: []byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A}},
			wantSource: models.SourceLocalImage,
			minConf:    0.90,
		},
		{
			name:       "Plain Text Note",
			item:       models.RawItem{Text: "Meeting notes: remember to buy milk and review PRs."},
			wantSource: models.SourceText,
			minConf:    0.80,
		},
		{
			name:       "Generic Web Article URL",
			item:       models.RawItem{URL: "https://example.com/posts/my-blog-post"},
			wantSource: models.SourceArticle,
			minConf:    0.50,
		},
		{
			name:       "Hint Source Override",
			item:       models.RawItem{URL: "https://custom.site", HintSourceType: models.SourceMedium},
			wantSource: models.SourceMedium,
			minConf:    1.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotSource, gotConf := registry.DetectSource(ctx, tt.item)
			if gotSource != tt.wantSource {
				t.Errorf("DetectSource() gotSource = %v, want %v", gotSource, tt.wantSource)
			}
			if gotConf < tt.minConf {
				t.Errorf("DetectSource() gotConf = %v, want >= %v", gotConf, tt.minConf)
			}
		})
	}
}

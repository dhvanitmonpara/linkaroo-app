package detector

import (
	"context"
	"net/url"
	"path/filepath"
	"strings"

	"linkaroo-app/server/pkg/pipeline/models"
)

// URLDomainStrategy detects source based on URL hostname matching.
type URLDomainStrategy struct {
	priority int
	mappings map[string]models.SourceType
}

// NewURLDomainStrategy creates a strategy matching known domains to SourceTypes.
func NewURLDomainStrategy(priority int) *URLDomainStrategy {
	return &URLDomainStrategy{
		priority: priority,
		mappings: map[string]models.SourceType{
			"youtube.com":     models.SourceYouTube,
			"youtu.be":        models.SourceYouTube,
			"m.youtube.com":   models.SourceYouTube,
			"amazon.com":      models.SourceAmazon,
			"amazon.in":       models.SourceAmazon,
			"amazon.co.uk":    models.SourceAmazon,
			"amazon.de":       models.SourceAmazon,
			"amazon.ca":       models.SourceAmazon,
			"amzn.to":         models.SourceAmazon,
			"imdb.com":        models.SourceIMDb,
			"m.imdb.com":      models.SourceIMDb,
			"goodreads.com":   models.SourceGoodreads,
			"reddit.com":      models.SourceReddit,
			"old.reddit.com":  models.SourceReddit,
			"github.com":      models.SourceGitHub,
			"medium.com":      models.SourceMedium,
			"spotify.com":     models.SourceSpotify,
			"twitter.com":     models.SourceTwitter,
			"x.com":           models.SourceTwitter,
		},
	}
}

func (s *URLDomainStrategy) Name() string { return "URLDomainStrategy" }
func (s *URLDomainStrategy) Priority() int { return s.priority }

func (s *URLDomainStrategy) Detect(ctx context.Context, item models.RawItem) (models.SourceType, float64, bool) {
	if !item.IsURL() {
		return "", 0, false
	}

	u, err := url.Parse(item.URL)
	if err != nil {
		return "", 0, false
	}

	host := strings.ToLower(u.Hostname())
	host = strings.TrimPrefix(host, "www.")

	// Direct host match
	if st, ok := s.mappings[host]; ok {
		return st, 0.95, true
	}

	// Subdomain match (e.g., smile.amazon.com or music.youtube.com)
	for domain, st := range s.mappings {
		if strings.HasSuffix(host, "."+domain) {
			return st, 0.90, true
		}
	}

	return "", 0, false
}

// MIMETypeStrategy detects uploaded binary files (Images, PDFs, Audio, Video).
type MIMETypeStrategy struct {
	priority int
}

func NewMIMETypeStrategy(priority int) *MIMETypeStrategy {
	return &MIMETypeStrategy{priority: priority}
}

func (s *MIMETypeStrategy) Name() string { return "MIMETypeStrategy" }
func (s *MIMETypeStrategy) Priority() int { return s.priority }

func (s *MIMETypeStrategy) Detect(ctx context.Context, item models.RawItem) (models.SourceType, float64, bool) {
	mime := strings.ToLower(strings.TrimSpace(item.MIMEType))
	ext := strings.ToLower(filepath.Ext(item.Filename))

	if strings.HasPrefix(mime, "image/") || ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".webp" || ext == ".gif" {
		return models.SourceLocalImage, 0.95, true
	}
	if mime == "application/pdf" || ext == ".pdf" {
		return models.SourceLocalPDF, 0.95, true
	}
	if strings.HasPrefix(mime, "audio/") || ext == ".mp3" || ext == ".wav" || ext == ".m4a" || ext == ".flac" {
		return models.SourceLocalAudio, 0.95, true
	}
	if strings.HasPrefix(mime, "video/") || ext == ".mp4" || ext == ".mkv" || ext == ".avi" || ext == ".mov" {
		return models.SourceLocalVideo, 0.95, true
	}

	// Check byte magic numbers if payload present
	if len(item.Payload) >= 4 {
		// PDF magic header %PDF
		if string(item.Payload[:4]) == "%PDF" {
			return models.SourceLocalPDF, 0.99, true
		}
		// PNG magic header \x89PNG
		if item.Payload[0] == 0x89 && string(item.Payload[1:4]) == "PNG" {
			return models.SourceLocalImage, 0.99, true
		}
		// JPEG magic header \xFF\xD8\xFF
		if item.Payload[0] == 0xFF && item.Payload[1] == 0xD8 && item.Payload[2] == 0xFF {
			return models.SourceLocalImage, 0.99, true
		}
	}

	return "", 0, false
}

// PlainTextStrategy detects raw un-structured text input.
type PlainTextStrategy struct {
	priority int
}

func NewPlainTextStrategy(priority int) *PlainTextStrategy {
	return &PlainTextStrategy{priority: priority}
}

func (s *PlainTextStrategy) Name() string { return "PlainTextStrategy" }
func (s *PlainTextStrategy) Priority() int { return s.priority }

func (s *PlainTextStrategy) Detect(ctx context.Context, item models.RawItem) (models.SourceType, float64, bool) {
	if !item.IsURL() && !item.HasPayload() && strings.TrimSpace(item.Text) != "" {
		return models.SourceText, 0.90, true
	}
	return "", 0, false
}

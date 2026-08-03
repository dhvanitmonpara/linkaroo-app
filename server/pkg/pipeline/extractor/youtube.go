package extractor

import (
	"context"
	"net/url"
	"regexp"
	"strings"

	"linkaroo-app/server/pkg/pipeline/models"
)

// YouTubeExtractor extracts metadata from YouTube video and channel links.
type YouTubeExtractor struct {
	fetcher HTTPFetcher
}

func NewYouTubeExtractor(fetcher HTTPFetcher) *YouTubeExtractor {
	if fetcher == nil {
		fetcher = NewMemoryHTTPFetcher()
	}
	return &YouTubeExtractor{fetcher: fetcher}
}

func (e *YouTubeExtractor) SourceType() models.SourceType {
	return models.SourceYouTube
}

func (e *YouTubeExtractor) CanHandle(ctx context.Context, item models.RawItem) bool {
	if item.HintSourceType == models.SourceYouTube {
		return true
	}
	if !item.IsURL() {
		return false
	}
	u, err := url.Parse(item.URL)
	if err != nil {
		return false
	}
	host := strings.ToLower(u.Hostname())
	return strings.Contains(host, "youtube.com") || strings.Contains(host, "youtu.be")
}

func (e *YouTubeExtractor) Extract(ctx context.Context, item models.RawItem) (*ExtractedData, error) {
	html, _ := e.fetcher.FetchHTML(ctx, item.URL, item.Headers)

	videoID := e.extractVideoID(item.URL)
	title := e.extractMeta(html, `og:title`)
	if title == "" {
		title = e.extractTag(html, `title`)
	}
	title = strings.TrimSuffix(title, " - YouTube")

	description := e.extractMeta(html, `og:description`)
	thumbnailURL := e.extractMeta(html, `og:image`)
	if thumbnailURL == "" && videoID != "" {
		thumbnailURL = "https://img.youtube.com/vi/" + videoID + "/hqdefault.jpg"
	}
	channelName := e.extractMeta(html, `og:video:tag`)
	if channelName == "" {
		channelName = e.extractMeta(html, `author`)
	}

	extracted := &ExtractedData{
		SourceType:    models.SourceYouTube,
		SuggestedType: models.MediaTypeVideo,
		Title:         title,
		Description:   description,
		OriginalURL:   item.URL,
		Confidence:    0.95,
		VideoDetails: &models.VideoDetails{
			ChannelName: channelName,
		},
		RawMetadata: map[string]any{
			"video_id": videoID,
		},
	}

	if channelName != "" {
		extracted.Authors = []models.Author{{Name: channelName, Role: "Channel"}}
	}

	if thumbnailURL != "" {
		imgRef := models.ImageRef{URL: thumbnailURL, Type: "thumbnail"}
		extracted.Images = []models.ImageRef{imgRef}
		extracted.Thumbnail = &imgRef
	}

	return extracted, nil
}

func (e *YouTubeExtractor) extractVideoID(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}
	if u.Hostname() == "youtu.be" {
		return strings.TrimPrefix(u.Path, "/")
	}
	return u.Query().Get("v")
}

func (e *YouTubeExtractor) extractMeta(html, prop string) string {
	re := regexp.MustCompile(`(?i)<meta\s+(?:property|name)="` + regexp.QuoteMeta(prop) + `"\s+content="(.*?)"`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func (e *YouTubeExtractor) extractTag(html, tag string) string {
	re := regexp.MustCompile(`(?i)<` + tag + `>(.*?)</` + tag + `>`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

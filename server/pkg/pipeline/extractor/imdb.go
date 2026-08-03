package extractor

import (
	"context"
	"net/url"
	"regexp"
	"strings"

	"linkaroo-app/server/pkg/pipeline/models"
)

// IMDbExtractor extracts metadata from IMDb movie, TV series, and title links.
type IMDbExtractor struct {
	fetcher HTTPFetcher
}

func NewIMDbExtractor(fetcher HTTPFetcher) *IMDbExtractor {
	if fetcher == nil {
		fetcher = NewMemoryHTTPFetcher()
	}
	return &IMDbExtractor{fetcher: fetcher}
}

func (e *IMDbExtractor) SourceType() models.SourceType {
	return models.SourceIMDb
}

func (e *IMDbExtractor) CanHandle(ctx context.Context, item models.RawItem) bool {
	if item.HintSourceType == models.SourceIMDb {
		return true
	}
	if !item.IsURL() {
		return false
	}
	u, err := url.Parse(item.URL)
	if err != nil {
		return false
	}
	return strings.Contains(strings.ToLower(u.Hostname()), "imdb.com")
}

func (e *IMDbExtractor) Extract(ctx context.Context, item models.RawItem) (*ExtractedData, error) {
	html, _ := e.fetcher.FetchHTML(ctx, item.URL, item.Headers)

	title := e.extractMeta(html, `og:title`)
	if title == "" {
		title = e.extractTag(html, `title`)
	}
	title = strings.TrimSuffix(title, " - IMDb")

	desc := e.extractMeta(html, `og:description`)
	imageURL := e.extractMeta(html, `og:image`)
	ogType := e.extractMeta(html, `og:type`)

	canonicalType := models.MediaTypeMovie
	if strings.Contains(strings.ToLower(ogType), "tv_show") || strings.Contains(strings.ToLower(html), "tv series") {
		canonicalType = models.MediaTypeTVShow
	}

	extracted := &ExtractedData{
		SourceType:    models.SourceIMDb,
		SuggestedType: canonicalType,
		Title:         title,
		Description:   desc,
		OriginalURL:   item.URL,
		Confidence:    0.95,
		RawMetadata: map[string]any{
			"og_type": ogType,
		},
	}

	if imageURL != "" {
		imgRef := models.ImageRef{URL: imageURL, Type: "poster"}
		extracted.Images = []models.ImageRef{imgRef}
		extracted.Thumbnail = &imgRef
	}

	return extracted, nil
}

func (e *IMDbExtractor) extractMeta(html, prop string) string {
	re := regexp.MustCompile(`(?i)<meta\s+(?:property|name)="` + regexp.QuoteMeta(prop) + `"\s+content="(.*?)"`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func (e *IMDbExtractor) extractTag(html, tag string) string {
	re := regexp.MustCompile(`(?i)<` + tag + `>(.*?)</` + tag + `>`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

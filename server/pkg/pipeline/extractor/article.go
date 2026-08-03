package extractor

import (
	"context"
	"regexp"
	"strings"

	"linkaroo-app/server/pkg/pipeline/models"
)

// ArticleExtractor extracts open graph and HTML meta tags for generic web articles.
type ArticleExtractor struct {
	fetcher HTTPFetcher
}

func NewArticleExtractor(fetcher HTTPFetcher) *ArticleExtractor {
	if fetcher == nil {
		fetcher = NewMemoryHTTPFetcher()
	}
	return &ArticleExtractor{fetcher: fetcher}
}

func (e *ArticleExtractor) SourceType() models.SourceType {
	return models.SourceArticle
}

func (e *ArticleExtractor) CanHandle(ctx context.Context, item models.RawItem) bool {
	return item.IsURL()
}

func (e *ArticleExtractor) Extract(ctx context.Context, item models.RawItem) (*ExtractedData, error) {
	html, _ := e.fetcher.FetchHTML(ctx, item.URL, item.Headers)

	title := e.extractMeta(html, `og:title`)
	if title == "" {
		title = e.extractMeta(html, `twitter:title`)
	}
	if title == "" {
		title = e.extractTag(html, `title`)
	}

	desc := e.extractMeta(html, `og:description`)
	if desc == "" {
		desc = e.extractMeta(html, `description`)
	}

	imageURL := e.extractMeta(html, `og:image`)
	if imageURL == "" {
		imageURL = e.extractMeta(html, `twitter:image`)
	}

	author := e.extractMeta(html, `author`)
	if author == "" {
		author = e.extractMeta(html, `article:author`)
	}

	extracted := &ExtractedData{
		SourceType:    models.SourceArticle,
		SuggestedType: models.MediaTypeArticle,
		Title:         title,
		Description:   desc,
		OriginalURL:   item.URL,
		Confidence:    0.75,
	}

	if author != "" {
		extracted.Authors = []models.Author{{Name: author}}
	}

	if imageURL != "" {
		imgRef := models.ImageRef{URL: imageURL, Type: "banner"}
		extracted.Images = []models.ImageRef{imgRef}
		extracted.Thumbnail = &imgRef
	}

	return extracted, nil
}

func (e *ArticleExtractor) extractMeta(html, prop string) string {
	re := regexp.MustCompile(`(?i)<meta\s+(?:property|name)="` + regexp.QuoteMeta(prop) + `"\s+content="(.*?)"`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func (e *ArticleExtractor) extractTag(html, tag string) string {
	re := regexp.MustCompile(`(?i)<` + tag + `>(.*?)</` + tag + `>`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

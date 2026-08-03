package extractor

import (
	"context"
	"net/url"
	"regexp"
	"strings"

	"linkaroo-app/server/pkg/pipeline/models"
)

// GoodreadsExtractor extracts metadata from Goodreads book pages.
type GoodreadsExtractor struct {
	fetcher HTTPFetcher
}

func NewGoodreadsExtractor(fetcher HTTPFetcher) *GoodreadsExtractor {
	if fetcher == nil {
		fetcher = NewMemoryHTTPFetcher()
	}
	return &GoodreadsExtractor{fetcher: fetcher}
}

func (e *GoodreadsExtractor) SourceType() models.SourceType {
	return models.SourceGoodreads
}

func (e *GoodreadsExtractor) CanHandle(ctx context.Context, item models.RawItem) bool {
	if item.HintSourceType == models.SourceGoodreads {
		return true
	}
	if !item.IsURL() {
		return false
	}
	u, err := url.Parse(item.URL)
	if err != nil {
		return false
	}
	return strings.Contains(strings.ToLower(u.Hostname()), "goodreads.com")
}

func (e *GoodreadsExtractor) Extract(ctx context.Context, item models.RawItem) (*ExtractedData, error) {
	html, _ := e.fetcher.FetchHTML(ctx, item.URL, item.Headers)

	title := e.extractMeta(html, `og:title`)
	if title == "" {
		title = e.extractTag(html, `title`)
	}
	title = strings.TrimSuffix(title, " by Goodreads")
	title = strings.TrimSuffix(title, " | Goodreads")

	desc := e.extractMeta(html, `og:description`)
	imageURL := e.extractMeta(html, `og:image`)
	author := e.extractMeta(html, `books:author`)

	extracted := &ExtractedData{
		SourceType:    models.SourceGoodreads,
		SuggestedType: models.MediaTypeBook,
		Title:         title,
		Description:   desc,
		OriginalURL:   item.URL,
		Confidence:    0.95,
		BookDetails: &models.BookDetails{
			Format: "Book",
		},
	}

	if author != "" {
		extracted.Authors = []models.Author{{Name: author, Role: "Author"}}
	}

	if imageURL != "" {
		imgRef := models.ImageRef{URL: imageURL, Type: "cover"}
		extracted.Images = []models.ImageRef{imgRef}
		extracted.Thumbnail = &imgRef
	}

	return extracted, nil
}

func (e *GoodreadsExtractor) extractMeta(html, prop string) string {
	re := regexp.MustCompile(`(?i)<meta\s+(?:property|name)="` + regexp.QuoteMeta(prop) + `"\s+content="(.*?)"`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func (e *GoodreadsExtractor) extractTag(html, tag string) string {
	re := regexp.MustCompile(`(?i)<` + tag + `>(.*?)</` + tag + `>`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

package extractor

import (
	"context"
	"net/url"
	"regexp"
	"strings"

	"linkaroo-app/server/pkg/pipeline/models"
)

// AmazonSubType represents Amazon specific content categories.
type AmazonSubType string

const (
	AmazonSubBook        AmazonSubType = "Book"
	AmazonSubKindle      AmazonSubType = "Kindle Book"
	AmazonSubMovie       AmazonSubType = "Movie"
	AmazonSubTVSeries    AmazonSubType = "TV Series"
	AmazonSubAudible     AmazonSubType = "Audible"
	AmazonSubFashion     AmazonSubType = "Fashion"
	AmazonSubElectronics AmazonSubType = "Electronics"
	AmazonSubFurniture   AmazonSubType = "Furniture"
	AmazonSubProduct     AmazonSubType = "Product"
	AmazonSubOther       AmazonSubType = "Other"
)

// AmazonExtractor extracts metadata from Amazon links and classifies sub-types.
type AmazonExtractor struct {
	fetcher HTTPFetcher
}

// NewAmazonExtractor returns a new AmazonExtractor instance.
func NewAmazonExtractor(fetcher HTTPFetcher) *AmazonExtractor {
	if fetcher == nil {
		fetcher = NewMemoryHTTPFetcher()
	}
	return &AmazonExtractor{fetcher: fetcher}
}

func (e *AmazonExtractor) SourceType() models.SourceType {
	return models.SourceAmazon
}

func (e *AmazonExtractor) CanHandle(ctx context.Context, item models.RawItem) bool {
	if item.HintSourceType == models.SourceAmazon {
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
	return strings.Contains(host, "amazon.") || strings.Contains(host, "amzn.to")
}

func (e *AmazonExtractor) Extract(ctx context.Context, item models.RawItem) (*ExtractedData, error) {
	html, _ := e.fetcher.FetchHTML(ctx, item.URL, item.Headers)

	subType := e.determineSubType(item.URL, html)
	canonicalType := e.mapSubTypeToCanonical(subType)

	title := e.extractTitle(item.URL, html)
	desc := e.extractDescription(html)
	imageURL := e.extractImage(html)
	author := e.extractAuthor(html)
	price, currency := e.extractPrice(html)

	rawMeta := map[string]any{
		"amazon_sub_type": string(subType),
		"extracted_url":   item.URL,
	}

	extracted := &ExtractedData{
		SourceType:    models.SourceAmazon,
		SuggestedType: canonicalType,
		Title:         title,
		Description:   desc,
		OriginalURL:   item.URL,
		RawMetadata:   rawMeta,
		Confidence:    0.92,
	}

	if author != "" {
		extracted.Authors = []models.Author{{Name: author}}
	}

	if imageURL != "" {
		imgRef := models.ImageRef{URL: imageURL, Type: "primary"}
		extracted.Images = []models.ImageRef{imgRef}
		extracted.Thumbnail = &imgRef
	}

	// Populate Domain Sub-structs
	switch canonicalType {
	case models.MediaTypeBook:
		extracted.BookDetails = &models.BookDetails{
			Format: string(subType),
		}
	case models.MediaTypeAudiobook:
		extracted.BookDetails = &models.BookDetails{
			Format: "Audiobook",
		}
	case models.MediaTypeProduct:
		extracted.ProductDetails = &models.ProductDetails{
			Price:    price,
			Currency: currency,
			Category: string(subType),
		}
	}

	return extracted, nil
}

func (e *AmazonExtractor) determineSubType(rawURL string, html string) AmazonSubType {
	lowerURL := strings.ToLower(rawURL)
	lowerHTML := strings.ToLower(html)

	// URL inspection
	if strings.Contains(lowerURL, "kindle") || strings.Contains(lowerURL, "ebook") {
		return AmazonSubKindle
	}
	if strings.Contains(lowerURL, "audible") || strings.Contains(lowerURL, "audiobook") {
		return AmazonSubAudible
	}
	if strings.Contains(lowerURL, "prime-video") || strings.Contains(lowerURL, "/movie/") {
		return AmazonSubMovie
	}
	if strings.Contains(lowerURL, "/tv/") || strings.Contains(lowerURL, "season") {
		return AmazonSubTVSeries
	}

	// Metadata inspection
	if strings.Contains(lowerHTML, "kindle edition") || strings.Contains(lowerHTML, "sold by: amazon.com services llc") && strings.Contains(lowerHTML, "ebook") {
		return AmazonSubKindle
	}
	if strings.Contains(lowerHTML, "audible audiobook") || strings.Contains(lowerHTML, "listening length") {
		return AmazonSubAudible
	}
	if strings.Contains(lowerHTML, "prime video") || strings.Contains(lowerHTML, "directed by") {
		if strings.Contains(lowerHTML, "season ") || strings.Contains(lowerHTML, "episodes") {
			return AmazonSubTVSeries
		}
		return AmazonSubMovie
	}
	if strings.Contains(lowerHTML, "paperback") || strings.Contains(lowerHTML, "hardcover") || strings.Contains(lowerHTML, "isbn-13") {
		return AmazonSubBook
	}
	if strings.Contains(lowerHTML, "clothing") || strings.Contains(lowerHTML, "apparel") || strings.Contains(lowerHTML, "shoes") {
		return AmazonSubFashion
	}
	if strings.Contains(lowerHTML, "electronics") || strings.Contains(lowerHTML, "tech specs") {
		return AmazonSubElectronics
	}
	if strings.Contains(lowerHTML, "furniture") || strings.Contains(lowerHTML, "home & kitchen") {
		return AmazonSubFurniture
	}

	return AmazonSubProduct
}

func (e *AmazonExtractor) mapSubTypeToCanonical(subType AmazonSubType) models.MediaType {
	switch subType {
	case AmazonSubBook, AmazonSubKindle:
		return models.MediaTypeBook
	case AmazonSubAudible:
		return models.MediaTypeAudiobook
	case AmazonSubMovie:
		return models.MediaTypeMovie
	case AmazonSubTVSeries:
		return models.MediaTypeTVShow
	default:
		return models.MediaTypeProduct
	}
}

func (e *AmazonExtractor) extractTitle(rawURL string, html string) string {
	re := regexp.MustCompile(`(?i)<title>(.*?)</title>`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		title := strings.TrimSpace(match[1])
		title = strings.TrimSuffix(title, " : Amazon.com")
		title = strings.TrimSuffix(title, " : Amazon.in")
		title = strings.TrimSuffix(title, " - Amazon.com")
		return title
	}

	// Fallback to URL path extraction
	u, err := url.Parse(rawURL)
	if err == nil {
		parts := strings.Split(strings.Trim(u.Path, "/"), "/")
		if len(parts) > 0 && parts[0] != "dp" && parts[0] != "gp" {
			return strings.ReplaceAll(parts[0], "-", " ")
		}
	}
	return "Amazon Item"
}

func (e *AmazonExtractor) extractDescription(html string) string {
	re := regexp.MustCompile(`(?i)<meta\s+name="description"\s+content="(.*?)"`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func (e *AmazonExtractor) extractImage(html string) string {
	re := regexp.MustCompile(`(?i)<meta\s+property="og:image"\s+content="(.*?)"`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func (e *AmazonExtractor) extractAuthor(html string) string {
	re := regexp.MustCompile(`(?i)<a[^>]*class="a-link-normal author[^"]*"[^>]*>(.*?)</a>`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func (e *AmazonExtractor) extractPrice(html string) (string, string) {
	re := regexp.MustCompile(`(?i)\$([0-9]+\.[0-9]{2})`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return match[1], "USD"
	}
	return "", ""
}

package extractor

import (
	"context"
	"sync"

	"linkaroo-app/server/pkg/pipeline/models"
)

// ExtractorRegistry provides a thread-safe registry of source extractors.
type ExtractorRegistry struct {
	mu         sync.RWMutex
	extractors map[models.SourceType]Extractor
	fallback   Extractor
}

// NewExtractorRegistry initializes an empty ExtractorRegistry.
func NewExtractorRegistry() *ExtractorRegistry {
	return &ExtractorRegistry{
		extractors: make(map[models.SourceType]Extractor),
	}
}

// Register adds an Extractor to the registry mapped to its primary SourceType.
func (r *ExtractorRegistry) Register(e Extractor) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.extractors[e.SourceType()] = e
}

// SetFallback sets the default fallback extractor (e.g. ArticleExtractor).
func (r *ExtractorRegistry) SetFallback(e Extractor) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.fallback = e
}

// GetExtractor looks up an Extractor by SourceType, checking CanHandle fallback if needed.
func (r *ExtractorRegistry) GetExtractor(ctx context.Context, sourceType models.SourceType, item models.RawItem) (Extractor, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// 1. Direct SourceType match
	if e, ok := r.extractors[sourceType]; ok {
		if e.CanHandle(ctx, item) {
			return e, true
		}
	}

	// 2. CanHandle probe across all registered extractors
	for _, e := range r.extractors {
		if e.CanHandle(ctx, item) {
			return e, true
		}
	}

	// 3. Fallback extractor if configured
	if r.fallback != nil && r.fallback.CanHandle(ctx, item) {
		return r.fallback, true
	}

	return nil, false
}

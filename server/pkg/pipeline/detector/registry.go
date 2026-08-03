package detector

import (
	"context"
	"sort"
	"sync"

	"linkaroo-app/server/pkg/pipeline/models"
)

// DetectorRegistry provides a thread-safe registry of DetectionStrategy rules.
type DetectorRegistry struct {
	mu         sync.RWMutex
	strategies []DetectionStrategy
}

// NewDetectorRegistry creates a new DetectorRegistry initialized with default detection strategies.
func NewDetectorRegistry() *DetectorRegistry {
	r := &DetectorRegistry{
		strategies: make([]DetectionStrategy, 0),
	}
	return r
}

// Register adds a DetectionStrategy to the registry and sorts by priority (descending).
func (r *DetectorRegistry) Register(strategy DetectionStrategy) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.strategies = append(r.strategies, strategy)
	sort.SliceStable(r.strategies, func(i, j int) bool {
		return r.strategies[i].Priority() > r.strategies[j].Priority()
	})
}

// DetectSource iterates through registered strategies by priority to determine the source of a RawItem.
func (r *DetectorRegistry) DetectSource(ctx context.Context, item models.RawItem) (models.SourceType, float64) {
	r.mu.RLock()
	strategiesCopy := make([]DetectionStrategy, len(r.strategies))
	copy(strategiesCopy, r.strategies)
	r.mu.RUnlock()

	// 1. Check explicit HintSourceType first if provided
	if item.HintSourceType != "" && item.HintSourceType != models.SourceUnknown {
		return item.HintSourceType, 1.0
	}

	// 2. Evaluate registered strategies in priority order
	for _, strategy := range strategiesCopy {
		if sourceType, confidence, matched := strategy.Detect(ctx, item); matched {
			return sourceType, confidence
		}
	}

	// 3. Fallback heuristic: if it's a URL, fallback to ARTICLE, else UNKNOWN
	if item.IsURL() {
		return models.SourceArticle, 0.5
	}
	if item.Text != "" {
		return models.SourceText, 0.5
	}

	return models.SourceUnknown, 0.0
}

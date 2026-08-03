package detector

import (
	"context"

	"linkaroo-app/server/pkg/pipeline/models"
)

// DetectionStrategy defines an extensible rule interface to identify the source of a RawItem.
type DetectionStrategy interface {
	// Name returns a unique name for this detection strategy.
	Name() string
	// Priority returns execution priority (higher values run earlier).
	Priority() int
	// Detect evaluates the RawItem and returns (SourceType, Confidence, matched).
	Detect(ctx context.Context, item models.RawItem) (models.SourceType, float64, bool)
}

// SourceDetector orchestrates source detection across registered detection strategies.
type SourceDetector interface {
	// DetectSource evaluates a RawItem and returns the detected SourceType and confidence rating.
	DetectSource(ctx context.Context, item models.RawItem) (models.SourceType, float64)
}

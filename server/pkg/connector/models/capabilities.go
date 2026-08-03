package models

import "strings"

// Capability defines a feature or operational capability supported by a connector.
type Capability string

const (
	CapabilityReadItems       Capability = "READ_ITEMS"
	CapabilitySearch          Capability = "SEARCH"
	CapabilityIncrementalSync Capability = "INCREMENTAL_SYNC"
	CapabilityWebhooks        Capability = "WEBHOOKS"
	CapabilityImport          Capability = "IMPORT"
	CapabilityExport          Capability = "EXPORT"
	CapabilityRealtime        Capability = "REALTIME"
	CapabilityFileDownload    Capability = "FILE_DOWNLOAD"
)

// CapabilitySet is a set of capabilities for fast lookup.
type CapabilitySet map[Capability]bool

// NewCapabilitySet constructs a CapabilitySet from a slice of Capability values.
func NewCapabilitySet(caps ...Capability) CapabilitySet {
	cs := make(CapabilitySet, len(caps))
	for _, c := range caps {
		cs[c] = true
	}
	return cs
}

// Has checks if the capability set contains the specified capability.
func (cs CapabilitySet) Has(c Capability) bool {
	if cs == nil {
		return false
	}
	return cs[c]
}

// ToSlice returns all capabilities in the set as a slice.
func (cs CapabilitySet) ToSlice() []Capability {
	result := make([]Capability, 0, len(cs))
	for c, enabled := range cs {
		if enabled {
			result = append(result, c)
		}
	}
	return result
}

// ParseCapability converts a string representation to a typed Capability.
func ParseCapability(raw string) (Capability, bool) {
	upper := Capability(strings.ToUpper(strings.TrimSpace(raw)))
	switch upper {
	case CapabilityReadItems, CapabilitySearch, CapabilityIncrementalSync,
		CapabilityWebhooks, CapabilityImport, CapabilityExport,
		CapabilityRealtime, CapabilityFileDownload:
		return upper, true
	default:
		return "", false
	}
}

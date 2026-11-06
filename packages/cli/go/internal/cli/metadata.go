package cli

import (
	"encoding/json"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/assets"
)

var Metadata struct {
	UpdatesHook      string                     `json:"updatesHook"`
	Catalog          json.RawMessage            `json:"catalog"`
	Schemas          map[string]json.RawMessage `json:"schemas"`
	Descriptors      []CommandDescriptor        `json:"descriptors"`
	Orchestration    []CommandDescriptor        `json:"orchestrationDescriptors"`
	Version          string                     `json:"version"`
	FrameworkVersion string                     `json:"frameworkVersion"`
	CapabilityIDs    []string                   `json:"capabilityIds"`
	Boundaries       []string                   `json:"boundaries"`
}

func init() {
	if err := json.Unmarshal(assets.Catalog, &Metadata); err != nil {
		panic(err)
	}
}

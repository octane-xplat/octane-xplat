package main

import (
	_ "embed"
	"encoding/json"
)

// Generated from the TypeScript catalog by build.mjs, not from Nim output.
//
//go:embed catalog.json
var catalogBytes []byte
var metadata struct {
	Catalog       json.RawMessage            `json:"catalog"`
	Schemas       map[string]json.RawMessage `json:"schemas"`
	Descriptors   []commandDescriptor        `json:"descriptors"`
	Version       string                     `json:"version"`
	CapabilityIDs []string                   `json:"capabilityIds"`
	Boundaries    []string                   `json:"boundaries"`
}

func init() {
	if err := json.Unmarshal(catalogBytes, &metadata); err != nil {
		panic(err)
	}
}

package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestFormatPlanRejectsRawByteChangesAndNullableFields(t *testing.T) {
	project, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(project, "a.ts")
	first := []byte{0xff, '\n'}
	second := []byte{0xfe, '\n'}
	if err := os.WriteFile(file, first, 0644); err != nil {
		t.Fatal(err)
	}
	scope, err := outputScope(project, project)
	if err != nil {
		t.Fatal(err)
	}
	before, err := snapshotArtifact(context.Background(), scope, file)
	if err != nil {
		t.Fatal(err)
	}
	entry := map[string]any{"file": file, "sourceSha256": before.Hash, "mode": uint32(before.Info.Mode().Perm()), "code": "new\n", "changed": true}
	plan := map[string]any{"version": 1, "kind": "files", "diagnostics": []string{}, "files": []any{entry}}
	data, _ := json.Marshal(plan)
	if _, _, err = validateFormatPlan(context.Background(), project, []formatInput{{project, true}}, false, data); err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(file, second, 0644); err != nil {
		t.Fatal(err)
	}
	if _, _, err = validateFormatPlan(context.Background(), project, []formatInput{{project, true}}, false, data); err == nil {
		t.Fatal("different invalid UTF-8 bytes were accepted as unchanged")
	}
	if err = os.WriteFile(file, first, 0644); err != nil {
		t.Fatal(err)
	}
	for _, key := range []string{"changed", "mode", "sourceSha256", "file", "code"} {
		original := entry[key]
		entry[key] = nil
		data, _ = json.Marshal(plan)
		if _, _, err = validateFormatPlan(context.Background(), project, []formatInput{{project, true}}, false, data); err == nil {
			t.Fatalf("null %s accepted", key)
		}
		entry[key] = original
	}
}
func TestVariadicFormattingArguments(t *testing.T) {
	descriptor := commandDescriptor{Name: "fmt", Positionals: []positionalDescriptor{{Name: "paths", Variadic: true}}}
	for _, args := range [][]string{nil, {"a.ts"}, {"a.ts", "b.ts"}} {
		parsed := parseCommand(descriptor, args)
		if len(parsed.Errors) != 0 || len(parsed.Values["paths"].([]string)) != len(args) {
			t.Fatalf("%v: %+v", args, parsed)
		}
	}
}

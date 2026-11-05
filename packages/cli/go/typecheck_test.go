package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestTypecheckPlanRequiresExactProgramOrder(t *testing.T) {
	project, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	inputs := map[string]typecheckConfig{"tsconfig.json": {}, "tsconfig.envs.json": {}, "tsconfig.native.json": {}}
	expected := expectedTypecheckPrograms(project, inputs)
	if len(expected) != 2 || filepath.Base(expected[1]) != "all.json" {
		t.Fatal("combined program did not replace the legacy native program")
	}
	for _, path := range expected {
		if err = os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			t.Fatal(err)
		}
		if err = os.WriteFile(path, []byte("{}"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	for _, configs := range [][]string{expected, {expected[1], expected[0]}, expected[:1], append(append([]string{}, expected...), expected[1]), {filepath.Join(project, "unrelated.json")}, nil} {
		data, _ := json.Marshal(map[string]any{"version": 1, "configs": configs})
		_, err := validateTypecheckPrograms(data, project, inputs)
		valid := len(configs) == 2 && configs[0] == expected[0] && configs[1] == expected[1]
		if (err == nil) != valid {
			t.Fatalf("unexpected plan acceptance for %v: %v", configs, err)
		}
	}
}

func TestInstalledCheckerNeverSkipsANearerBrokenPackage(t *testing.T) {
	root := t.TempDir()
	project := filepath.Join(root, "apps", "app")
	if err := os.MkdirAll(project, 0755); err != nil {
		t.Fatal(err)
	}
	tool := filepath.Join(root, "node_modules", "@tsrx", "typescript-plugin")
	if err := os.MkdirAll(tool, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tool, "package.json"), []byte(`{"name":"@tsrx/typescript-plugin","bin":{"tsrx-tsc":"checker.js"}}`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tool, "checker.js"), []byte("// installed"), 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := installedTool(project, "@tsrx/typescript-plugin", "tsrx-tsc"); err != nil {
		t.Fatal(err)
	}
	near := filepath.Join(project, "node_modules", "@tsrx", "typescript-plugin")
	if err := os.MkdirAll(near, 0755); err != nil {
		t.Fatal(err)
	}
	if _, err := installedTool(project, "@tsrx/typescript-plugin", "tsrx-tsc"); err == nil {
		t.Fatal("nearer missing manifest fell back to an ancestor's compiler")
	}
	if err := os.WriteFile(filepath.Join(near, "package.json"), []byte(`{"name":"@tsrx/typescript-plugin","bin":{"tsrx-tsc":"../../../../other.js"}}`), 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := installedTool(project, "@tsrx/typescript-plugin", "tsrx-tsc"); err == nil {
		t.Fatal("escaping compiler entry accepted")
	}
}

func TestTypecheckInputChangesUseBytesAndTargets(t *testing.T) {
	project := t.TempDir()
	path := filepath.Join(project, "tsconfig.envs.json")
	if err := os.WriteFile(path, []byte("// first\n{}"), 0644); err != nil {
		t.Fatal(err)
	}
	before, err := typecheckInputs(context.Background(), project)
	if err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(path, []byte("// other\n{}"), 0644); err != nil {
		t.Fatal(err)
	}
	after, err := typecheckInputs(context.Background(), project)
	if err != nil || sameTypecheckInputs(before, after) {
		t.Fatal("changed compiler configuration was not observed")
	}
}

package typecheck

import (
	"context"
	"encoding/json"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"path/filepath"
	"testing"
)

func TestTypecheckPlanRequiresExactProgramOrder(t *testing.T) {
	projectPath, err := osfs.Canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	inputs := map[string]typecheckConfig{"tsconfig.json": {}, "tsconfig.envs.json": {}, "tsconfig.native.json": {}}
	expected := expectedTypecheckPrograms(projectPath, inputs)
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
	for _, configs := range [][]string{expected, {expected[1], expected[0]}, expected[:1], append(append([]string{}, expected...), expected[1]), {filepath.Join(projectPath, "unrelated.json")}, nil} {
		data, _ := json.Marshal(map[string]any{"version": 1, "configs": configs})
		_, err := validateTypecheckPrograms(data, projectPath, inputs)
		valid := len(configs) == 2 && configs[0] == expected[0] && configs[1] == expected[1]
		if (err == nil) != valid {
			t.Fatalf("unexpected plan acceptance for %v: %v", configs, err)
		}
	}
}

func TestInstalledCheckerNeverSkipsANearerBrokenPackage(t *testing.T) {
	root := t.TempDir()
	projectPath := filepath.Join(root, "apps", "app")
	if err := os.MkdirAll(projectPath, 0755); err != nil {
		t.Fatal(err)
	}
	tool := filepath.Join(root, "node_modules", "typescript")
	if err := os.MkdirAll(tool, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tool, "package.json"), []byte(`{"name":"typescript","bin":{"tsc":"checker.js"}}`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tool, "checker.js"), []byte("// installed"), 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := project.InstalledTool(projectPath, "typescript", "tsc"); err != nil {
		t.Fatal(err)
	}
	near := filepath.Join(projectPath, "node_modules", "typescript")
	if err := os.MkdirAll(near, 0755); err != nil {
		t.Fatal(err)
	}
	if _, err := project.InstalledTool(projectPath, "typescript", "tsc"); err == nil {
		t.Fatal("nearer missing manifest fell back to an ancestor's compiler")
	}
	if err := os.WriteFile(filepath.Join(near, "package.json"), []byte(`{"name":"typescript","bin":{"tsc":"../../../../other.js"}}`), 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := project.InstalledTool(projectPath, "typescript", "tsc"); err == nil {
		t.Fatal("escaping compiler entry accepted")
	}
}

func TestInstalledCheckerFallsBackToDeclaredUmbrellaTool(t *testing.T) {
	root := t.TempDir()
	projectPath := filepath.Join(root, "app")
	// An octane-xplat-only project resolves declared umbrella tools inside the
	// umbrella install, as with an isolated linker's .bun store siblings.
	cell := filepath.Join(projectPath, "node_modules", "octane-xplat", "node_modules")
	tool := filepath.Join(cell, "typescript")
	if err := os.MkdirAll(tool, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(projectPath, "node_modules", "octane-xplat", "package.json"), []byte(`{"name":"octane-xplat","dependencies":{"typescript":"7.1.0-beta"}}`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tool, "package.json"), []byte(`{"name":"typescript","bin":{"tsc":"bin/tsc"}}`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tool, "bin"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tool, "bin", "tsc"), []byte("// installed"), 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := project.InstalledTool(projectPath, "typescript", "tsc"); err != nil {
		t.Fatal(err)
	}
	if _, err := project.InstalledTool(projectPath, "unrelated", "unrelated"); err == nil {
		t.Fatal("undeclared umbrella package became a project tool")
	}
	direct := filepath.Join(projectPath, "node_modules", "typescript")
	if err := os.MkdirAll(direct, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(direct, "package.json"), []byte(`{"name":"typescript","bin":{"tsc":"checker.js"}}`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(direct, "checker.js"), []byte("// direct"), 0644); err != nil {
		t.Fatal(err)
	}
	entry, err := project.InstalledTool(projectPath, "typescript", "tsc")
	if err != nil || filepath.Base(entry) != "checker.js" {
		t.Fatal("direct install did not win over the umbrella tool", err)
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

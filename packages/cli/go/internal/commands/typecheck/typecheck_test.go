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
	if err = os.WriteFile(filepath.Join(projectPath, "tsconfig.envs.json"), []byte(`{"environments":{"native":{}}}`), 0644); err != nil {
		t.Fatal(err)
	}
	inputs := map[string]typecheckConfig{"tsconfig.json": {}, "tsconfig.envs.json": {}, "tsconfig.native.json": {}}
	expected := expectedTypecheckPrograms(projectPath, inputs)
	if len(expected) != 3 || filepath.Base(expected[0]) != "tsconfig.json" || filepath.Base(expected[1]) != "ios.json" || filepath.Base(expected[2]) != "android.json" {
		t.Fatal("isolated programs did not replace the legacy native program")
	}
	for _, path := range expected {
		if err = os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			t.Fatal(err)
		}
		if err = os.WriteFile(path, []byte("{}"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	for _, configs := range [][]string{expected, {expected[1], expected[0]}, expected[:1], expected[:2], append(append([]string{}, expected...), expected[1]), {filepath.Join(projectPath, "unrelated.json")}, nil} {
		data, _ := json.Marshal(map[string]any{"version": 1, "configs": configs})
		_, err := validateTypecheckPrograms(data, projectPath, inputs)
		valid := len(configs) == 3 && configs[0] == expected[0] && configs[1] == expected[1] && configs[2] == expected[2]
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
	if err != nil || filepath.Base(entry) != "tsc" {
		t.Fatal("incidental hoisted tool shadowed the umbrella compiler", err)
	}
	if err := os.WriteFile(filepath.Join(projectPath, "package.json"), []byte(`{"name":"app","devDependencies":{"typescript":"7.1.0-beta"}}`), 0644); err != nil {
		t.Fatal(err)
	}
	entry, err = project.InstalledTool(projectPath, "typescript", "tsc")
	if err != nil || filepath.Base(entry) != "checker.js" {
		t.Fatal("authored install did not win over the umbrella tool", err)
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

func TestTransitiveSDKLeaksAreRejected(t *testing.T) {
	for _, env := range []string{"web", "ios", "android", "macos", "windows", "gtk"} {
		for _, path := range []string{"/sdk/lib.dom.d.ts", "/sdk/@nativescript/types-ios/index.d.ts", "/sdk/@nativescript/types-android/index.d.ts", "/sdk/@nativescript/types/index.d.ts"} {
			allowed := (env == "web" && path == "/sdk/lib.dom.d.ts") || (env == "ios" && path == "/sdk/@nativescript/types-ios/index.d.ts") || (env == "android" && path == "/sdk/@nativescript/types-android/index.d.ts")
			if (validateAmbientFiles(env, path) == nil) != allowed {
				t.Fatalf("%s: %s", env, path)
			}
		}
	}
}

func TestNativeLinuxUsesGTKProgram(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "tsconfig.envs.json"), []byte(`{"environments":{"gtk":{}}}`), 0644); err != nil {
		t.Fatal(err)
	}
	paths := expectedTypecheckPrograms(root, map[string]typecheckConfig{"tsconfig.json": {}, "tsconfig.envs.json": {}})
	if len(paths) != 2 || filepath.Base(paths[0]) != "tsconfig.json" || filepath.Base(paths[1]) != "gtk.json" {
		t.Fatalf("Linux programs missing: %v", paths)
	}
}

func TestRetiredLinuxWebviewEnvironmentIsRejected(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "tsconfig.envs.json"), []byte(`{"environments":{"linux":{}}}`), 0644); err != nil {
		t.Fatal(err)
	}
	if paths := expectedTypecheckPrograms(root, map[string]typecheckConfig{"tsconfig.envs.json": {}}); paths != nil {
		t.Fatalf("retired Linux environment accepted: %v", paths)
	}
}

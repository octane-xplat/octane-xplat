package main

import (
	"bytes"
	"encoding/json"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestJSONCBoundaries(t *testing.T) {
	for _, text := range []string{`{"a":"https://host/*not comment*/",//comment
"b":[1,2,],}`, `{"quote":"\\\"//", /*yes*/"array":[{},],}`} {
		bytes, err := project.Jsonc([]byte(text))
		if err != nil || !json.Valid(bytes) {
			t.Fatalf("invalid JSONC conversion: %s %v", bytes, err)
		}
	}
	if _, err := project.Jsonc([]byte(`{/*broken`)); err == nil {
		t.Fatal("accepted unterminated comment")
	}
	if json.Valid([]byte(`{"a":1,}`)) {
		t.Fatal("ordinary JSON must stay strict")
	}
}

func TestJSONInputCannotHideAnOversizedTail(t *testing.T) {
	path := filepath.Join(t.TempDir(), "request.json")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = f.WriteString("{}"); err != nil {
		t.Fatal(err)
	}
	// A limited decoder alone would see a complete object followed by valid
	// whitespace and EOF, hiding the second value beyond its byte budget.
	padding := bytes.Repeat([]byte{' '}, 1<<20)
	for remaining := (64 << 20) - 2; remaining > 0; {
		n := min(remaining, len(padding))
		if _, err = f.Write(padding[:n]); err != nil {
			t.Fatal(err)
		}
		remaining -= n
	}
	if _, err = f.WriteString("false"); err != nil {
		t.Fatal(err)
	}
	if err = f.Close(); err != nil {
		t.Fatal(err)
	}
	var value map[string]any
	if err = osfs.ReadJSON(path, &value); err == nil {
		t.Fatal("accepted a valid prefix with an oversized trailing region")
	}
}
func TestLockVersionsAndConflicts(t *testing.T) {
	root := t.TempDir()
	bytes := []byte("lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      '@octane-xplat/ui':\n        version: 0.19.0(peer@1)\n  app:\n    devDependencies:\n      '@octane-xplat/ui':\n        version: 0.18.0\n")
	if err := os.WriteFile(filepath.Join(root, "pnpm-lock.yaml"), bytes, 0600); err != nil {
		t.Fatal(err)
	}
	value, err := project.LockReport(root)
	if err != nil {
		t.Fatal(err)
	}
	report := value.(map[string]any)
	if !reflect.DeepEqual(report["versions"].(map[string][]string)["@octane-xplat/ui"], []string{"0.18.0", "0.19.0"}) || len(report["warnings"].([]string)) != 1 {
		t.Fatalf("silent version/conflict omission: %#v", value)
	}
	os.Remove(filepath.Join(root, "pnpm-lock.yaml"))
	os.WriteFile(filepath.Join(root, "bun.lock"), []byte(`{"packages":{"a":["@octane-xplat/ui@0.19.0",],"b":["@octane-xplat/ui@0.18.0"]},}`), 0600)
	value, err = project.LockReport(root)
	if err != nil || len(value.(map[string]any)["warnings"].([]string)) != 1 {
		t.Fatalf("Bun versions missing: %#v %v", value, err)
	}
}
func TestNearestBrokenWorkerDoesNotFallThrough(t *testing.T) {
	root := t.TempDir()
	projectPath := filepath.Join(root, "app")
	os.MkdirAll(filepath.Join(projectPath, "node_modules/@octane-xplat/cli"), 0700)
	pkg := filepath.Join(root, "node_modules/@octane-xplat/cli")
	os.MkdirAll(pkg, 0700)
	os.WriteFile(filepath.Join(pkg, "package.json"), []byte(`{"name":"@octane-xplat/cli","exports":{"./worker":"./worker.mjs"}}`), 0600)
	os.WriteFile(filepath.Join(pkg, "worker.mjs"), nil, 0600)
	if _, err := project.Worker(projectPath); err == nil {
		t.Fatal("a broken selected install must shadow ancestors")
	}
	os.RemoveAll(filepath.Join(projectPath, "node_modules"))
	if _, err := project.Worker(projectPath); err != nil {
		t.Fatal(err)
	}
	os.WriteFile(filepath.Join(pkg, "package.json"), []byte(`{"name":"@octane-xplat/cli","exports":{"./worker":"./../../escape.mjs"}}`), 0600)
	if _, err := project.Worker(projectPath); err == nil {
		t.Fatal("accepted escaping worker")
	}
}

package mobile

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	ns "github.com/octane-xplat/nativescript-cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
)

func TestPreflightNeedsOfficialViteWithoutUpstreamCLI(t *testing.T) {
	root := t.TempDir()
	put := func(file, text string) {
		t.Helper()
		file = filepath.Join(root, file)
		if err := os.MkdirAll(filepath.Dir(file), 0700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(file, []byte(text), 0600); err != nil {
			t.Fatal(err)
		}
	}
	put("package.json", `{"name":"mobile","dependencies":{"vite":"8","@nativescript/vite":"8"}}`)
	put("node_modules/vite/package.json", `{"name":"vite","bin":{"vite":"bin/vite.js"}}`)
	put("node_modules/vite/bin/vite.js", "throw Error('preflight must not execute the engine')")
	put("node_modules/@nativescript/vite/package.json", `{"name":"@nativescript/vite"}`)
	if err := Preflight(context.Background(), root); err != nil {
		t.Fatal(err)
	}
	os.RemoveAll(filepath.Join(root, "node_modules/@nativescript/vite"))
	if err := Preflight(context.Background(), root); err == nil {
		t.Fatal("missing official engine accepted")
	}
}
func TestRequestAndErrorBoundaries(t *testing.T) {
	r := Request("/app", "android", false)
	if r.ProjectDir != "/app" || r.OutputDir != filepath.Join("/app", ".xplat-ns") || r.Target.Platform != ns.Android || r.Target.Configuration != ns.Debug || r.Target.Destination.Architecture != "arm64-v8a" {
		t.Fatal(r)
	}
	cause := &ns.OperationError{Operation: "build", Kind: ns.ErrBuild, Advice: "fix the authored configuration"}
	if err := Error(cause); !errors.Is(err, ns.ErrBuild) || !strings.Contains(err.Error(), cause.Advice) {
		t.Fatal(err)
	}
	var cleanup *proc.CleanupError
	if !errors.As(Error(errors.Join(context.Canceled, ns.ErrCleanup)), &cleanup) {
		t.Fatal("cleanup identity lost")
	}
}

package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

// Windows containment starts this executable as a gated child. Go's generated
// test main bypasses both production entries, so route fixtures need the same
// internal gate dispatch instead of accidentally rerunning the unit suite.
func TestMain(m *testing.M) {
	if len(os.Args) > 1 && os.Args[1] == "_gate" {
		childGate(os.Args[2:])
		os.Exit(0)
	}
	os.Exit(m.Run())
}

func TestGateChild(t *testing.T) {
	if os.Getenv("XPLAT_GO_TEST_GATE") != "1" {
		t.Skip("subprocess helper")
	}
	_, _ = os.Stdout.WriteString("native-test-gate-child\n")
}

func TestNativeTestExecutableDispatchesGate(t *testing.T) {
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	result, err := runProcess(ctx, []string{exe, "-test.run=^TestGateChild$"}, t.TempDir(), append(os.Environ(), "XPLAT_GO_TEST_GATE=1"))
	if err != nil || result.ExitCode != 0 || !strings.Contains(result.Stdout, "native-test-gate-child") {
		t.Fatalf("native test gate did not dispatch its child: %v\n%+v", err, result)
	}
}

// A runtime-only portable fixture can cancel the real watcher without pretending
// that Node's Windows kill(SIGTERM) delivers a graceful console interrupt. It
// exercises the same watcher/worker/process ownership, not public console input.
func TestRouteWatchFixture(t *testing.T) {
	project, stop := os.Getenv("XPLAT_GO_ROUTE_FIXTURE"), os.Getenv("XPLAT_GO_ROUTE_STOP")
	if project == "" || stop == "" {
		t.Skip("activated only by the portable route qualification runner")
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()
	go func() {
		ticker := time.NewTicker(50 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if _, err := os.Stat(stop); err == nil {
					cancel()
					return
				}
			}
		}
	}()
	if err := watchRoutes(ctx, project, routeOptions{}); err != context.Canceled {
		t.Fatalf("watch cancellation did not complete cleanly: %v", err)
	}
}

func TestRoutePlanRequiresCompleteExpectedDestinations(t *testing.T) {
	project := t.TempDir()
	location := routeLocation{Project: project, Directory: filepath.Join(project, "app"), Base: filepath.Join(project, "routes.gen")}
	before := map[string]artifactState{}
	outputs := []map[string]any{}
	for _, path := range location.outputPaths() {
		before[path] = artifactState{Path: path}
		outputs = append(outputs, map[string]any{"file": path, "source": "generated"})
	}
	plan := func(count any, values []map[string]any) json.RawMessage {
		data, err := json.Marshal(map[string]any{"version": 1, "count": count, "outputs": values})
		if err != nil {
			t.Fatal(err)
		}
		return data
	}
	if artifacts, count, err := validateRouteArtifacts(plan(2, outputs), location, before, true); err != nil || count == nil || *count != 2 || len(artifacts) != 18 {
		t.Fatalf("valid canonical plan rejected: %v", err)
	}
	for _, count := range []any{nil, true, false, -1, 1.5, "2", 50001} {
		if _, _, err := validateRouteArtifacts(plan(count, outputs), location, before, true); err == nil {
			t.Fatalf("invalid count accepted: %#v", count)
		}
	}
	for _, values := range [][]map[string]any{
		outputs[:17],
		append(append([]map[string]any{}, outputs...), outputs[0]),
		append(append([]map[string]any{}, outputs[:17]...), map[string]any{"file": filepath.Join(project, "user.ts"), "source": "overwrite"}),
		append(append([]map[string]any{}, outputs[:17]...), map[string]any{"file": location.outputPaths()[17], "source": nil}),
	} {
		if _, _, err := validateRouteArtifacts(plan(2, values), location, before, true); err == nil {
			t.Fatal("partial, duplicate or malformed plan accepted")
		}
	}
	preserved := before[location.Base+".data.ts"]
	preserved.Exists = true
	before[preserved.Path] = preserved
	withoutData := []map[string]any{}
	for _, value := range outputs {
		if value["file"] != preserved.Path {
			withoutData = append(withoutData, value)
		}
	}
	if _, _, err := validateRouteArtifacts(plan(2, withoutData), location, before, false); err != nil {
		t.Fatalf("type-only preparation must preserve existing baked data: %v", err)
	}
	if _, _, err := validateRouteArtifacts(plan(2, withoutData), location, before, true); err == nil {
		t.Fatal("baking accepted an omitted data artifact")
	}
}

func TestArtifactPublicationRejectsAConcurrentOutputEditBeforeAnyRename(t *testing.T) {
	ctx := context.Background()
	project := t.TempDir()
	scope, err := outputScope(project, project)
	if err != nil {
		t.Fatal(err)
	}
	artifacts := []plannedArtifact{}
	for _, name := range []string{"a.ts", "b.ts"} {
		file := filepath.Join(project, name)
		if err = os.WriteFile(file, []byte("original"), 0644); err != nil {
			t.Fatal(err)
		}
		state, err := snapshotArtifact(ctx, scope, file)
		if err != nil {
			t.Fatal(err)
		}
		artifacts = append(artifacts, plannedArtifact{file, "generated", state})
	}
	err = publishArtifacts(ctx, scope, artifacts, func() error {
		return os.WriteFile(filepath.Join(project, "b.ts"), []byte("user edit"), 0644)
	})
	if err == nil || !strings.Contains(err.Error(), "changed during planning") {
		t.Fatalf("concurrent output edit was not rejected: %v", err)
	}
	for name, expected := range map[string]string{"a.ts": "original", "b.ts": "user edit"} {
		data, err := os.ReadFile(filepath.Join(project, name))
		if err != nil || string(data) != expected {
			t.Fatalf("publication clobbered %s: %q %v", name, data, err)
		}
	}
	entries, _ := os.ReadDir(project)
	for _, entry := range entries {
		if strings.Contains(entry.Name(), ".tmp-xplat-") {
			t.Fatal("owned staging file survived rejected publication")
		}
	}
}

func TestArtifactPublicationPreservesModeAndNoopMtime(t *testing.T) {
	ctx := context.Background()
	project := t.TempDir()
	file := filepath.Join(project, "module.ts")
	if err := os.WriteFile(file, []byte("old"), 0640); err != nil {
		t.Fatal(err)
	}
	scope, err := outputScope(project, project)
	if err != nil {
		t.Fatal(err)
	}
	before, err := snapshotArtifact(ctx, scope, file)
	if err != nil {
		t.Fatal(err)
	}
	if err = publishArtifacts(ctx, scope, []plannedArtifact{{file, "new", before}}, func() error { return nil }); err != nil {
		t.Fatal(err)
	}
	after, err := snapshotArtifact(ctx, scope, file)
	if err != nil {
		t.Fatal(err)
	}
	if runtime.GOOS != "windows" && after.Info.Mode().Perm() != before.Info.Mode().Perm() {
		t.Fatal("source publication silently changed output permissions")
	}
	if err = publishArtifacts(ctx, scope, []plannedArtifact{{file, "new", after}}, func() error { return nil }); err != nil {
		t.Fatal(err)
	}
	noop, err := os.Stat(file)
	if err != nil || !sameArtifactInfo(after.Info, noop) {
		t.Fatal("identical generation replaced or touched an unchanged file")
	}
}

func TestRouteFingerprintUsesRawBytesAndIgnoresItsOwnGeneratedTree(t *testing.T) {
	ctx := context.Background()
	project := t.TempDir()
	if err := os.Mkdir(filepath.Join(project, "app"), 0755); err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(project, "app", "index.tsx")
	if err := os.WriteFile(file, []byte{0xff}, 0644); err != nil {
		t.Fatal(err)
	}
	out := "app/generated/routes.gen"
	location, err := locateRoutes(project, routeOptions{Output: &out}, "")
	if err != nil {
		t.Fatal(err)
	}
	before, err := routeFingerprint(ctx, location)
	if err != nil {
		t.Fatal(err)
	}
	original, _ := os.Stat(file)
	if err = os.WriteFile(file, []byte{0xfe}, 0644); err != nil {
		t.Fatal(err)
	}
	_ = os.Chtimes(file, original.ModTime(), original.ModTime())
	changed, err := routeFingerprint(ctx, location)
	if err != nil || changed == before {
		t.Fatal("different invalid UTF-8 bytes collapsed to one source fingerprint")
	}
	if err = os.MkdirAll(filepath.Dir(location.Base), 0755); err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(location.Base+".types.ts", []byte("generated"), 0644); err != nil {
		t.Fatal(err)
	}
	ignored, err := routeFingerprint(ctx, location)
	if err != nil || ignored != changed {
		t.Fatal("generated files or empty output directories invalidated their own generation")
	}
	if err = os.WriteFile(filepath.Join(project, "xplat.routes.json"), []byte("{}"), 0644); err != nil {
		t.Fatal(err)
	}
	if _, err = routeFingerprint(ctx, location); err == nil {
		t.Fatal("configuration changed after path selection without invalidating the plan")
	}
}

func TestRouteOutputAliasesCannotOverwriteSourceOrEscapeScope(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("file symlinks need separate host privileges; Windows directory-junction coverage is in the portable workflow")
	}
	ctx := context.Background()
	project := t.TempDir()
	for _, directory := range []string{"app", "stored"} {
		if err := os.Mkdir(filepath.Join(project, directory), 0755); err != nil {
			t.Fatal(err)
		}
	}
	location, err := locateRoutes(project, routeOptions{}, "")
	if err != nil {
		t.Fatal(err)
	}
	target := filepath.Join(project, "stored", "contracts.ts")
	if err = os.WriteFile(target, []byte("stored"), 0644); err != nil {
		t.Fatal(err)
	}
	link := location.Base + ".contracts.ts"
	if err = os.Symlink(target, link); err != nil {
		t.Fatal(err)
	}
	scope, before, err := captureRouteOutputs(ctx, location)
	if err != nil {
		t.Fatal(err)
	}
	if err = publishArtifacts(ctx, scope, []plannedArtifact{{link, "generated", before[link]}}, func() error { return nil }); err != nil {
		t.Fatal(err)
	}
	info, _ := os.Lstat(link)
	data, _ := os.ReadFile(target)
	if info.Mode()&os.ModeSymlink == 0 || string(data) != "generated" {
		t.Fatal("ordinary output alias was replaced or its target was not updated")
	}
	_ = os.Remove(link)
	input := filepath.Join(project, "app", "input.ts")
	_ = os.WriteFile(input, []byte("keep"), 0644)
	_ = os.Symlink(input, link)
	if _, _, err = captureRouteOutputs(ctx, location); err == nil {
		t.Fatal("output alias can overwrite route source")
	}
	_ = os.Remove(link)
	external := filepath.Join(t.TempDir(), "private.ts")
	_ = os.WriteFile(external, []byte("private"), 0600)
	_ = os.Symlink(external, link)
	if _, _, err = captureRouteOutputs(ctx, location); err == nil {
		t.Fatal("output alias escaped its authorized root")
	}
}

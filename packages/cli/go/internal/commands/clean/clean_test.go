package clean

import (
	"context"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func cleanFixture(t *testing.T) (string, func(string, string)) {
	t.Helper()
	root := filepath.Join(t.TempDir(), "project")
	put := func(path, text string) {
		t.Helper()
		file := filepath.Join(root, filepath.FromSlash(path))
		if err := os.MkdirAll(filepath.Dir(file), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(file, []byte(text), 0644); err != nil {
			t.Fatal(err)
		}
	}
	put("package.json", "{}")
	put("dist/bundle.js", "output")
	put(".ns-vite-build/bundle.js", "cache")
	put("node_modules/.cache/xplat/contracts.json", "cache")
	put("platforms/ios/generated", "output")
	put("platforms/macos/host.swift", "authored")
	return root, put
}

func TestCleanRejectsAStaleManifestBeforeAnyDeletion(t *testing.T) {
	for _, before := range []string{"{}", "missing"} {
		t.Run(before, func(t *testing.T) {
			root, put := cleanFixture(t)
			if before == "missing" {
				if err := os.Remove(filepath.Join(root, "package.json")); err != nil {
					t.Fatal(err)
				}
			}
			plan, err := planClean(root)
			if err != nil {
				t.Fatal(err)
			}
			defer plan.close()
			if before == "missing" {
				put("package.json", "")
			} else {
				put("package.json", `{"nativescript":{"platforms":{}}}`)
			}
			if err = plan.remove(context.Background(), func(parent *os.Root, name string) error { return parent.RemoveAll(name) }); err == nil {
				t.Fatal("stale project metadata was accepted")
			}
			for _, path := range []string{"dist/bundle.js", "platforms/ios/generated"} {
				if _, err := os.Stat(filepath.Join(root, path)); err != nil {
					t.Fatalf("deleted %s before metadata validation: %v", path, err)
				}
			}
		})
	}
}

func TestCleanRejectsReplacedParentsAndLeavesTheOldHandleUntouched(t *testing.T) {
	root, put := cleanFixture(t)
	plan, err := planClean(root)
	if err != nil {
		t.Fatal(err)
	}
	defer plan.close()
	if err = os.Rename(filepath.Join(root, "node_modules/.cache"), filepath.Join(root, "old-cache")); err != nil {
		t.Fatal(err)
	}
	put("node_modules/.cache/xplat/authored.txt", "new owner")
	if err = plan.remove(context.Background(), func(parent *os.Root, name string) error { return parent.RemoveAll(name) }); err == nil {
		t.Fatal("replaced cache parent was accepted")
	}
	for _, path := range []string{"dist/bundle.js", "old-cache/xplat/contracts.json", "node_modules/.cache/xplat/authored.txt"} {
		if _, err = os.Stat(filepath.Join(root, path)); err != nil {
			t.Fatalf("deleted %s despite replaced parent: %v", path, err)
		}
	}
}

func TestCleanCancellationAndPartialFailureKeepEffectEvidence(t *testing.T) {
	for _, partialFailure := range []bool{false, true} {
		t.Run(map[bool]string{false: "cancelled", true: "partial removal"}[partialFailure], func(t *testing.T) {
			root, _ := cleanFixture(t)
			plan, err := planClean(root)
			if err != nil {
				t.Fatal(err)
			}
			defer plan.close()
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			err = plan.remove(ctx, func(parent *os.Root, name string) error {
				if partialFailure {
					if err := parent.Remove(filepath.Join(name, "bundle.js")); err != nil {
						return err
					}
					return errors.New("injected removal failure")
				}
				if err := parent.RemoveAll(name); err != nil {
					return err
				}
				cancel()
				return nil
			})
			var failure *Failure
			if !errors.As(err, &failure) || !cli.RequiresFailureEvidence(err) || !strings.Contains(err.Error(), "dist") {
				t.Fatalf("missing partial cleanup evidence: %v", err)
			}
			if got := cli.ContextualFailure(ctx, cli.ExecutionFailure(err)); got.Code != "execution_failure" {
				t.Fatalf("root cancellation hid cleanup effects: %#v", got)
			}
			for _, path := range []string{".ns-vite-build/bundle.js", "platforms/ios/generated", "platforms/macos/host.swift"} {
				if _, err := os.Stat(filepath.Join(root, path)); err != nil {
					t.Fatalf("later target %s was touched: %v", path, err)
				}
			}
		})
	}
	root, _ := cleanFixture(t)
	plan, err := planClean(root)
	if err != nil {
		t.Fatal(err)
	}
	defer plan.close()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err = plan.remove(ctx, func(*os.Root, string) error { t.Fatal("cancelled plan removed data"); return nil })
	if !errors.Is(err, context.Canceled) || cli.RequiresFailureEvidence(err) {
		t.Fatalf("pre-effect cancellation contract: %v", err)
	}
}

func TestProjectOutputLockRejectsConcurrentOwnersAndSurvivesOutputRemoval(t *testing.T) {
	cache := t.TempDir()
	t.Setenv("HOME", cache)
	t.Setenv("XDG_CACHE_HOME", cache)
	t.Setenv("LOCALAPPDATA", cache)
	root, _ := cleanFixture(t)
	release, err := project.LockProjectOutputs(root)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { release() }()
	if second, err := project.LockProjectOutputs(root); err == nil {
		second()
		t.Fatal("two owners acquired one project's output lease")
	}
	alias := filepath.Join(filepath.Dir(root), "PROJECT")
	if _, err := os.Stat(alias); err == nil {
		if second, err := project.LockProjectOutputs(alias); err == nil {
			second()
			t.Fatal("case-only path alias bypassed the physical project lease")
		}
	}
	if err = os.RemoveAll(filepath.Join(root, "dist")); err != nil {
		t.Fatal(err)
	}
	if second, err := project.LockProjectOutputs(root); err == nil {
		second()
		t.Fatal("removing outputs replaced the live lease identity")
	}
	release()
	// Avoid a deferred double close while still testing reacquisition.
	release = func() {}
	second, err := project.LockProjectOutputs(root)
	if err != nil {
		t.Fatal(err)
	}
	second()
}

func TestProjectOutputLockCannotLiveInItsOwnCleanScope(t *testing.T) {
	root, _ := cleanFixture(t)
	cache := filepath.Join(root, "dist", "cache")
	t.Setenv("HOME", cache)
	t.Setenv("XDG_CACHE_HOME", cache)
	t.Setenv("LOCALAPPDATA", cache)
	if release, err := project.LockProjectOutputs(root); err == nil {
		release()
		t.Fatal("accepted a lease inside outputs that clean removes")
	}
	if _, err := os.Stat(filepath.Join(root, "dist/bundle.js")); err != nil {
		t.Fatal(err)
	}
}

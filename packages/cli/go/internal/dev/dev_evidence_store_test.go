package dev

import (
	"context"
	"encoding/json"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func evidenceFixtureRecord(id, app string) json.RawMessage {
	return mustJSON(map[string]any{"id": id, "kind": "inspection", "createdAt": cli.IsoNow(), "provenance": map[string]any{"appRoot": app, "sessionId": "sess_fixture", "documentId": "doc_fixture"}, "data": map[string]any{"text": "Unicode 😀 <&>"}, "retention": map[string]any{"scope": "session"}})
}
func TestDevAppEvidenceRetentionReadsCreateNothing(t *testing.T) {
	base := t.TempDir()
	app := filepath.Join(base, "app")
	if err := os.Mkdir(app, 0700); err != nil {
		t.Fatal(err)
	}
	app, _ = osfs.Canonical(app)
	parent := filepath.Join(base, "missing")
	value, failure := evidenceDiskCommand(context.Background(), parent, app, "evidence list", map[string]any{}, nil)
	if failure != nil || len(value.([]json.RawMessage)) != 0 {
		t.Fatal(value, failure)
	}
	if _, err := os.Stat(parent); !os.IsNotExist(err) {
		t.Fatal("empty lookup created native cache", err)
	}
	_, failure = evidenceDiskCommand(context.Background(), parent, app, "evidence retain", map[string]any{"id": "ev_" + strings.Repeat("a", 32)}, nil)
	if failure == nil || failure.Code != "not_found" {
		t.Fatal(failure)
	}
	if _, err := os.Stat(parent); !os.IsNotExist(err) {
		t.Fatal("missing record retain created cache")
	}
}
func TestDevAppEvidenceRetentionSurvivesReopenAndIsAppScoped(t *testing.T) {
	base := t.TempDir()
	app := filepath.Join(base, "app")
	other := filepath.Join(base, "other")
	os.Mkdir(app, 0700)
	os.Mkdir(other, 0700)
	app, _ = osfs.Canonical(app)
	other, _ = osfs.Canonical(other)
	parent := filepath.Join(base, "cache")
	id := "ev_" + osfs.Identity()
	raw := evidenceFixtureRecord(id, app)
	retained, failure := evidenceDiskCommand(context.Background(), parent, app, "evidence retain", map[string]any{"id": id}, raw)
	if failure != nil {
		t.Fatal(failure)
	}
	record := retained.(map[string]any)["record"].(json.RawMessage)
	if !strings.Contains(string(record), `"scope":"retained"`) || !strings.Contains(string(record), `"expiresAt":null`) {
		t.Fatal(string(record))
	}
	listed, failure := evidenceDiskCommand(context.Background(), parent, app, "evidence list", map[string]any{}, nil)
	if failure != nil || len(listed.([]json.RawMessage)) != 1 {
		t.Fatal(listed, failure)
	}
	listed, failure = evidenceDiskCommand(context.Background(), parent, other, "evidence list", map[string]any{}, nil)
	if failure != nil || len(listed.([]json.RawMessage)) != 0 {
		t.Fatal("foreign app saw evidence", listed, failure)
	}
	if _, failure = evidenceDiskCommand(context.Background(), parent, app, "evidence delete", map[string]any{"id": id}, nil); failure != nil {
		t.Fatal(failure)
	}
	if _, failure = evidenceDiskCommand(context.Background(), parent, app, "evidence delete", map[string]any{"id": id}, nil); failure == nil || failure.Code != "not_found" {
		t.Fatal(failure)
	}
}
func TestDevAppEvidenceRetentionExpiryCorruptionAndCapacity(t *testing.T) {
	base := t.TempDir()
	app := filepath.Join(base, "app")
	os.Mkdir(app, 0700)
	app, _ = osfs.Canonical(app)
	parent := filepath.Join(base, "cache")
	ctx := context.Background()
	id := "ev_" + osfs.Identity()
	raw := evidenceFixtureRecord(id, app)
	if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence retain", map[string]any{"id": id, "expiresAt": "yesterday"}, raw); failure == nil || failure.Code != "invalid_selection" {
		t.Fatal(failure)
	}
	if _, err := os.Stat(parent); !os.IsNotExist(err) {
		t.Fatal("invalid expiration wrote cache")
	}
	if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence retain", map[string]any{"id": id, "expiresAt": time.Now().Add(time.Hour).UTC().Format(time.RFC3339Nano)}, raw); failure != nil {
		t.Fatal(failure)
	}
	err := withRetainedEvidence(ctx, parent, app, false, func(root *os.Root, items []retainedEvidenceItem) error {
		var record map[string]any
		json.Unmarshal(items[0].raw, &record)
		record["retention"] = map[string]any{"scope": "retained", "expiresAt": time.Now().Add(-time.Second).UTC().Format(time.RFC3339Nano)}
		return publishEvidence(root, app, mustJSON(record))
	})
	if err != nil {
		t.Fatal(err)
	}
	listed, failure := evidenceDiskCommand(ctx, parent, app, "evidence list", map[string]any{}, nil)
	if failure != nil || len(listed.([]json.RawMessage)) != 0 {
		t.Fatal("expiry was not filtered", listed, failure)
	}
	err = withRetainedEvidence(ctx, parent, app, false, func(root *os.Root, items []retainedEvidenceItem) error {
		if len(items) != 1 {
			t.Error("pure read removed an expired file")
		}
		return root.Remove(id + ".json")
	})
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < retainedEvidenceCount; i++ {
		next := "ev_" + osfs.Identity()
		if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence retain", map[string]any{"id": next}, evidenceFixtureRecord(next, app)); failure != nil {
			t.Fatal(failure)
		}
	}
	extra := "ev_" + osfs.Identity()
	if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence retain", map[string]any{"id": extra}, evidenceFixtureRecord(extra, app)); failure == nil {
		t.Fatal("capacity silently evicted retained data")
	}
	err = withRetainedEvidence(ctx, parent, app, false, func(root *os.Root, items []retainedEvidenceItem) error {
		return root.WriteFile(items[0].header.ID+".json", []byte(`{}`), 0600)
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence list", map[string]any{}, nil); failure == nil {
		t.Fatal("corruption became empty evidence")
	}
}

func TestDevAppEvidenceRetentionConcurrentPublishersAndMissingLock(t *testing.T) {
	base := t.TempDir()
	app := filepath.Join(base, "app")
	os.Mkdir(app, 0700)
	app, _ = osfs.Canonical(app)
	parent := filepath.Join(base, "cache")
	ctx := context.Background()
	seed := "ev_" + osfs.Identity()
	if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence retain", map[string]any{"id": seed}, evidenceFixtureRecord(seed, app)); failure != nil {
		t.Fatal(failure)
	}
	var workers sync.WaitGroup
	for i := 0; i < 8; i++ {
		workers.Add(1)
		go func() {
			defer workers.Done()
			id := "ev_" + osfs.Identity()
			if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence retain", map[string]any{"id": id}, evidenceFixtureRecord(id, app)); failure != nil {
				t.Error(failure)
			}
		}()
	}
	workers.Wait()
	listed, failure := evidenceDiskCommand(ctx, parent, app, "evidence list", map[string]any{}, nil)
	if failure != nil || len(listed.([]json.RawMessage)) != 9 {
		t.Fatal("concurrent publication lost records", listed, failure)
	}
	var directory string
	if err := withRetainedEvidence(ctx, parent, app, false, func(root *os.Root, _ []retainedEvidenceItem) error { directory = root.Name(); return nil }); err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(filepath.Join(directory, "store.lock")); err != nil {
		t.Fatal(err)
	}
	if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence list", map[string]any{}, nil); failure == nil || failure.Code != "execution_failure" {
		t.Fatal("missing lock became empty evidence", failure)
	}
	if _, err := os.Stat(filepath.Join(directory, "store.lock")); !os.IsNotExist(err) {
		t.Fatal("read recreated a missing lock")
	}
}
func TestDevAppEvidenceRetentionRejectsLinkedRecord(t *testing.T) {
	base := t.TempDir()
	app := filepath.Join(base, "app")
	os.Mkdir(app, 0700)
	app, _ = osfs.Canonical(app)
	parent := filepath.Join(base, "cache")
	ctx := context.Background()
	id := "ev_" + osfs.Identity()
	if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence retain", map[string]any{"id": id}, evidenceFixtureRecord(id, app)); failure != nil {
		t.Fatal(failure)
	}
	var directory string
	if err := withRetainedEvidence(ctx, parent, app, false, func(root *os.Root, _ []retainedEvidenceItem) error { directory = root.Name(); return nil }); err != nil {
		t.Fatal(err)
	}
	outside := filepath.Join(base, "outside.txt")
	os.WriteFile(outside, []byte("owned fixture outside the evidence root"), 0600)
	path := filepath.Join(directory, id+".json")
	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, path); err != nil {
		t.Skip("file symlink unavailable on this host:", err)
	}
	if _, failure := evidenceDiskCommand(ctx, parent, app, "evidence list", map[string]any{}, nil); failure == nil {
		t.Fatal("linked evidence accepted")
	}
	data, _ := os.ReadFile(outside)
	if string(data) != "owned fixture outside the evidence root" {
		t.Fatal("outside data changed")
	}
}

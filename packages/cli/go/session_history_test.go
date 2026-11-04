package main

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strings"
	"sync"
	"testing"
)

func testHistoryStore(t *testing.T) *historyStore {
	t.Helper()
	store, err := openHistoryStore(t.TempDir(), t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { store.Close() })
	return store
}
func testHistoryCapture(t *testing.T, store *historyStore) *historyCapture {
	t.Helper()
	capture, err := store.Capture(historySession{AppID: "fixture", OwnerID: "owner-generation", Platform: "web", TargetID: "web", Origin: "dev", Ownership: "owned"})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { capture.Finish("stopped", "Test resources released.", true) })
	return capture
}
func appendHistory(t *testing.T, capture *historyCapture, line string) {
	t.Helper()
	if err := capture.Append(historyRecord{Stream: "stdout", Line: line}); err != nil {
		t.Fatal(err)
	}
}

func TestHistoryOwnershipAndCleanupEvidence(t *testing.T) {
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	initial, err := store.Read(capture.session.SessionID)
	if err != nil {
		t.Fatal(err)
	}
	if observedHistorySession(initial, "different-owner")["historical"] != true || observedHistorySession(initial, initial.OwnerID)["historical"] != false {
		t.Fatal("recorded PID must not confer live ownership")
	}
	if err = capture.Update("ready", "Engine evidence recorded."); err != nil {
		t.Fatal(err)
	}
	if err = capture.Finish("failed", "Process cleanup could not be confirmed.", false); err != nil {
		t.Fatal(err)
	}
	ended, err := store.Read(initial.SessionID)
	if err != nil {
		t.Fatal(err)
	}
	if ended.CleanupConfirmed || ended.EndedAt != nil || ended.State != "failed" {
		t.Fatalf("uncertain cleanup converted to proof: %+v", ended)
	}
	if err = store.Prune(0); err != nil {
		t.Fatal(err)
	}
	if _, err = store.Read(initial.SessionID); err != nil {
		t.Fatal("unfinished evidence was pruned", err)
	}
}
func TestHistoryRetentionAndMalformedIsolation(t *testing.T) {
	store := testHistoryStore(t)
	active := testHistoryCapture(t, store)
	completed := testHistoryCapture(t, store)
	if err := completed.Finish("stopped", "Cleaned.", true); err != nil {
		t.Fatal(err)
	}
	if err := store.Prune(0); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Read(completed.session.SessionID); !os.IsNotExist(err) {
		t.Fatalf("completed not pruned: %v", err)
	}
	if _, err := store.Read(active.session.SessionID); err != nil {
		t.Fatal("active record pruned", err)
	}
	corrupt := "sess_00000000-0000-0000-0000-000000000000"
	if err := store.root.Mkdir(corrupt, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(store.path, corrupt, "session.json"), []byte("malformed"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := active.Finish("stopped", "Owned resources released before retention.", true); err == nil {
		t.Fatal("malformed retention inventory was hidden")
	}
	saved, err := store.Read(active.session.SessionID)
	if err != nil || !saved.CleanupConfirmed || saved.RetentionError == "" {
		t.Fatalf("unrelated corrupt data blocked known-session cleanup checkpoint: %+v %v", saved, err)
	}
	if err := active.Finish("stopped", "Repeat.", true); err == nil {
		t.Fatal("repeat finish hid prior retention failure")
	}
	if _, err := store.root.Stat(corrupt); err != nil {
		t.Fatal("malformed record must be preserved", err)
	}
}
func TestHistoryPaginationRotationAndUnicode(t *testing.T) {
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	capture.segmentLimit = 512
	for i := 0; i < 12; i++ {
		appendHistory(t, capture, strings.Repeat("x", 40))
	}
	all, err := store.Logs(capture.session.SessionID, capture.session.OwnerID, nil, 500, "")
	if err != nil {
		t.Fatal(err)
	}
	if !all.Truncated || all.Dropped == 0 || len(all.Records) > 6 || all.NewestSeq != 12 {
		t.Fatalf("rotation not bounded: %+v", all)
	}
	tail, err := store.Logs(capture.session.SessionID, capture.session.OwnerID, nil, 2, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(tail.Records) != 2 || tail.Records[1].Seq != 12 {
		t.Fatalf("default tail mismatch: %+v", tail)
	}
	cursor := int64(0)
	first, err := store.Logs(capture.session.SessionID, capture.session.OwnerID, &cursor, 2, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(first.Records) != 2 || first.Records[0].Seq != all.OldestSeq || first.NextCursor != first.Records[1].Seq {
		t.Fatalf("cursor page mismatch: %+v", first)
	}
	future := int64(99)
	if _, err = store.Logs(capture.session.SessionID, "", &future, 2, ""); err == nil {
		t.Fatal("foreign/ahead cursor accepted")
	}
	filtered, err := store.Logs(capture.session.SessionID, "", &cursor, 2, "stderr")
	if err != nil || len(filtered.Records) != 0 || filtered.NextCursor != 12 {
		t.Fatalf("filtered cursor did not advance: %+v %v", filtered, err)
	}
	unicode := testHistoryCapture(t, store)
	appendHistory(t, unicode, strings.Repeat("x", 8191)+"😀")
	logs, err := store.Logs(unicode.session.SessionID, "", nil, 2, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(logs.Records) != 1 || logs.Records[0].Line != strings.Repeat("x", 8191) || !logs.Records[0].LineTruncated {
		t.Fatal("UTF-16 line bound must retain valid complete Unicode")
	}
}
func TestHistoryAppendFailurePreservesReadablePrefix(t *testing.T) {
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	appendHistory(t, capture, "readable prefix")
	data, err := historyFile(capture.root, "current.jsonl", historySegmentBytes)
	if err != nil {
		t.Fatal(err)
	}
	if err = capture.root.Remove("current.jsonl"); err != nil {
		t.Fatal(err)
	}
	if err = capture.root.Mkdir("current.jsonl", 0700); err != nil {
		t.Fatal(err)
	}
	if err = capture.Append(historyRecord{Stream: "stderr", Line: "must fail"}); err == nil {
		t.Fatal("invalid output accepted")
	}
	if err = capture.root.Remove("current.jsonl"); err != nil {
		t.Fatal(err)
	}
	partial := append(data, []byte(`{"seq":`)...)
	if err = os.WriteFile(filepath.Join(store.path, capture.session.SessionID, "current.jsonl"), partial, 0600); err != nil {
		t.Fatal(err)
	}
	if err = capture.Append(historyRecord{Stream: "stdout", Line: "must never complete a broken tail"}); err == nil {
		t.Fatal("writer resumed after append failure")
	}
	actual, _ := historyFile(capture.root, "current.jsonl", historySegmentBytes)
	if string(actual) != string(partial) {
		t.Fatal("failed capture appended to an incomplete record")
	}
	logs, err := store.Logs(capture.session.SessionID, "", nil, 500, "")
	if err != nil || !logs.IncompleteTail || len(logs.Records) != 1 || logs.Records[0].Line != "readable prefix" {
		t.Fatalf("prefix unavailable: %+v %v", logs, err)
	}
	if err = capture.Finish("failed", "Capture incomplete, process resources released.", true); err == nil {
		t.Fatal("retention failure was hidden")
	}
	saved, err := store.Read(capture.session.SessionID)
	if err != nil || saved.RetentionError == "" {
		t.Fatal("capture loss was not persisted", err)
	}
}
func TestHistoryNamespaceAndFileBoundaries(t *testing.T) {
	project := t.TempDir()
	if _, err := openHistoryStore(project, project); err == nil {
		t.Fatal("history created inside cleanable project")
	}
	if _, err := os.Lstat(filepath.Join(project, "history-go-v1")); !os.IsNotExist(err) {
		t.Fatal("rejected cache created files")
	}
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	if _, err := store.Read("../session"); err == nil {
		t.Fatal("escaping id accepted")
	}
	outside := filepath.Join(t.TempDir(), "original")
	if err := os.WriteFile(outside, []byte("original"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(store.path, capture.session.SessionID, "current.jsonl")); err != nil {
		t.Skip("file symlink fixture unavailable", err)
	}
	if err := capture.Append(historyRecord{Stream: "stdout", Line: "do not overwrite external data"}); err == nil {
		t.Fatal("symlink output accepted")
	}
	data, _ := os.ReadFile(outside)
	if string(data) != "original" {
		t.Fatal("external original modified")
	}
}

func TestHistoryLogPagesAgainstNode(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node unavailable")
	}
	source, _ := filepath.Abs("../src/dev-logs.ts")
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	capture.segmentLimit = 512
	for i := 0; i < 12; i++ {
		stream := "stdout"
		if i%2 == 0 {
			stream = "stderr"
		}
		if err = capture.Append(historyRecord{Stream: stream, Line: "Actual shared log contract π"}); err != nil {
			t.Fatal(err)
		}
	}
	nodeRoot := t.TempDir()
	target := filepath.Join(nodeRoot, "node_modules/.cache/xplat/sessions", capture.session.SessionID)
	if err = os.MkdirAll(target, 0700); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"session.json", "current.jsonl", "previous.jsonl"} {
		data, err := historyFile(capture.root, name, historySegmentBytes)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			t.Fatal(err)
		}
		if err = os.WriteFile(filepath.Join(target, name), data, 0600); err != nil {
			t.Fatal(err)
		}
	}
	for _, selection := range []struct {
		cursor *int64
		limit  int
		stream string
	}{{nil, 2, ""}, {new(int64), 2, ""}, {new(int64), 2, "stderr"}, {nil, 3, "stdout"}} {
		request, _ := json.Marshal(map[string]any{"cursor": selection.cursor, "limit": selection.limit, "stream": selection.stream})
		cmd := exec.Command(node, "--input-type=module", "-e", `import{pathToFileURL}from'node:url';const api=await import(pathToFileURL(process.argv[1]).href);const options=JSON.parse(process.argv[4]);if(options.cursor===null)delete options.cursor;const result=api.readDevLogs(process.argv[2],process.argv[3],options);delete result.session;delete result.coverage;console.log(JSON.stringify(result));`, source, nodeRoot, capture.session.SessionID, string(request))
		output := testNodeOutput(t, context.Background(), cmd)
		var expected map[string]any
		if err = json.Unmarshal(output, &expected); err != nil {
			t.Fatal(err)
		}
		actual, err := store.Logs(capture.session.SessionID, capture.session.OwnerID, selection.cursor, selection.limit, selection.stream)
		if err != nil {
			t.Fatal(err)
		}
		data, _ := json.Marshal(actual)
		var observed map[string]any
		_ = json.Unmarshal(data, &observed)
		delete(observed, "session")
		delete(observed, "coverage")
		if !reflect.DeepEqual(observed, expected) {
			t.Fatalf("native=%s reference=%s", data, output)
		}
	}
	// A sequence gap must be disclosed rather than returning plausible logs.
	bad := []byte(`{"seq":99,"ts":"now","stream":"stdout","source":"web","line":"gap"}` + "\n")
	file, err := os.OpenFile(filepath.Join(store.path, capture.session.SessionID, "current.jsonl"), os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		t.Fatal(err)
	}
	_, err = file.Write(bad)
	file.Close()
	if err != nil {
		t.Fatal(err)
	}
	if _, err = store.Logs(capture.session.SessionID, "", nil, 500, ""); !errors.Is(err, errHistoryRotated) {
		t.Fatalf("missing gap disclosure: %v", err)
	}
}

func TestHistoryRejectsPreexistingHardlink(t *testing.T) {
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	original := filepath.Join(t.TempDir(), "original")
	if err := os.WriteFile(original, []byte("user original"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Link(original, filepath.Join(store.path, capture.session.SessionID, "current.jsonl")); err != nil {
		t.Skip("hardlink fixture unavailable", err)
	}
	if err := capture.Append(historyRecord{Stream: "stdout", Line: "must not append"}); err == nil {
		t.Fatal("preexisting hardlink accepted")
	}
	data, err := os.ReadFile(original)
	if err != nil || string(data) != "user original" {
		t.Fatal("user original changed", err)
	}
}

func TestHistoryConcurrentReaderSnapshots(t *testing.T) {
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	capture.segmentLimit = 512
	id, owner := capture.session.SessionID, capture.session.OwnerID
	stop := make(chan struct{})
	failures := make(chan error, 1)
	var readers sync.WaitGroup
	readers.Add(1)
	go func() {
		defer readers.Done()
		for {
			select {
			case <-stop:
				return
			default:
			}
			_, err := store.Logs(id, owner, nil, 500, "")
			if err != nil && !errors.Is(err, errHistoryRotated) && !errors.Is(err, errHistoryChanged) {
				select {
				case failures <- err:
				default:
				}
				return
			}
		}
	}()
	defer func() { close(stop); readers.Wait() }()
	for i := 0; i < 40; i++ {
		if err := capture.Append(historyRecord{Stream: "stdout", Line: "concurrent output"}); err != nil {
			t.Fatal(err)
		}
		if err := capture.Update("ready", "Concurrent metadata snapshot."); err != nil {
			t.Fatal(err)
		}
	}
	select {
	case err := <-failures:
		t.Fatal(err)
	default:
	}
}

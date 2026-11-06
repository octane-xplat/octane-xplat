package dev

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/history"
)

func TestDevDiagnosticsNoStateAndSelectorValidation(t *testing.T) {
	parent, app := filepath.Join(t.TempDir(), "missing"), t.TempDir()
	result, failure := readDevDiagnostics(context.Background(), parent, app, "", map[string]any{})
	if failure != nil || len(result.(map[string]any)["sessions"].([]map[string]any)) != 0 {
		t.Fatal("missing capture must be an empty inventory", failure)
	}
	if _, err := os.Stat(parent); !os.IsNotExist(err) {
		t.Fatal("reader created persistent state", err)
	}
	for _, values := range []map[string]any{
		{"sessionId": "../../other"}, {"sessionId": "sess_observed"}, {"jobId": "job_removed"},
		{"cursor": float64(1)}, {"limit": float64(1)}, {"stream": "stdout"},
		{"sessionId": "sess_00000000-0000-0000-0000-000000000000", "cursor": float64(-1)},
		{"sessionId": "sess_00000000-0000-0000-0000-000000000000", "limit": float64(0)},
		{"platform": "invalid"}, {"sessionId": nil},
	} {
		if _, failure := readDevDiagnostics(context.Background(), parent, app, "", values); failure == nil || failure.Code != "invalid_selection" {
			t.Fatal("invalid diagnostic selector accepted", values, failure)
		}
	}
	if _, failure := readDevDiagnostics(context.Background(), parent, app, "", map[string]any{"reportId": "native"}); failure == nil || failure.Code != "invalid_selection" {
		t.Fatal("invalid report id must be rejected", failure)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, failure := readDevDiagnostics(ctx, parent, app, "", map[string]any{}); failure == nil || failure.Code != "cancelled" {
		t.Fatal("reader cancellation was lost", failure)
	}
}
func TestDevDiagnosticsEngineHistoryIdentityPaginationAndOfflineReads(t *testing.T) {
	parent, app := t.TempDir(), t.TempDir()
	store, err := history.OpenHistoryStore(parent, app)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	capture := testHistoryCapture(t, store)
	appendHistory(t, capture, "first stdout")
	if err := capture.Append(history.Record{Stream: "stderr", Line: "fixture stderr"}); err != nil {
		t.Fatal(err)
	}
	appendHistory(t, capture, "last stdout")
	read := func(owner string, values map[string]any) map[string]any {
		t.Helper()
		result, failure := readDevDiagnostics(context.Background(), parent, app, owner, values)
		if failure != nil {
			t.Fatal(failure)
		}
		return result.(map[string]any)
	}
	list := read("owner-generation", map[string]any{})["sessions"].([]map[string]any)
	if len(list) != 1 || list[0]["historical"] != false {
		t.Fatal("authenticated owner should see its live engine capture", list)
	}
	historical := read("", map[string]any{})["sessions"].([]map[string]any)[0]
	if historical["historical"] != true || historical["state"] != "disconnected" || historical["cleanupConfirmed"] != false {
		t.Fatal("retained PID falsely proved liveness or cleanup", historical)
	}
	args := map[string]any{"sessionId": capture.Session.SessionID, "limit": float64(1), "stream": "stdout"}
	page := read("owner-generation", args)["logs"].(history.Logs)
	if len(page.Records) != 1 || page.Records[0].Line != "last stdout" || page.Historical {
		t.Fatal("initial filtered page must return its tail", page)
	}
	args["cursor"] = float64(0)
	page = read("owner-generation", args)["logs"].(history.Logs)
	if len(page.Records) != 1 || page.Records[0].Line != "first stdout" {
		t.Fatal("cursor pagination must return oldest matching record first", page)
	}
	args["cursor"] = float64(page.NextCursor)
	page = read("owner-generation", args)["logs"].(history.Logs)
	if page.Records[0].Line != "last stdout" {
		t.Fatal("stream cursor skipped a matching record", page)
	}
	args["cursor"] = float64(9000)
	if _, failure := readDevDiagnostics(context.Background(), parent, app, "", args); failure == nil || failure.Code != "invalid_selection" {
		t.Fatal("ahead cursor was not rejected", failure)
	}
	args = map[string]any{"sessionId": capture.Session.SessionID, "platform": "ios"}
	if _, failure := readDevDiagnostics(context.Background(), parent, app, "", args); failure == nil || failure.Code != "invalid_selection" {
		t.Fatal("platform mismatch was ignored", failure)
	}
	if _, failure := readDevDiagnostics(context.Background(), parent, t.TempDir(), "", map[string]any{"sessionId": capture.Session.SessionID}); failure == nil || failure.Code != "not_found" {
		t.Fatal("foreign app capture was readable", failure)
	}
	if err := capture.Finish("stopped", "fixture cleanup", true); err != nil {
		t.Fatal(err)
	}
	result := read("", map[string]any{"sessionId": capture.Session.SessionID})
	data, _ := json.Marshal(result)
	if result["logs"].(history.Logs).Historical != true || result["session"].(map[string]any)["cleanupConfirmed"] != true || !json.Valid(data) {
		t.Fatal("ended capture lost facts", result)
	}
}

func testHistoryCapture(t *testing.T, store *history.Store) *history.Capture {
	t.Helper()
	capture, err := store.Capture(history.Session{AppID: "fixture", OwnerID: "owner-generation", Platform: "web", TargetID: "web", Origin: "dev", Ownership: "owned"})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { capture.Finish("stopped", "Test resources released.", true) })
	return capture
}
func appendHistory(t *testing.T, capture *history.Capture, line string) {
	t.Helper()
	if err := capture.Append(history.Record{Stream: "stdout", Line: line}); err != nil {
		t.Fatal(err)
	}
}

func TestDevDiagnosticsRetainedNativeReportCompleteOriginalRead(t *testing.T) {
	if runtime.GOOS != "darwin" {
		t.Skip("Apple report discovery is Mac-only")
	}
	parent, app, home := t.TempDir(), t.TempDir(), t.TempDir()
	t.Setenv("HOME", home)
	store, err := history.OpenHistoryStore(parent, app)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	capture, err := store.Capture(history.Session{AppID: "fixture", OwnerID: "owner-generation", Platform: "macos", TargetID: "macos", Origin: "dev", Ownership: "owned", NativeIdentity: &history.DevNativeIdentity{AppID: "org.octane.test", Processes: []history.DevNativeProcess{{PID: 321, Executable: filepath.Join(app, "owned-host"), ObservedAt: time.Now().UTC().Format(time.RFC3339Nano)}}}})
	if err != nil {
		t.Fatal(err)
	}
	defer capture.Finish("stopped", "Test resources released.", true)
	run := capture.Session
	header, _ := json.Marshal(map[string]any{"bug_type": "309", "bundleID": run.NativeIdentity.AppID, "platform": 1, "timestamp": run.StartedAt})
	body, _ := json.Marshal(map[string]any{"pid": 321, "procLaunch": run.StartedAt, "captureTime": run.StartedAt, "platform": 1, "exception": map[string]any{"type": "EXC_CRASH", "signal": "SIGABRT"}})
	data := append(append(header, '\n'), body...)
	data = append(data, []byte(strings.Repeat("\n", devNativeReportBytes-len(data)))...)
	dir := filepath.Join(home, "Library", "Logs", "DiagnosticReports")
	if err := os.MkdirAll(dir, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "full.ips"), data, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "oversized.ips"), append(data, '\n'), 0600); err != nil {
		t.Fatal(err)
	}
	snapshot, err := history.DiscoverNativeReports(context.Background(), store, run)
	if err != nil || len(snapshot.Reports) != 1 || snapshot.Coverage.Status != "partial" || snapshot.Reports[0].Bytes != devNativeReportBytes {
		t.Fatal(snapshot, err)
	}
	value, failure := readDevDiagnostics(context.Background(), parent, app, "", map[string]any{"sessionId": run.SessionID, "reportId": snapshot.Reports[0].ID})
	if failure != nil {
		t.Fatal(failure)
	}
	encoded, err := json.Marshal(value)
	if err != nil || len(encoded) <= 4<<20 {
		t.Fatal("expected an original larger than the bounded RPC response after JSON encoding", err, len(encoded))
	}
	var decoded struct {
		Report struct {
			Content string `json:"content"`
		} `json:"report"`
	}
	if json.Unmarshal(encoded, &decoded) != nil || decoded.Report.Content != string(data) {
		t.Fatal("original was truncated")
	}
}

const devNativeReportBytes = 4 << 20

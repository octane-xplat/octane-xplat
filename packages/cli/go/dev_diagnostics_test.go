package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
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
	if _, failure := readDevDiagnostics(context.Background(), parent, app, "", map[string]any{"reportId": "native"}); failure == nil || failure.Code != "unavailable" {
		t.Fatal("unimplemented report must be explicit", failure)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, failure := readDevDiagnostics(ctx, parent, app, "", map[string]any{}); failure == nil || failure.Code != "cancelled" {
		t.Fatal("reader cancellation was lost", failure)
	}
}
func TestDevDiagnosticsEngineHistoryIdentityPaginationAndOfflineReads(t *testing.T) {
	parent, app := t.TempDir(), t.TempDir()
	store, err := openHistoryStore(parent, app)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	capture := testHistoryCapture(t, store)
	appendHistory(t, capture, "first stdout")
	if err := capture.Append(historyRecord{Stream: "stderr", Line: "fixture stderr"}); err != nil {
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
	args := map[string]any{"sessionId": capture.session.SessionID, "limit": float64(1), "stream": "stdout"}
	page := read("owner-generation", args)["logs"].(historyLogs)
	if len(page.Records) != 1 || page.Records[0].Line != "last stdout" || page.Historical {
		t.Fatal("initial filtered page must return its tail", page)
	}
	args["cursor"] = float64(0)
	page = read("owner-generation", args)["logs"].(historyLogs)
	if len(page.Records) != 1 || page.Records[0].Line != "first stdout" {
		t.Fatal("cursor pagination must return oldest matching record first", page)
	}
	args["cursor"] = float64(page.NextCursor)
	page = read("owner-generation", args)["logs"].(historyLogs)
	if page.Records[0].Line != "last stdout" {
		t.Fatal("stream cursor skipped a matching record", page)
	}
	args["cursor"] = float64(9000)
	if _, failure := readDevDiagnostics(context.Background(), parent, app, "", args); failure == nil || failure.Code != "invalid_selection" {
		t.Fatal("ahead cursor was not rejected", failure)
	}
	args = map[string]any{"sessionId": capture.session.SessionID, "platform": "ios"}
	if _, failure := readDevDiagnostics(context.Background(), parent, app, "", args); failure == nil || failure.Code != "invalid_selection" {
		t.Fatal("platform mismatch was ignored", failure)
	}
	if _, failure := readDevDiagnostics(context.Background(), parent, t.TempDir(), "", map[string]any{"sessionId": capture.session.SessionID}); failure == nil || failure.Code != "not_found" {
		t.Fatal("foreign app capture was readable", failure)
	}
	if err := capture.Finish("stopped", "fixture cleanup", true); err != nil {
		t.Fatal(err)
	}
	result := read("", map[string]any{"sessionId": capture.session.SessionID})
	data, _ := json.Marshal(result)
	if result["logs"].(historyLogs).Historical != true || result["session"].(map[string]any)["cleanupConfirmed"] != true || !json.Valid(data) {
		t.Fatal("ended capture lost facts", result)
	}
}

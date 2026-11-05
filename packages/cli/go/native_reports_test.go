package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func nativeReportFixture(t *testing.T) (*historyStore, historySession, string, string) {
	t.Helper()
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	run := capture.session
	run.Platform = "macos"
	run.NativeIdentity = &devNativeIdentity{AppID: "org.octane.test", Processes: []devNativeProcess{{PID: 321, ObservedAt: run.StartedAt}}}
	home := t.TempDir()
	directory := filepath.Join(home, "Library", "Logs", "DiagnosticReports")
	if err := os.MkdirAll(directory, 0700); err != nil {
		t.Fatal(err)
	}
	return store, run, home, directory
}
func nativeIPS(t *testing.T, run historySession, pid int, bundle string, overlay map[string]any) []byte {
	t.Helper()
	header, _ := json.Marshal(map[string]any{"bug_type": "309", "bundleID": bundle, "platform": 1, "timestamp": run.StartedAt})
	body := map[string]any{"pid": pid, "procLaunch": run.StartedAt, "captureTime": run.StartedAt, "platform": 1, "exception": map[string]any{"type": "EXC_CRASH", "signal": "SIGABRT"}}
	for k, v := range overlay {
		body[k] = v
	}
	b, _ := json.Marshal(body)
	return append(append(header, '\n'), b...)
}
func TestNativeAppleReportsAssociationAndRetainedOriginalIntegrity(t *testing.T) {
	store, run, home, dir := nativeReportFixture(t)
	good := nativeIPS(t, run, 321, run.NativeIdentity.AppID, nil)
	for name, data := range map[string][]byte{"owned": good, "foreign": nativeIPS(t, run, 321, "foreign.app", nil), "stale": nativeIPS(t, run, 321, run.NativeIdentity.AppID, map[string]any{"captureTime": "2000-01-01T00:00:00Z"})} {
		if err := os.WriteFile(filepath.Join(dir, name+".ips"), data, 0600); err != nil {
			t.Fatal(err)
		}
	}
	result, err := discoverNativeReportSnapshot(context.Background(), store, run, "darwin", home, time.Now())
	if err != nil || result.Coverage.Status != "available" || len(result.Reports) != 1 || result.Reports[0].Association != "confirmed" {
		t.Fatal(result, err)
	}
	root, err := nativeReportsRoot(store, run.SessionID, false)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	if err := os.Remove(filepath.Join(dir, "owned.ips")); err != nil {
		t.Fatal(err)
	}
	original, err := readRetainedNativeReport(root, result.Reports[0].ID)
	if err != nil || string(original.Data) != string(good) {
		t.Fatal("original did not survive source deletion", err)
	}
	later, err := discoverNativeReportSnapshot(context.Background(), store, run, "linux", home, time.Now())
	if err != nil || len(later.Reports) != 1 || later.Coverage.Status != "unavailable" {
		t.Fatal("retained original must remain readable on another host", later, err)
	}
	if _, err := readRetainedNativeReport(root, "../session"); err == nil {
		t.Fatal("path traversal accepted")
	}
	original.Data = []byte("tampered")
	data, _ := json.Marshal(original)
	if err := os.WriteFile(filepath.Join(root.Name(), original.ID+".json"), data, 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := readRetainedNativeReport(root, original.ID); err == nil {
		t.Fatal("tampered content passed integrity check")
	}
}
func TestNativeAppleReportCandidatesDeviceScopeAndPartialCoverage(t *testing.T) {
	store, run, home, dir := nativeReportFixture(t)
	run.Platform = "ios"
	run.TargetID = "12345678-1234-1234-1234-123456789abc"
	for name, changes := range map[string]map[string]any{"candidate": {"platform": 7, "pid": 999}, "other-device": {"platform": 7, "procPath": "/Devices/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/App"}, "wrong-platform": {"platform": 1}} {
		data := nativeIPS(t, run, 321, run.NativeIdentity.AppID, changes)
		if err := os.WriteFile(filepath.Join(dir, name+".ips"), data, 0600); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(dir, "malformed.ips"), []byte("invalid JSON"), 0600); err != nil {
		t.Fatal(err)
	}
	result, err := discoverNativeReportSnapshot(context.Background(), store, run, "darwin", home, time.Now())
	if err != nil || result.Coverage.Status != "partial" || len(result.Reports) != 1 || result.Reports[0].Association != "candidate" {
		t.Fatal(result, err)
	}
	run.TargetID = "physical-device"
	result, err = discoverNativeReportSnapshot(context.Background(), store, run, "darwin", home, time.Now())
	if err != nil || result.Coverage.Status != "unsupported" {
		t.Fatal(result, err)
	}
}
func TestNativeAppleReportRetentionBoundsConcurrentReadersAndNoMissingWrites(t *testing.T) {
	store, run, home, dir := nativeReportFixture(t)
	missing := run
	missing.NativeIdentity = nil
	result, err := discoverNativeReportSnapshot(context.Background(), store, missing, "darwin", home, time.Now())
	if err != nil || result.Coverage.Status != "unavailable" {
		t.Fatal(result, err)
	}
	if _, err := nativeReportsRoot(store, run.SessionID, false); !os.IsNotExist(err) {
		t.Fatal("empty discovery created a report directory", err)
	}
	for i := 0; i < 12; i++ {
		if err := os.WriteFile(filepath.Join(dir, fmt.Sprintf("%d.ips", i)), nativeIPS(t, run, i, run.NativeIdentity.AppID, nil), 0600); err != nil {
			t.Fatal(err)
		}
	}
	var wg sync.WaitGroup
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			result, err := discoverNativeReportSnapshot(context.Background(), store, run, "darwin", home, time.Now())
			if err != nil || len(result.Reports) != 10 || result.Coverage.Status != "partial" {
				t.Error(result, err)
			}
		}()
	}
	wg.Wait()
	root, err := nativeReportsRoot(store, run.SessionID, false)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	reports, err := listRetainedNativeReports(root)
	if err != nil || len(reports) != 10 {
		t.Fatal(reports, err)
	}
}
func TestNativeAppleReportTimeOffsetsAndIdentityWithoutBundle(t *testing.T) {
	store, run, _, _ := nativeReportFixture(t)
	_ = store
	moment, valid := parseNativeReportTime("2026-11-05 09:12:13.123456 -0500")
	if !valid || moment.Format("2006-01-02T15:04:05.000Z") != "2026-11-05T14:12:13.123Z" {
		t.Fatal(moment, valid)
	}
	for _, bad := range []string{"2026-99-99T00:00:00Z", "2026-11-05T09:12:13", "invalid"} {
		if _, ok := parseNativeReportTime(bad); ok {
			t.Fatal("invalid timestamp admitted", bad)
		}
	}
	report, err := appleNativeReport(run, nativeIPS(t, run, 321, "", nil), time.Now())
	if err != nil || report == nil || report.Association != "confirmed" {
		t.Fatal(report, err)
	}
	report, err = appleNativeReport(run, nativeIPS(t, run, 999, "", nil), time.Now())
	if err != nil || report != nil {
		t.Fatal("identity-free foreign process admitted", report, err)
	}
	if !strings.Contains(nativeReportText("😀abc", 2), "😀") || nativeReportText("😀abc", 1) != "" {
		t.Fatal("report summary split UTF-16 boundary")
	}
}

// External reference corpus is generated by the retained TypeScript engine.
// This seam is test-only and never becomes a production command or fallback.
func TestNativeAppleReportsReferenceCorpus(t *testing.T) {
	path := os.Getenv("XPLAT_GO_REPORT_CORPUS")
	if path == "" {
		t.Skip("reference corpus runner")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var cases []struct {
		Name     string         `json:"name"`
		Run      historySession `json:"run"`
		Content  string         `json:"content"`
		Now      string         `json:"now"`
		Expected *nativeReport  `json:"expected"`
	}
	if err := json.Unmarshal(data, &cases); err != nil {
		t.Fatal(err)
	}
	for _, entry := range cases {
		t.Run(entry.Name, func(t *testing.T) {
			now, valid := parseNativeReportTime(entry.Now)
			if !valid {
				t.Fatal("invalid fixture time")
			}
			actual, err := appleNativeReport(entry.Run, []byte(entry.Content), now)
			if err != nil {
				t.Fatal(err)
			}
			if entry.Expected == nil {
				if actual != nil {
					t.Fatal("native admitted a report rejected by Node", actual.nativeReport)
				}
				return
			}
			if actual == nil {
				t.Fatal("native silently omitted a Node report")
			}
			a, _ := json.Marshal(actual.nativeReport)
			b, _ := json.Marshal(entry.Expected)
			if string(a) != string(b) {
				t.Fatalf("silent report semantics difference\nGo: %s\nNode: %s", a, b)
			}
		})
	}
}

func TestNativeAppleReportRawLimitAndCompleteOriginalRead(t *testing.T) {
	store, run, home, dir := nativeReportFixture(t)
	run.NativeIdentity.Processes[0].Executable = filepath.Join(store.project, "owned-host")
	sessionRoot, err := store.sessionRoot(run.SessionID)
	if err != nil {
		t.Fatal(err)
	}
	if err := historyMetadata(sessionRoot, run); err != nil {
		t.Fatal(err)
	}
	sessionRoot.Close()
	data := nativeIPS(t, run, 321, run.NativeIdentity.AppID, nil)
	data = append(data, []byte(strings.Repeat("\n", nativeReportBytes-len(data)))...)
	if err := os.WriteFile(filepath.Join(dir, "full.ips"), data, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "oversized.ips"), append(data, '\n'), 0600); err != nil {
		t.Fatal(err)
	}
	snapshot, err := discoverNativeReportSnapshot(context.Background(), store, run, "darwin", home, time.Now())
	if err != nil || len(snapshot.Reports) != 1 || snapshot.Coverage.Status != "partial" || snapshot.Reports[0].Bytes != nativeReportBytes {
		t.Fatal(snapshot, err)
	}
	value, failure := readDevDiagnostics(context.Background(), filepath.Dir(filepath.Dir(store.path)), store.project, "", map[string]any{"sessionId": run.SessionID, "reportId": snapshot.Reports[0].ID})
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

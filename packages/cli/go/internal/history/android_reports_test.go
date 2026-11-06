package history

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"
)

func androidReportFixture() Session {
	now := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	return Session{Platform: "android", TargetID: "emulator-5556", StartedAt: now, NativeIdentity: &DevNativeIdentity{AppID: "org.octane.fixture", Processes: []DevNativeProcess{}}}
}
func androidExitFixture(run Session) string {
	return "ACTIVITY MANAGER PROCESS EXIT INFO (dumpsys activity exit-info)\n  package: org.octane.fixture\n        ApplicationExitInfo #0:\n          timestamp=" + strings.TrimSuffix(strings.Replace(run.StartedAt, "T", " ", 1), "Z") + " pid=42 realUid=123\n          process=org.octane.fixture reason=5 (CRASH NATIVE) subreason=0 status=11\n          importance=100 trace=/data/tombstones/private\n"
}
func TestAndroidNativeReportScopeOriginalAndCommandContract(t *testing.T) {
	run := androidReportFixture()
	output := androidExitFixture(run)
	var calls [][]string
	reports, coverage, err := androidNativeReportsWith(context.Background(), run, time.Now(), func(_ context.Context, args []string) (string, error) {
		calls = append(calls, args)
		if len(calls) == 1 {
			return "+0000\n", nil
		}
		return output + strings.Replace(output[strings.Index(output, "        ApplicationExitInfo"):], run.NativeIdentity.AppID, "org.foreign.app", 1), nil
	})
	if err != nil || coverage.Status != "partial" || len(reports) != 1 || reports[0].Association != "candidate" || reports[0].Kind != "native-crash" || !strings.Contains(string(reports[0].Data), "trace=/data/tombstones/private") {
		t.Fatal(reports, coverage, err)
	}
	if !reflect.DeepEqual(calls, [][]string{{"-s", run.TargetID, "shell", "date", "+%z"}, {"-s", run.TargetID, "shell", "dumpsys", "activity", "exit-info", run.NativeIdentity.AppID}}) {
		t.Fatal("ADB scope changed", calls)
	}
	for _, newline := range []string{"\n", "\r\n"} {
		source := strings.ReplaceAll(output, "\n", newline)
		reports, err := parseAndroidExitHistory(run, source, "+0000", time.Now())
		if err != nil || len(reports) != 1 || string(reports[0].Data) != source[strings.Index(source, "        ApplicationExitInfo"):] {
			t.Fatal("original block bytes changed", err)
		}
	}
}
func TestAndroidNativeReportsInvalidSelectionCancellationAndUnknownCleanup(t *testing.T) {
	run := androidReportFixture()
	called := false
	read := func(context.Context, []string) (string, error) { called = true; return "", nil }
	bad := run
	bad.TargetID = "serial;not-a-command"
	_, coverage, err := androidNativeReportsWith(context.Background(), bad, time.Now(), read)
	if err != nil || called || coverage.Status != "unavailable" {
		t.Fatal("unsafe selector reached adb", coverage, err)
	}
	_, coverage, err = androidNativeReportsWith(context.WithValue(context.Background(), NativeReportSourceBlockedKey{}, true), run, time.Now(), read)
	if err != nil || called || coverage.Status != "unavailable" {
		t.Fatal("unknown cleanup admitted another report command", coverage, err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, _, err = androidNativeReportsWith(ctx, run, time.Now(), read)
	if !errors.Is(err, context.Canceled) || called {
		t.Fatal("cancelled read reached adb", err)
	}
	_, _, err = androidNativeReportsWith(context.Background(), run, time.Now(), func(context.Context, []string) (string, error) {
		return "", &proc.CleanupError{Err: errors.New("fixture cleanup unknown")}
	})
	if !cli.RequiresFailureEvidence(err) {
		t.Fatal("unknown cleanup became an ordinary coverage gap", err)
	}
	for _, output := range []string{"unrecognized output", strings.Replace(androidExitFixture(run), "reason=5 (CRASH NATIVE)", "unrecognized-reason", 1), "ACTIVITY MANAGER PROCESS EXIT INFO\nApplicationExitInfo invalid"} {
		if _, err := parseAndroidExitHistory(run, output, "+0000", time.Now()); err == nil {
			t.Fatal("unknown exit format silently accepted")
		}
	}
}
func TestNativeScriptIdentitySelectedDeviceAndNoProcessAuthority(t *testing.T) {
	for _, platform := range []string{"android", "ios"} {
		t.Run(platform, func(t *testing.T) {
			store := testHistoryStore(t)
			capture, err := store.Capture(Session{AppID: "fixture", OwnerID: "owner", Platform: platform, TargetID: "device-123", Origin: "dev", Ownership: "owned"})
			if err != nil {
				t.Fatal(err)
			}
			defer capture.Finish("stopped", "fixture", true)
			for _, value := range []struct {
				line      string
				truncated bool
			}{{"Successfully synced application org.other.app on device foreign-456.", false},
				{"[browser:warn] Successfully synced application org.other.app on device device-123.", false}, {"Successfully synced application org.other.app on device device-123.", true}} {
				if err := capture.ObserveNativeScriptIdentity(value.line, value.truncated); err != nil {
					t.Fatal(err)
				}
			}
			read, err := store.Read(capture.Session.SessionID)
			if err != nil || read.NativeIdentity != nil {
				t.Fatal("foreign/truncated identity accepted", read, err)
			}
			if err := capture.ObserveNativeScriptIdentity("\x1b[32mSuccessfully synced application org.octane.fixture on device device-123.\x1b[0m", false); err != nil {
				t.Fatal(err)
			}
			read, err = store.Read(capture.Session.SessionID)
			if err != nil || read.NativeIdentity == nil || read.NativeIdentity.AppID != "org.octane.fixture" || len(read.NativeIdentity.Processes) != 0 || read.State != "starting" {
				t.Fatal("sync invented readiness or PID ownership", read, err)
			}
			if err := capture.ObserveNativeScriptIdentity("Successfully synced application org.changed.app on device device-123.", false); err == nil {
				t.Fatal("identity changed inside one capture")
			}
			if err := capture.ObserveNativeScriptIdentity("Successfully synced application org.octane.fixture on device device-123.", false); err != nil {
				t.Fatal(err)
			}
		})
	}
}
func TestAndroidRetainedReportOriginal(t *testing.T) {
	store := testHistoryStore(t)
	capture, err := store.Capture(Session{AppID: "fixture", OwnerID: "owner", Platform: "android", TargetID: "emulator-5556", Origin: "dev", Ownership: "owned"})
	if err != nil {
		t.Fatal(err)
	}
	defer capture.Finish("stopped", "fixture", true)
	run := androidReportFixture()
	data := androidExitFixture(run)
	reports, err := parseAndroidExitHistory(run, data, "+0000", time.Now())
	if err != nil {
		t.Fatal(err)
	}
	root, err := NativeReportsRoot(store, capture.Session.SessionID, true)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	if err := publishNativeReport(root, reports[0]); err != nil {
		t.Fatal(err)
	}
	saved, err := ReadRetainedNativeReport(root, reports[0].ID)
	if err != nil || string(saved.Data) != string(reports[0].Data) {
		t.Fatal(saved.NativeReport, err)
	}
	// Malformed envelopes cannot promote package-level candidates to confirmed.
	saved.Association = "confirmed"
	if err := publishNativeReport(root, saved); err != nil {
		t.Fatal(err)
	}
	if _, err := ReadRetainedNativeReport(root, saved.ID); err == nil {
		t.Fatal("Android record claimed confirmed process ownership")
	}
	_ = os.Remove(filepath.Join(root.Name(), saved.ID+".json"))
}

// Explicit device qualification only; ordinary native units never start a device.
func TestAndroidNativeReportsReal(t *testing.T) {
	path := os.Getenv("XPLAT_GO_ANDROID_REPORT_FIXTURE")
	if path == "" {
		t.Skip("owned Android fixture runner")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var fixture struct{ Device, AppID, StartedAt, EndedAt, Output, Binary string }
	if json.Unmarshal(data, &fixture) != nil {
		t.Fatal("invalid device fixture")
	}
	t.Setenv("HOME", t.TempDir())
	parent, err := DiagnosticsHistoryParent()
	if err != nil {
		t.Fatal(err)
	}
	project := t.TempDir()
	if err := os.WriteFile(filepath.Join(project, "package.json"), []byte(`{"name":"owned-android-report","private":true,"packageManager":"bun@1.4.4","xplat":{"targets":{"android":{}}}}`), 0600); err != nil {
		t.Fatal(err)
	}
	store, err := OpenHistoryStore(parent, project)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	capture, err := store.Capture(Session{AppID: "android-report-fixture", OwnerID: "fixture", Platform: "android", TargetID: fixture.Device, Origin: "dev", Ownership: "owned"})
	if err != nil {
		t.Fatal(err)
	}
	defer capture.Finish("stopped", "owned fixture", true)
	capture.Lock()
	capture.Session.StartedAt = fixture.StartedAt
	capture.Unlock()
	// Device and package come from this runner's own installation. The sync line
	// exercises ingestion, but is not claimed as a real NativeScript deployment.
	if err := capture.ObserveNativeScriptIdentity("Successfully synced application "+fixture.AppID+" on device "+fixture.Device+".", false); err != nil {
		t.Fatal(err)
	}
	run, err := store.Read(capture.Session.SessionID)
	if err != nil {
		t.Fatal(err)
	}
	run.StartedAt = fixture.StartedAt
	run.EndedAt = &fixture.EndedAt
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	snapshot, err := DiscoverNativeReports(ctx, store, run)
	if err != nil || snapshot.Coverage.Status != "partial" || len(snapshot.Reports) == 0 {
		t.Fatal("actual Android exit history unavailable", snapshot, err)
	}
	root, err := NativeReportsRoot(store, run.SessionID, false)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	confirmed := false
	for _, meta := range snapshot.Reports {
		if meta.Source != "android-exit-info" || meta.Association != "candidate" {
			t.Fatal("unexpected Android evidence", meta)
		}
		original, err := ReadRetainedNativeReport(root, meta.ID)
		if err != nil {
			t.Fatal(err)
		}
		if strings.Contains(string(original.Data), "process="+fixture.AppID) && meta.Kind == "crash" {
			confirmed = true
		}
	}
	if !confirmed {
		t.Fatal("owned Java crash was not found in real exit history", snapshot)
	}
	if err := capture.Finish("stopped", "owned diagnostic fixture", true); err != nil {
		t.Fatal(err)
	}
	if fixture.Binary == "" {
		t.Fatal("public CLI path missing")
	}
	for _, args := range [][]string{{}, {"--report", snapshot.Reports[0].ID}} {
		argv := append([]string{fixture.Binary, "diagnostics", "--project", project, "--session", run.SessionID, "--json"}, args...)
		process, err := proc.RunProcess(ctx, argv, project, os.Environ())
		if err != nil || process.ExitCode != 0 || process.Truncated {
			t.Fatal("public native diagnostics failed", err, process.ExitCode, process.Stderr)
		}
		var response struct {
			OK   bool `json:"ok"`
			Data struct {
				Reports []NativeReport `json:"reports"`
				Report  struct {
					Content string `json:"content"`
				} `json:"report"`
			} `json:"data"`
		}
		if json.Unmarshal([]byte(process.Stdout), &response) != nil || !response.OK {
			t.Fatal("public native diagnostic contract failed")
		}
		if len(args) == 0 && len(response.Data.Reports) == 0 {
			t.Fatal("public native CLI omitted the real record")
		}
		if len(args) > 0 && fmt.Sprintf("report_%x", sha256.Sum256([]byte(response.Data.Report.Content))) != snapshot.Reports[0].ID {
			t.Fatal("public native original changed")
		}
	}
	output, _ := json.MarshalIndent(map[string]any{"device": fixture.Device, "appId": fixture.AppID, "reports": snapshot.Reports, "coverage": snapshot.Coverage, "source": "actual SDK-built Java activity and adb am crash; constructed sync line for identity ingestion, not NativeScript deployment", "publicCliVerified": true, "passed": true}, "", "  ")
	if err := os.WriteFile(fixture.Output, output, 0600); err != nil {
		t.Fatal(err)
	}
}

func TestAndroidNativeReportReferenceCorpus(t *testing.T) {
	path := os.Getenv("XPLAT_GO_ANDROID_REPORT_CORPUS")
	if path == "" {
		t.Skip("Node reference corpus runner")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var cases []struct {
		Name, Output, Zone, Now string
		Run                     Session
		Expected                []NativeReport
		Status                  string
	}
	if json.Unmarshal(data, &cases) != nil {
		t.Fatal("invalid Android corpus")
	}
	for _, entry := range cases {
		t.Run(entry.Name, func(t *testing.T) {
			now, valid := parseNativeReportTime(entry.Now)
			if !valid {
				t.Fatal("invalid fixture time")
			}
			calls := 0
			reports, coverage, err := androidNativeReportsWith(context.Background(), entry.Run, now, func(context.Context, []string) (string, error) {
				calls++
				if calls == 1 {
					return entry.Zone, nil
				}
				return entry.Output, nil
			})
			if err != nil {
				t.Fatal(err)
			}
			actual := []NativeReport{}
			for _, report := range reports {
				actual = append(actual, report.NativeReport)
			}
			a, _ := json.Marshal(actual)
			b, _ := json.Marshal(entry.Expected)
			if string(a) != string(b) || coverage.Status != entry.Status {
				t.Fatalf("Android report semantic difference\nGo: %s (%s)\nNode: %s (%s)", a, coverage.Status, b, entry.Status)
			}
		})
	}
}

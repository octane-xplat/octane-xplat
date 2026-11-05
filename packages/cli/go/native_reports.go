package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

const nativeReportBytes = 4 << 20
const nativeReportTotal = 16 << 20
const nativeReportCount = 10

// Base64 preserves original bytes in one atomically published JSON envelope.
const nativeReportEnvelopeBytes = (nativeReportBytes+2)/3*4 + 16<<10

var nativeReportID = regexp.MustCompile(`^report_[a-f0-9]{64}$`)
var simulatorReportID = regexp.MustCompile(`^[A-Fa-f0-9-]{36}$`)
var simulatorReportPath = regexp.MustCompile(`/Devices/[A-Fa-f0-9-]{36}/`)

type nativeReport struct {
	ID                string `json:"id"`
	Kind              string `json:"kind"`
	Source            string `json:"source"`
	Timestamp         string `json:"timestamp"`
	Summary           string `json:"summary"`
	Association       string `json:"association"`
	AssociationReason string `json:"associationReason"`
	Bytes             int    `json:"bytes"`
}
type retainedNativeReport struct {
	Version int `json:"version"`
	nativeReport
	Data []byte `json:"data"`
}
type nativeReportCoverage struct {
	Status string `json:"status"`
	Detail string `json:"detail"`
}
type nativeReportSnapshot struct {
	Reports  []nativeReport       `json:"reports"`
	Coverage nativeReportCoverage `json:"coverage"`
}

func parseNativeReportTime(value string) (time.Time, bool) {
	for _, layout := range []string{time.RFC3339Nano, "2006-01-02 15:04:05.999999999 -0700", "2006-01-02 15:04:05.999999999 -07:00", "2006-01-02T15:04:05.999999999-0700"} {
		if parsed, err := time.Parse(layout, value); err == nil {
			return parsed.UTC().Truncate(time.Millisecond), true
		}
	}
	return time.Time{}, false
}
func nativeReportWindow(run historySession, value, now time.Time) bool {
	start, ok := parseNativeReportTime(run.StartedAt)
	if !ok {
		return false
	}
	end := now
	if run.EndedAt != nil {
		var valid bool
		end, valid = parseNativeReportTime(*run.EndedAt)
		if !valid {
			return false
		}
	}
	return !value.Before(start.Add(-5*time.Second)) && !value.After(end.Add(5*time.Second))
}
func nativeReportText(value string, maxUnits int) string {
	units := 0
	for offset, r := range value {
		width := 1
		if r > 0xffff {
			width = 2
		}
		if units+width > maxUnits {
			return value[:offset]
		}
		units += width
	}
	return value
}
func appleNativeReport(run historySession, data []byte, now time.Time) (*retainedNativeReport, error) {
	split := bytes.IndexByte(data, '\n')
	if split < 0 || !utf8.Valid(data) {
		return nil, errors.New("invalid Apple report encoding")
	}
	var header struct {
		BugType   json.RawMessage `json:"bug_type"`
		Platform  json.RawMessage `json:"platform"`
		Timestamp string          `json:"timestamp"`
		BundleID  *string         `json:"bundleID"`
	}
	if err := json.Unmarshal(data[:split], &header); err != nil {
		return nil, err
	}
	var bug any
	_ = json.Unmarshal(header.BugType, &bug)
	if bug != float64(309) && bug != "309" {
		return nil, nil
	}
	var body struct {
		Platform    json.RawMessage `json:"platform"`
		CaptureTime *string         `json:"captureTime"`
		ProcLaunch  string          `json:"procLaunch"`
		ProcPath    string          `json:"procPath"`
		PID         json.RawMessage `json:"pid"`
		BundleInfo  struct {
			ID string `json:"CFBundleIdentifier"`
		} `json:"bundleInfo"`
		Exception struct {
			Type   string `json:"type"`
			Signal string `json:"signal"`
		} `json:"exception"`
		Termination struct {
			Namespace string          `json:"namespace"`
			Code      json.RawMessage `json:"code"`
		} `json:"termination"`
	}
	if err := json.Unmarshal(data[split+1:], &body); err != nil {
		return nil, err
	}
	platformRaw := header.Platform
	if len(body.Platform) > 0 && string(body.Platform) != "null" {
		platformRaw = body.Platform
	}
	var platformValue any
	_ = json.Unmarshal(platformRaw, &platformValue)
	platform, validPlatform := platformValue.(float64)
	if text, ok := platformValue.(string); ok {
		var err error
		platform, err = strconv.ParseFloat(strings.TrimSpace(text), 64)
		validPlatform = err == nil
	}
	if !validPlatform || run.Platform == "macos" && platform != 1 || run.Platform == "ios" && platform != 7 {
		return nil, nil
	}
	var pidValue any
	_ = json.Unmarshal(body.PID, &pidValue)
	pid, numericPID := pidValue.(float64)
	timestamp := header.Timestamp
	if body.CaptureTime != nil {
		timestamp = *body.CaptureTime
	}
	captured, ok := parseNativeReportTime(timestamp)
	if !ok || !nativeReportWindow(run, captured, now) {
		return nil, nil
	}
	sameDevice := run.Platform != "ios" || strings.Contains(body.ProcPath, "/Devices/"+run.TargetID+"/")
	if !sameDevice && simulatorReportPath.MatchString(body.ProcPath) {
		return nil, nil
	}
	bundle := body.BundleInfo.ID
	if header.BundleID != nil {
		bundle = *header.BundleID
	}
	if run.NativeIdentity == nil || run.NativeIdentity.AppID == "" || bundle != "" && bundle != run.NativeIdentity.AppID {
		return nil, nil
	}
	launched, validLaunch := parseNativeReportTime(body.ProcLaunch)
	confirmed := false
	if sameDevice && validLaunch && nativeReportWindow(run, launched, now) {
		for _, process := range run.NativeIdentity.Processes {
			observed, valid := parseNativeReportTime(process.ObservedAt)
			if valid && numericPID && pid > 0 && pid <= 9007199254740991 && float64(process.PID) == pid && observed.Sub(launched).Abs() <= 5*time.Second {
				confirmed = true
				break
			}
		}
	}
	if !confirmed && bundle != run.NativeIdentity.AppID {
		return nil, nil
	}
	summary := body.Exception.Type
	if summary == "" {
		summary = "Native crash"
	}
	if body.Exception.Signal != "" {
		summary += " (" + body.Exception.Signal + ")"
	}
	if body.Termination.Namespace != "" {
		summary += "; " + body.Termination.Namespace + ": " + string(body.Termination.Code)
	}
	association, reason := "candidate", "Bundle id and report time match; exact process ownership is not established."
	if confirmed {
		association = "confirmed"
		reason = "Observed host PID, launch time and report time match this run; bundle id also matches when present."
	}
	return &retainedNativeReport{Version: 1, nativeReport: nativeReport{ID: fmt.Sprintf("report_%x", sha256.Sum256(data)), Kind: "native-crash", Source: "apple-ips", Timestamp: captured.Format("2006-01-02T15:04:05.000Z"), Summary: strings.Clone(nativeReportText(summary, 512)), Association: association, AssociationReason: reason, Bytes: len(data)}, Data: data}, nil
}

func scanAppleNativeReports(ctx context.Context, run historySession, directory string, now time.Time) ([]retainedNativeReport, nativeReportCoverage) {
	coverage := nativeReportCoverage{Status: "none-found", Detail: "Local Apple .ips crash reports only; reports can arrive after process exit. Other directories and hang reports are not scanned."}
	found := []retainedNativeReport{}
	root, err := os.OpenRoot(directory)
	if err != nil {
		coverage.Status = "unavailable"
		coverage.Detail = "Apple report directory cannot be read."
		return found, coverage
	}
	defer root.Close()
	dir, err := root.Open(".")
	if err != nil {
		coverage.Status = "unavailable"
		return found, coverage
	}
	defer dir.Close()
	entries, err := dir.ReadDir(10001)
	if err != nil && err != io.EOF {
		coverage.Status = "unavailable"
		return found, coverage
	}
	partial := len(entries) > 10000
	if partial {
		entries = entries[:10000]
	}
	type candidate struct {
		name     string
		modified time.Time
	}
	candidates := []candidate{}
	start, valid := parseNativeReportTime(run.StartedAt)
	if !valid {
		coverage.Status = "unavailable"
		coverage.Detail = "Recorded run start time is invalid."
		return found, coverage
	}
	for _, entry := range entries {
		if !strings.HasSuffix(entry.Name(), ".ips") {
			continue
		}
		info, err := root.Lstat(entry.Name())
		if err != nil {
			partial = true
			continue
		}
		if info.ModTime().Before(start.Add(-5 * time.Second)) {
			continue
		}
		if !info.Mode().IsRegular() {
			partial = true
			continue
		}
		candidates = append(candidates, candidate{entry.Name(), info.ModTime()})
	}
	slices.SortFunc(candidates, func(a, b candidate) int {
		if n := b.modified.Compare(a.modified); n != 0 {
			return n
		}
		return strings.Compare(a.name, b.name)
	})
	if len(candidates) > 100 {
		partial = true
		candidates = candidates[:100]
	}
	scanned := 0
	for _, candidate := range candidates {
		if ctx.Err() != nil {
			partial = true
			break
		}
		limit := min(nativeReportBytes, 64<<20-scanned)
		if limit <= 0 {
			partial = true
			break
		}
		data, err := historyFile(root, candidate.name, int64(limit))
		if err != nil {
			partial = true
			continue
		}
		scanned += len(data)
		report, err := appleNativeReport(run, data, now)
		if err != nil {
			partial = true
			continue
		}
		if report != nil {
			found = append(found, *report)
		}
	}
	if partial {
		coverage.Status = "partial"
	} else if len(found) > 0 {
		coverage.Status = "available"
	}
	return found, coverage
}

func nativeReportsRoot(store *historyStore, session string, create bool) (*os.Root, error) {
	root, err := store.sessionRoot(session)
	if err != nil {
		return nil, err
	}
	defer root.Close()
	if create {
		if err := root.Mkdir("reports", 0700); err != nil && !os.IsExist(err) {
			return nil, err
		}
	}
	info, err := root.Lstat("reports")
	if err != nil {
		return nil, err
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return nil, errors.New("invalid retained report directory")
	}
	return root.OpenRoot("reports")
}
func readRetainedNativeReport(root *os.Root, id string) (retainedNativeReport, error) {
	var report retainedNativeReport
	if !nativeReportID.MatchString(id) {
		return report, errors.New("invalid native report id")
	}
	data, err := historyFile(root, id+".json", nativeReportEnvelopeBytes)
	if err != nil {
		return report, err
	}
	if json.Unmarshal(data, &report) != nil || report.Version != 1 || report.ID != id || report.Bytes != len(report.Data) || report.Bytes > nativeReportBytes || !utf8.Valid(report.Data) || fmt.Sprintf("report_%x", sha256.Sum256(report.Data)) != id || !slices.Contains([]string{"confirmed", "candidate"}, report.Association) || report.Kind != "native-crash" || report.Source != "apple-ips" {
		return report, errors.New("retained report failed integrity validation")
	}
	if _, valid := parseNativeReportTime(report.Timestamp); !valid {
		return report, errors.New("retained report timestamp is invalid")
	}
	return report, nil
}
func listRetainedNativeReports(root *os.Root) ([]nativeReport, error) {
	dir, err := root.Open(".")
	if err != nil {
		return nil, err
	}
	defer dir.Close()
	entries, err := dir.ReadDir(1001)
	if err != nil && err != io.EOF {
		return nil, err
	}
	if len(entries) > 1000 {
		return nil, errors.New("report inventory exceeds bound")
	}
	reports := []nativeReport{}
	total := 0
	for _, entry := range entries {
		id, ok := strings.CutSuffix(entry.Name(), ".json")
		if !ok || !nativeReportID.MatchString(id) {
			continue
		}
		report, err := readRetainedNativeReport(root, id)
		if err != nil {
			return nil, err
		}
		reports = append(reports, report.nativeReport)
		total += report.Bytes
		if len(reports) > nativeReportCount || total > nativeReportTotal {
			return nil, errors.New("retained report limits exceeded")
		}
	}
	slices.SortFunc(reports, func(a, b nativeReport) int {
		if n := strings.Compare(b.Timestamp, a.Timestamp); n != 0 {
			return n
		}
		return strings.Compare(a.ID, b.ID)
	})
	return reports, nil
}
func publishNativeReport(root *os.Root, report retainedNativeReport) error {
	data, err := json.Marshal(report)
	if err != nil {
		return err
	}
	if len(data) > nativeReportEnvelopeBytes {
		return errors.New("report envelope exceeds bound")
	}
	name := "report-" + identity() + ".tmp"
	file, err := root.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	defer root.Remove(name)
	n, writeErr := file.Write(data)
	closeErr := file.Close()
	if writeErr != nil {
		return writeErr
	}
	if closeErr != nil {
		return closeErr
	}
	if n != len(data) {
		return io.ErrShortWrite
	}
	return root.Rename(name, report.ID+".json")
}
func discoverNativeReportSnapshot(ctx context.Context, store *historyStore, run historySession, host, home string, now time.Time) (nativeReportSnapshot, error) {
	result := nativeReportSnapshot{Reports: []nativeReport{}, Coverage: nativeReportCoverage{Status: "unsupported", Detail: "Local Apple .ips parsing requires a recorded native identity (currently macOS captures). Android exit history remains pending."}}
	root, err := nativeReportsRoot(store, run.SessionID, false)
	if err == nil {
		result.Reports, err = listRetainedNativeReports(root)
		root.Close()
	}
	if err != nil && !os.IsNotExist(err) {
		return result, err
	}
	found := []retainedNativeReport{}
	if run.Platform == "macos" || run.Platform == "ios" {
		switch {
		case run.NativeIdentity == nil || run.NativeIdentity.AppID == "":
			result.Coverage = nativeReportCoverage{Status: "unavailable", Detail: "This capture has no recorded native app identity; engine spawn alone is insufficient."}
		case host != "darwin":
			result.Coverage = nativeReportCoverage{Status: "unavailable", Detail: "Apple report discovery requires the Mac that ran the app; retained originals remain readable."}
		case run.Platform == "ios" && !simulatorReportID.MatchString(run.TargetID):
			result.Coverage = nativeReportCoverage{Status: "unsupported", Detail: "Physical iOS report extraction is not implemented; this source supports simulators only."}
		default:
			found, result.Coverage = scanAppleNativeReports(ctx, run, filepath.Join(home, "Library", "Logs", "DiagnosticReports"), now)
		}
	}
	if ctx.Err() != nil {
		return result, ctx.Err()
	}
	if len(found) == 0 {
		if len(result.Reports) > 0 && result.Coverage.Status == "none-found" {
			result.Coverage.Status = "available"
		}
		return result, nil
	}
	root, err = nativeReportsRoot(store, run.SessionID, true)
	if err != nil {
		return result, err
	}
	defer root.Close()
	lockCtx, cancel := context.WithTimeout(ctx, time.Second)
	defer cancel()
	release, err := lockCache(lockCtx, root, "write.lock")
	if err != nil {
		return result, err
	}
	defer release()
	result.Reports, err = listRetainedNativeReports(root)
	if err != nil {
		return result, err
	}
	slices.SortFunc(found, func(a, b retainedNativeReport) int { return strings.Compare(b.Timestamp, a.Timestamp) })
	total := 0
	known := map[string]bool{}
	for _, report := range result.Reports {
		total += report.Bytes
		known[report.ID] = true
	}
	for _, report := range found {
		if ctx.Err() != nil {
			return result, ctx.Err()
		}
		if known[report.ID] {
			continue
		}
		if len(result.Reports) >= nativeReportCount || total+report.Bytes > nativeReportTotal {
			result.Coverage.Status = "partial"
			result.Coverage.Detail += " Retention limit reached: 10 originals, 4 MiB each, 16 MiB raw total."
			break
		}
		if err := publishNativeReport(root, report); err != nil {
			return result, err
		}
		result.Reports = append(result.Reports, report.nativeReport)
		total += report.Bytes
		known[report.ID] = true
	}
	slices.SortFunc(result.Reports, func(a, b nativeReport) int { return strings.Compare(b.Timestamp, a.Timestamp) })
	return result, nil
}
func discoverNativeReports(ctx context.Context, store *historyStore, run historySession) (nativeReportSnapshot, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nativeReportSnapshot{}, err
	}
	return discoverNativeReportSnapshot(ctx, store, run, runtime.GOOS, home, time.Now())
}

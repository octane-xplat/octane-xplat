package history

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

var androidExitStart = regexp.MustCompile(`^[ \t]*ApplicationExitInfo[^\r\n]*:$`)
var androidExitBoundary = regexp.MustCompile(`^[ \t]*(?:ApplicationExitInfo|Historical Process Exit|package:)`)
var androidExitProcess = regexp.MustCompile(`\bprocess=([^\s]+)`)
var androidExitTimestamp = regexp.MustCompile(`\btimestamp=(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3})`)
var androidExitReason = regexp.MustCompile(`\breason=(\d+)\s*\(([^)]+)\)`)
var androidExitStatus = regexp.MustCompile(`\bstatus=(\d+)`)
var androidExitZone = regexp.MustCompile(`^[+-]\d{4}$`)

func parseAndroidExitHistory(run Session, output, zone string, now time.Time) ([]RetainedNativeReport, error) {
	found := []RetainedNativeReport{}
	if len(output) > nativeReportBytes || !utf8.ValidString(output) || !androidExitZone.MatchString(zone) || !strings.Contains(output, "ACTIVITY MANAGER PROCESS EXIT INFO") {
		return nil, errors.New("Android exit history format or bound unavailable")
	}
	if run.NativeIdentity == nil || !androidNativeAppID.MatchString(run.NativeIdentity.AppID) {
		return nil, errors.New("Android package identity unavailable")
	}
	app := run.NativeIdentity.AppID
	consume := func(content string) error {
		process := androidExitProcess.FindStringSubmatch(content)
		if len(process) != 2 || (process[1] != app && !strings.HasPrefix(process[1], app+":")) {
			return nil
		}
		date := androidExitTimestamp.FindStringSubmatch(content)
		if len(date) != 2 {
			return nil
		}
		timestamp, valid := parseNativeReportTime(strings.Replace(date[1], " ", "T", 1) + zone)
		if !valid || !nativeReportWindow(run, timestamp, now) {
			return nil
		}
		reason := androidExitReason.FindStringSubmatch(content)
		if len(reason) != 3 {
			return errors.New("unknown Android exit reason format")
		}
		kind := "process-exit"
		switch reason[1] {
		case "5":
			kind = "native-crash"
		case "4":
			kind = "crash"
		case "6":
			kind = "anr"
		}
		status := "unknown"
		if match := androidExitStatus.FindStringSubmatch(content); len(match) == 2 {
			status = match[1]
		}
		data := []byte(content)
		found = append(found, RetainedNativeReport{Version: 1, NativeReport: NativeReport{ID: fmt.Sprintf("report_%x", sha256.Sum256(data)), Kind: kind, Source: "android-exit-info", Timestamp: timestamp.Format("2006-01-02T15:04:05.000Z"), Summary: nativeReportText(reason[2]+"; status="+status, 512), Association: "candidate", AssociationReason: "Recorded device/package and exit time match; timestamp uses the device’s current time zone and does not establish exact process ownership.", Bytes: len(data)}, Data: data})
		return nil
	}
	// Preserve each original block byte-for-byte, including CRLF and indentation.
	at, start := 0, -1
	for _, line := range strings.SplitAfter(output, "\n") {
		text := strings.TrimRight(line, "\r\n")
		if androidExitBoundary.MatchString(text) {
			if start >= 0 {
				if err := consume(output[start:at]); err != nil {
					return nil, err
				}
				start = -1
			}
			if strings.HasSuffix(line, "\n") && androidExitStart.MatchString(text) {
				start = at
			}
		}
		at += len(line)
	}
	if start >= 0 {
		if err := consume(output[start:]); err != nil {
			return nil, err
		}
	}
	if strings.Contains(output, "ApplicationExitInfo") && len(found) == 0 && !androidExitTimestamp.MatchString(output) {
		return nil, errors.New("unknown Android exit history format")
	}
	return found, nil
}

type NativeReportSourceBlockedKey struct{}

type androidReportRead func(context.Context, []string) (string, error)

func readAndroidReportCommand(ctx context.Context, cwd string, args []string) (string, error) {
	tool, err := project.Executable(ctx, "adb")
	if err != nil {
		return "", err
	}
	tool, err = filepath.Abs(tool)
	if err != nil {
		return "", err
	}
	result, err := proc.RunProcess(ctx, append([]string{tool}, args...), cwd, project.ExecutionEnvironment(ctx))
	if err != nil {
		return "", err
	}
	if ctx.Err() != nil {
		return "", ctx.Err()
	}
	if result.Cancelled || result.ExitCode != 0 || result.Truncated {
		return "", errors.New("Android exit history command failed or exceeded its bound")
	}
	return result.Stdout, nil
}
func androidNativeReportsWith(ctx context.Context, run Session, now time.Time, read androidReportRead) ([]RetainedNativeReport, NativeReportCoverage, error) {
	unavailable := NativeReportCoverage{Status: "unavailable", Detail: "Android exit history could not be read. Recorded device/package identity, device access, OS support and bounded commands are required."}
	if run.NativeIdentity == nil || len(run.NativeIdentity.AppID) > 255 || !androidNativeAppID.MatchString(run.NativeIdentity.AppID) || len(run.TargetID) > 256 || !androidNativeDeviceID.MatchString(run.TargetID) {
		return nil, unavailable, nil
	}
	if ctx.Err() != nil {
		return nil, unavailable, ctx.Err()
	}
	if blocked, _ := ctx.Value(NativeReportSourceBlockedKey{}).(bool); blocked {
		unavailable.Detail = "Native report commands are disabled after unconfirmed subprocess cleanup; retained logs remain readable."
		return nil, unavailable, nil
	}
	child, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()
	zone, err := read(child, []string{"-s", run.TargetID, "shell", "date", "+%z"})
	if err != nil {
		if ctx.Err() != nil {
			return nil, unavailable, ctx.Err()
		}
		if cli.RequiresFailureEvidence(err) {
			return nil, unavailable, err
		}
		return nil, unavailable, nil
	}
	zone = strings.TrimSpace(zone)
	if !androidExitZone.MatchString(zone) {
		return nil, unavailable, nil
	}
	output, err := read(child, []string{"-s", run.TargetID, "shell", "dumpsys", "activity", "exit-info", run.NativeIdentity.AppID})
	if err != nil {
		if ctx.Err() != nil {
			return nil, unavailable, ctx.Err()
		}
		if cli.RequiresFailureEvidence(err) {
			return nil, unavailable, err
		}
		return nil, unavailable, nil
	}
	found, err := parseAndroidExitHistory(run, output, zone, now)
	if err != nil {
		return nil, unavailable, nil
	}
	return found, NativeReportCoverage{Status: "partial", Detail: "App-scoped Android exit history is readable. These are exit records, not full ANR traces or tombstones; trace files are not collected. Empty results mean no matching exit record was found in this run window."}, nil
}
func androidNativeReports(ctx context.Context, run Session, now time.Time) ([]RetainedNativeReport, NativeReportCoverage, error) {
	return androidNativeReportsWith(ctx, run, now, func(ctx context.Context, args []string) (string, error) {
		return readAndroidReportCommand(ctx, run.AppRoot, args)
	})
}

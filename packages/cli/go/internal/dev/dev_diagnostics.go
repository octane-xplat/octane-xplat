package dev

import (
	"context"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/history"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"math"
	"os"
	"slices"
)

// Retained diagnostics remain readable without a live server. A live owner is
// trusted only inside authenticated foreground RPC, never from a recorded PID.
func DiagnosticsCommand(ctx context.Context, workspace *project.WorkspaceContext, values map[string]any) (any, *cli.Error) {
	app, failure := devSelectedApp(workspace)
	if failure != nil {
		return nil, failure
	}
	options, failure := diagnosticsOptions(values)
	if failure != nil {
		return nil, failure
	}
	if options.report != "" {
		parent, err := history.DiagnosticsHistoryParent()
		if err != nil {
			return nil, cli.ExecutionFailure(err)
		}
		return readDevDiagnostics(ctx, parent, app.Root, "", values)
	}
	cache, err := devServerCacheParent()
	if err != nil {
		return nil, cli.ExecutionFailure(err)
	}
	client, failure := lookupDevServer(ctx, cache, app.Root)
	if failure == nil {
		args := map[string]any{}
		for key, value := range values {
			if !slices.Contains([]string{"project", "app", "client", "json", "schema"}, key) {
				args[key] = value
			}
		}
		// Do not turn an RPC failure into a success with potentially stale owner data.
		return client.call(ctx, "diagnostics", args)
	}
	if ctx.Err() != nil {
		return nil, cli.ExecutionFailure(ctx.Err())
	}
	parent, err := history.DiagnosticsHistoryParent()
	if err != nil {
		return nil, cli.ExecutionFailure(err)
	}
	return readDevDiagnostics(ctx, parent, app.Root, "", values)
}

type devDiagnosticsOptions struct {
	session, platform, stream, report string
	cursor                            *int64
	limit                             int
}

func diagnosticsOptions(values map[string]any) (devDiagnosticsOptions, *cli.Error) {
	result := devDiagnosticsOptions{limit: 500}
	for key, value := range values {
		switch key {
		case "sessionId", "platform", "stream", "reportId":
			text, ok := value.(string)
			if !ok || text == "" {
				return result, cli.Invalid("Diagnostic selectors must be nonempty strings.")
			}
			switch key {
			case "sessionId":
				result.session = text
			case "platform":
				result.platform = text
			case "stream":
				result.stream = text
			case "reportId":
				result.report = text
			}
		case "cursor", "limit":
			number, ok := value.(float64)
			if !ok || math.IsNaN(number) || math.IsInf(number, 0) || math.Trunc(number) != number || number < 0 || number > 9007199254740991 {
				return result, cli.Invalid("Diagnostic pagination must use nonnegative safe integers.")
			}
			if key == "cursor" {
				cursor := int64(number)
				result.cursor = &cursor
			} else {
				if number < 1 || number > 5000 {
					return result, cli.Invalid("Diagnostic limit must be between 1 and 5000.")
				}
				result.limit = int(number)
			}

		case "project", "app", "client", "json", "schema":
		default:
			return result, cli.Invalid("Unknown diagnostics option: " + key)
		}
	}
	if result.report != "" && (result.session == "" || !history.NativeReportID.MatchString(result.report) || result.cursor != nil || values["limit"] != nil || result.stream != "") {
		return result, cli.Invalid("--report requires a valid retained report ID and --session, without log pagination or stream filters.")
	}
	if result.session != "" && !history.HistoryID.MatchString(result.session) {
		return result, cli.Invalid("Select an engine capture session ID returned by diagnostics; observed app session IDs are separate.")
	}
	if !slices.Contains([]string{"", "web", "ios", "android", "macos", "linux", "windows"}, result.platform) {
		return result, cli.Invalid("Unknown diagnostics platform.")
	}
	if !slices.Contains([]string{"", "stdout", "stderr", "lifecycle"}, result.stream) {
		return result, cli.Invalid("Unknown diagnostic log stream.")
	}
	if result.session == "" && (result.cursor != nil || values["limit"] != nil || result.stream != "") {
		return result, cli.Invalid("Select --session before paging or filtering log records.")
	}
	return result, nil
}

func readDevDiagnostics(ctx context.Context, parent, app, owner string, values map[string]any) (any, *cli.Error) {
	options, failure := diagnosticsOptions(values)
	if failure != nil {
		return nil, failure
	}
	if ctx.Err() != nil {
		return nil, cli.ExecutionFailure(ctx.Err())
	}
	store, err := history.LookupHistoryStore(parent, app)
	if err != nil {
		return nil, cli.ExecutionFailure(err)
	}
	if store == nil {
		if options.session != "" {
			return nil, &cli.Error{Code: "not_found", Message: "No retained engine capture for this app and session."}
		}
		return diagnosticsInventory([]map[string]any{}), nil
	}
	defer store.Close()
	if options.session == "" {
		sessions, err := store.List()
		if err != nil {
			return nil, cli.ExecutionFailure(err)
		}
		records := []map[string]any{}
		for _, session := range sessions {
			if ctx.Err() != nil {
				return nil, cli.ExecutionFailure(ctx.Err())
			}
			if options.platform == "" || session.Platform == options.platform {
				records = append(records, history.ObservedHistorySession(session, owner))
			}
		}
		return diagnosticsInventory(records), nil
	}
	session, err := store.Read(options.session)
	if os.IsNotExist(err) {
		return nil, &cli.Error{Code: "not_found", Message: "No retained engine capture for this app and session."}
	}
	if err != nil {
		return nil, cli.ExecutionFailure(err)
	}
	if options.platform != "" && options.platform != session.Platform {
		return nil, cli.Invalid("The selected capture belongs to another platform.")
	}
	if options.report != "" {
		root, err := history.NativeReportsRoot(store, session.SessionID, false)
		if os.IsNotExist(err) {
			return nil, &cli.Error{Code: "not_found", Message: "No retained original for this app and capture."}
		}
		if err != nil {
			return nil, cli.ExecutionFailure(err)
		}
		defer root.Close()
		report, err := history.ReadRetainedNativeReport(root, options.report)
		if os.IsNotExist(err) {
			return nil, &cli.Error{Code: "not_found", Message: "No retained original for this app and capture."}
		}
		if err != nil {
			return nil, cli.ExecutionFailure(err)
		}
		if ctx.Err() != nil {
			return nil, cli.ExecutionFailure(ctx.Err())
		}
		return map[string]any{"sessionId": session.SessionID, "report": struct {
			history.NativeReport
			Content string `json:"content"`
		}{report.NativeReport, string(report.Data)}}, nil
	}
	logs, err := store.Logs(options.session, owner, options.cursor, options.limit, options.stream)
	if errors.Is(err, history.ErrHistoryCursorAhead) {
		return nil, cli.Invalid(err.Error())
	}
	if err != nil {
		failure := cli.ExecutionFailure(err)
		if errors.Is(err, history.ErrHistoryRotated) || errors.Is(err, history.ErrHistoryChanged) || osfs.HistoryReadMayBeRotating(err) {
			retry := true
			failure.Retryable = &retry
		}
		return nil, failure
	}
	if ctx.Err() != nil {
		return nil, cli.ExecutionFailure(ctx.Err())
	}
	native, reportErr := history.DiscoverNativeReports(ctx, store, session)
	if ctx.Err() != nil {
		return nil, cli.ExecutionFailure(ctx.Err())
	}
	if reportErr != nil {
		if cli.RequiresFailureEvidence(reportErr) {
			failure := cli.ExecutionFailure(reportErr)
			failure.Context = map[string]any{"logs": logs, "cleanup": "unknown"}
			return nil, failure
		}
		native = history.NativeReportSnapshot{Reports: []history.NativeReport{}, Coverage: history.NativeReportCoverage{Status: "unavailable", Detail: "Native report discovery or retention failed; engine logs remain readable."}}
	}
	consoleStatus := "not-observed"
	for _, record := range logs.Records {
		if record.Source == "browser" {
			consoleStatus = "captured"
			break
		}
	}
	return map[string]any{"sessionId": session.SessionID, "session": logs.Session, "logs": logs, "reports": native.Reports, "coverage": map[string]any{"logs": "captured", "appConsole": map[string]any{"status": consoleStatus, "scope": "returned-page", "detail": "Forwarded browser warnings, errors and runtime failures only; no complete console coverage or absence of errors is inferred. Stacks are runtime-raw."}, "nativeReports": native.Coverage}}, nil
}
func diagnosticsInventory(records []map[string]any) any {
	return map[string]any{"sessions": records, "note": "Select --session with an engine capture ID from this list. Observed app session IDs are separate. Reads never start a dev server or claim app ownership."}
}

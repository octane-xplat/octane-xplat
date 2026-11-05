package main

import (
	"context"
	"errors"
	"math"
	"os"
	"path/filepath"
	"slices"
)

func init() { commandHandlers["diagnostics"] = devDiagnosticsCommand }

func diagnosticsHistoryParent() (string, error) {
	cache, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(cache, "octane-xplat", "cli-go"), nil
}

// Retained diagnostics remain readable without a live server. A live owner is
// trusted only inside authenticated foreground RPC, never from a recorded PID.
func devDiagnosticsCommand(ctx context.Context, workspace *workspaceContext, values map[string]any) (any, *cliError) {
	app, failure := runtimeSelectedApp(workspace)
	if failure != nil {
		return nil, failure
	}
	if _, failure := diagnosticsOptions(values); failure != nil {
		return nil, failure
	}
	cache, err := devServerCacheParent()
	if err != nil {
		return nil, executionFailure(err)
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
		return nil, executionFailure(ctx.Err())
	}
	parent, err := diagnosticsHistoryParent()
	if err != nil {
		return nil, executionFailure(err)
	}
	return readDevDiagnostics(ctx, parent, app.Root, "", values)
}

type devDiagnosticsOptions struct {
	session, platform, stream string
	cursor                    *int64
	limit                     int
}

func diagnosticsOptions(values map[string]any) (devDiagnosticsOptions, *cliError) {
	result := devDiagnosticsOptions{limit: 500}
	for key, value := range values {
		switch key {
		case "sessionId", "platform", "stream":
			text, ok := value.(string)
			if !ok || text == "" {
				return result, invalid("Diagnostic selectors must be nonempty strings.")
			}
			switch key {
			case "sessionId":
				result.session = text
			case "platform":
				result.platform = text
			case "stream":
				result.stream = text
			}
		case "cursor", "limit":
			number, ok := value.(float64)
			if !ok || math.IsNaN(number) || math.IsInf(number, 0) || math.Trunc(number) != number || number < 0 || number > 9007199254740991 {
				return result, invalid("Diagnostic pagination must use nonnegative safe integers.")
			}
			if key == "cursor" {
				cursor := int64(number)
				result.cursor = &cursor
			} else {
				if number < 1 || number > 5000 {
					return result, invalid("Diagnostic limit must be between 1 and 5000.")
				}
				result.limit = int(number)
			}
		case "reportId":
			return result, &cliError{Code: "unavailable", Message: "Native crash-report discovery and retained originals are not implemented in the parallel Go CLI. Engine log capture is available separately."}
		case "project", "app", "client", "json", "schema":
		default:
			return result, invalid("Unknown diagnostics option: " + key)
		}
	}
	if result.session != "" && !historyID.MatchString(result.session) {
		return result, invalid("Select an engine capture session ID returned by diagnostics; observed app session IDs are separate.")
	}
	if !slices.Contains([]string{"", "web", "ios", "android", "macos", "linux", "windows"}, result.platform) {
		return result, invalid("Unknown diagnostics platform.")
	}
	if !slices.Contains([]string{"", "stdout", "stderr", "lifecycle"}, result.stream) {
		return result, invalid("Unknown diagnostic log stream.")
	}
	if result.session == "" && (result.cursor != nil || values["limit"] != nil || result.stream != "") {
		return result, invalid("Select --session before paging or filtering log records.")
	}
	return result, nil
}

func readDevDiagnostics(ctx context.Context, parent, app, owner string, values map[string]any) (any, *cliError) {
	options, failure := diagnosticsOptions(values)
	if failure != nil {
		return nil, failure
	}
	if ctx.Err() != nil {
		return nil, executionFailure(ctx.Err())
	}
	store, err := lookupRuntimeHistory(parent, app)
	if err != nil {
		return nil, executionFailure(err)
	}
	if store == nil {
		if options.session != "" {
			return nil, &cliError{Code: "not_found", Message: "No retained engine capture for this app and session."}
		}
		return diagnosticsInventory([]map[string]any{}), nil
	}
	defer store.Close()
	if options.session == "" {
		sessions, err := store.List()
		if err != nil {
			return nil, executionFailure(err)
		}
		records := []map[string]any{}
		for _, session := range sessions {
			if ctx.Err() != nil {
				return nil, executionFailure(ctx.Err())
			}
			if options.platform == "" || session.Platform == options.platform {
				records = append(records, observedHistorySession(session, owner))
			}
		}
		return diagnosticsInventory(records), nil
	}
	session, err := store.Read(options.session)
	if os.IsNotExist(err) {
		return nil, &cliError{Code: "not_found", Message: "No retained engine capture for this app and session."}
	}
	if err != nil {
		return nil, executionFailure(err)
	}
	if options.platform != "" && options.platform != session.Platform {
		return nil, invalid("The selected capture belongs to another platform.")
	}
	logs, err := store.Logs(options.session, owner, options.cursor, options.limit, options.stream)
	if errors.Is(err, errHistoryCursorAhead) {
		return nil, invalid(err.Error())
	}
	if err != nil {
		failure := executionFailure(err)
		if errors.Is(err, errHistoryRotated) || errors.Is(err, errHistoryChanged) || historyReadMayBeRotating(err) {
			retry := true
			failure.Retryable = &retry
		}
		return nil, failure
	}
	if ctx.Err() != nil {
		return nil, executionFailure(ctx.Err())
	}
	consoleStatus := "not-observed"
	for _, record := range logs.Records {
		if record.Source == "browser" {
			consoleStatus = "captured"
			break
		}
	}
	return map[string]any{"sessionId": session.SessionID, "session": logs.Session, "logs": logs, "reports": []any{}, "coverage": map[string]any{"logs": "captured", "appConsole": map[string]any{"status": consoleStatus, "scope": "returned-page", "detail": "Forwarded browser warnings, errors and runtime failures only; no complete console coverage or absence of errors is inferred. Stacks are runtime-raw."}, "nativeReports": map[string]any{"status": "unavailable", "detail": "Native crash-report discovery and retention are not implemented in the parallel Go CLI; engine logs remain readable."}}}, nil
}
func diagnosticsInventory(records []map[string]any) any {
	return map[string]any{"sessions": records, "note": "Select --session with an engine capture ID from this list. Observed app session IDs are separate. Reads never start a dev server or claim app ownership."}
}

package dev

import (
	"context"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/history"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os/exec"
	"path/filepath"
	"sync"
)

func AppCommand(name string) func(context.Context, *project.WorkspaceContext, map[string]any) (any, *cli.Error) {
	return func(ctx context.Context, workspace *project.WorkspaceContext, values map[string]any) (any, *cli.Error) {
		return devAppRequest(ctx, workspace, name, values)
	}
}

func devSelectedApp(workspace *project.WorkspaceContext) (*project.AppIdentity, *cli.Error) {
	selection := workspace.Selection()
	if selection.State != "bound" {
		code := "invalid_selection"
		if selection.State == "ambiguous" {
			code = "ambiguous_selection"
		}
		return nil, &cli.Error{Code: code, Message: "Development work needs an explicit app binding.", Recovery: map[string]string{"action": "Select an app with --app or `xplat app select`."}}
	}
	return selection.App, nil
}

type devTargetProgress struct {
	target    devTarget
	state     string
	readiness string
	detail    string
}

type devTargetView struct {
	mu      sync.Mutex
	appRoot string
	targets []devTargetProgress
	apps    *devAppHub
	server  *devServer
}

func newDevTargetView(appRoot string, targets []devTarget) *devTargetView {
	view := &devTargetView{appRoot: appRoot}
	for _, target := range targets {
		view.targets = append(view.targets, devTargetProgress{target: target, state: "starting"})
	}
	return view
}

func foregroundDevExecution() (project.Execution, error) {
	node, err := exec.LookPath("node")
	if err != nil {
		return project.Execution{}, fmt.Errorf("Node is required for the selected project's development workers: %w", err)
	}
	node, err = filepath.Abs(node)
	if err != nil {
		return project.Execution{}, err
	}
	execution := project.Execution{Environment: project.ToolEnvironment(), Node: node, Tools: map[string]string{}}
	for _, tool := range project.RuntimeTools {
		if path, err := exec.LookPath(tool); err == nil {
			if path, err := filepath.Abs(path); err == nil {
				execution.Tools[tool] = path
			}
		}
	}
	return execution, nil
}

func (view *devTargetView) observe(id, kind string, nativeSidecar bool, record history.Record) {
	if nativeSidecar {
		return
	}
	line := history.DevANSI.ReplaceAllString(record.Line, "")
	if match := devLocalURL.FindString(line); match != "" {
		if view.apps != nil {
			view.apps.allowOrigin(id, match)
		}
		view.update(id, "ready", "engine-reported", "The engine reported an HTTP endpoint; app debug attachment is separate.")
	} else if kind != "web" && devReadyLine.MatchString(line) {
		view.update(id, "ready", "engine-reported", "The engine reported readiness; no app debug connection is inferred.")
	}
}

func (view *devTargetView) update(id, state, readiness, detail string) {
	view.mu.Lock()
	defer view.mu.Unlock()
	for i := range view.targets {
		if view.targets[i].target.ID == id {
			view.targets[i].state = state
			view.targets[i].readiness = readiness
			view.targets[i].detail = detail
		}
	}
}

func (view *devTargetView) dispatch(ctx context.Context, command string, values map[string]any) (any, *cli.Error) {
	view.mu.Lock()
	apps, server := view.apps, view.server
	view.mu.Unlock()
	if apps == nil {
		return nil, &cli.Error{Code: "unavailable", Message: "The dev server is still initializing."}
	}
	switch command {
	case "diagnostics":
		server.mu.Lock()
		blocked := server.operationError != nil
		server.mu.Unlock()
		if blocked {
			ctx = context.WithValue(ctx, history.NativeReportSourceBlockedKey{}, true)
		}
		parent, err := history.DiagnosticsHistoryParent()
		if err != nil {
			return nil, cli.ExecutionFailure(err)
		}
		result, failure := readDevDiagnostics(ctx, parent, view.appRoot, server.record.InstanceID, values)
		if failure != nil && cli.RequiresFailureEvidence(failure) {
			server.mu.Lock()
			server.operationError = errors.Join(server.operationError, failure)
			server.mu.Unlock()
		}
		return result, failure
	case "interact":
		return server.inspection.interact(ctx, values)
	case "inspect":
		return server.inspection.inspect(ctx, values)
	case "evidence list", "evidence delete", "evidence retain":
		return server.inspection.evidenceOperation(ctx, command, values)
	case "actions invoke":
		return server.actions.invoke(ctx, values)
	case "actions status":
		return server.actions.status(cli.StringValue(values["jobId"]))
	case "targets":
		view.mu.Lock()
		defer view.mu.Unlock()
		targets := []any{}
		for _, entry := range view.targets {
			if platform := cli.StringValue(values["platform"]); platform != "" && platform != entry.target.Kind {
				continue
			}
			targets = append(targets, map[string]any{
				"targetId": entry.target.ID, "platform": entry.target.Kind, "name": entry.target.Name,
				"engine": map[string]any{"state": entry.state, "readiness": entry.readiness, "detail": entry.detail},
				"apps":   apps.snapshots(entry.target.ID),
			})
		}
		return map[string]any{"appRoot": view.appRoot, "targets": targets}, nil
	case "session list", "session status", "session attach", "actions list":
		return apps.dispatch(command, values)

	default:
		return nil, &cli.Error{Code: "unavailable", Message: "This live app command is not implemented in the parallel Go CLI."}
	}
}

func devAppRequest(ctx context.Context, workspace *project.WorkspaceContext, command string, values map[string]any) (any, *cli.Error) {
	selection := workspace.Selection()
	if selection.State != "bound" {
		code := "invalid_selection"
		if selection.State == "ambiguous" {
			code = "ambiguous_selection"
		}
		return nil, &cli.Error{Code: code, Message: "Select an app with --app before connecting to its dev server.", Context: map[string]any{"candidates": selection.Candidates}}
	}
	cache, err := devServerCacheParent()
	if err != nil {
		return nil, cli.ExecutionFailure(err)
	}
	client, failure := lookupDevServer(ctx, cache, selection.App.Root)
	if failure != nil {
		return nil, failure
	}
	arguments := map[string]any{}
	for key, value := range values {
		switch key {
		case "project", "app", "client", "json", "schema":
			continue // These select the connection, not a second app inside it.
		}
		arguments[key] = value
	}
	if command == "actions invoke" || command == "inspect" || command == "interact" || command == "evidence retain" {
		grants := []string{}
		for _, grant := range cli.PermissionGrants() {
			if grant["state"] == "granted" {
				grants = append(grants, cli.StringValue(grant["scope"]))
			}
		}
		arguments["_grants"] = grants
	}
	return client.call(ctx, command, arguments)
}

func selectedDevApp(values map[string]any) (project.AppIdentity, error) {
	workspace, err := project.NewWorkspaceContext(values)
	if err != nil {
		return project.AppIdentity{}, err
	}
	selection := workspace.Selection()
	if selection.State != "bound" {
		return project.AppIdentity{}, fmt.Errorf("dev requires a selected app; pass --app at an ambiguous workspace root")
	}
	app := *selection.App
	app.Root, err = osfs.Canonical(app.Root)
	return app, err
}

// Match cwd to its nearest package before applying the existing explicit and
// saved-selection rules. An explicit different --project root stays authoritative.

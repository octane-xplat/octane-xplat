package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
)

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

func foregroundDevExecution() (runtimeExecution, error) {
	node, err := exec.LookPath("node")
	if err != nil {
		return runtimeExecution{}, fmt.Errorf("Node is required for the selected project's development workers: %w", err)
	}
	node, err = filepath.Abs(node)
	if err != nil {
		return runtimeExecution{}, err
	}
	execution := runtimeExecution{Environment: projectToolEnvironment(), Node: node, Tools: map[string]string{}}
	for _, tool := range runtimeTools {
		if path, err := exec.LookPath(tool); err == nil {
			if path, err := filepath.Abs(path); err == nil {
				execution.Tools[tool] = path
			}
		}
	}
	return execution, nil
}

func (view *devTargetView) observe(id, kind string, nativeSidecar bool, record historyRecord) {
	if nativeSidecar {
		return
	}
	line := runtimeANSI.ReplaceAllString(record.Line, "")
	if match := runtimeLocalURL.FindString(line); match != "" {
		if view.apps != nil {
			view.apps.allowOrigin(id, match)
		}
		view.update(id, "ready", "engine-reported", "The engine reported an HTTP endpoint; app debug attachment is separate.")
	} else if kind != "web" && runtimeReadyLine.MatchString(line) {
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

func (view *devTargetView) dispatch(ctx context.Context, command string, values map[string]any) (any, *cliError) {
	view.mu.Lock()
	apps, server := view.apps, view.server
	view.mu.Unlock()
	if apps == nil {
		return nil, &cliError{Code: "unavailable", Message: "The dev server is still initializing."}
	}
	switch command {
	case "actions invoke":
		return server.actions.invoke(ctx, values)
	case "actions status":
		return server.actions.status(stringValue(values["jobId"]))
	case "targets":
		view.mu.Lock()
		defer view.mu.Unlock()
		targets := []any{}
		for _, entry := range view.targets {
			if platform := stringValue(values["platform"]); platform != "" && platform != entry.target.Kind {
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
		return nil, &cliError{Code: "unavailable", Message: "This live app command is not implemented in the parallel Go CLI."}
	}
}

func devAppRequest(ctx context.Context, workspace *workspaceContext, command string, values map[string]any) (any, *cliError) {
	selection := workspace.selection()
	if selection.State != "bound" {
		code := "invalid_selection"
		if selection.State == "ambiguous" {
			code = "ambiguous_selection"
		}
		return nil, &cliError{Code: code, Message: "Select an app with --app before connecting to its dev server.", Context: map[string]any{"candidates": selection.Candidates}}
	}
	cache, err := devServerCacheParent()
	if err != nil {
		return nil, executionFailure(err)
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
	if command == "actions invoke" {
		grants := []string{}
		for _, grant := range permissionGrants() {
			if grant["state"] == "granted" {
				grants = append(grants, stringValue(grant["scope"]))
			}
		}
		arguments["_grants"] = grants
	}
	return client.call(ctx, command, arguments)
}

func selectedDevApp(values map[string]any) (appIdentity, error) {
	workspace, err := newWorkspaceContext(values)
	if err != nil {
		return appIdentity{}, err
	}
	selection := workspace.selection()
	if selection.State != "bound" {
		return appIdentity{}, fmt.Errorf("dev requires a selected app; pass --app at an ambiguous workspace root")
	}
	app := *selection.App
	app.Root, err = canonical(app.Root)
	return app, err
}

// Match cwd to its nearest package before applying the existing explicit and
// saved-selection rules. An explicit different --project root stays authoritative.
func workspaceStartDirectory(root string) (string, error) {
	if root != "" && root != "." {
		return filepath.Abs(root)
	}
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for at := cwd; ; at = filepath.Dir(at) {
		if pathExists(filepath.Join(at, "package.json")) {
			return at, nil
		}
		if filepath.Dir(at) == at {
			return cwd, nil
		}
	}
}

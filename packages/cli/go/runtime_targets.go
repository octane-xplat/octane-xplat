package main

import (
	"context"
	"encoding/json"
	"fmt"
	"runtime"
	"slices"
	"strings"
	"time"
)

type runtimeTarget struct {
	target devTarget
	value  map[string]any
}

func discoverRuntimeTargets(ctx context.Context, app appIdentity, platform string) ([]any, []runtimeTarget, *cliError) {
	wanted := app.Platforms
	if platform != "" {
		wanted = []string{platform}
	}
	groups := []any{}
	all := []runtimeTarget{}
	for _, kind := range wanted {
		if !slices.Contains([]string{"web", "ios", "android", "macos", "linux", "windows"}, kind) {
			return nil, nil, invalid("Unknown runtime platform.")
		}
		group := map[string]any{"platform": kind, "declared": slices.Contains(app.Platforms, kind), "targets": []any{}}
		if !slices.Contains(app.Platforms, kind) {
			group["reason"] = fmt.Sprintf("App %q does not declare this platform.", app.ID)
			groups = append(groups, group)
			continue
		}
		host := map[string]string{"ios": "darwin", "macos": "darwin", "linux": "linux", "windows": "windows"}[kind]
		if host != "" && host != runtime.GOOS {
			group["reason"] = "requires a " + host + " host (this server runs on " + runtime.GOOS + ")"
			groups = append(groups, group)
			continue
		}
		targets := []devTarget{}
		switch kind {
		case "web":
			targets = append(targets, devTarget{Kind: kind, ID: kind, Name: "Vite dev server + Chromium"})
		case "macos":
			targets = append(targets, devTarget{Kind: kind, ID: kind, Name: "macOS AppKit/WKWebView dev host"})
		case "windows":
			targets = append(targets, devTarget{Kind: kind, ID: kind, Name: "Windows (ns run windows)"})
		case "linux":
			manifest, _ := projectManifest(app.Root)
			name := "Linux WebKitGTK webview dev host"
			if valueAt(manifest, "xplat", "targets", "linux", "runtime") == "gtk" {
				name = "Linux GTK4/GJS dev host"
			}
			targets = append(targets, devTarget{Kind: kind, ID: kind, Name: name})
		case "ios", "android":
			tool, args := "adb", []string{"devices"}
			if kind == "ios" {
				tool, args = "xcrun", []string{"simctl", "list", "devices", "available", "-j"}
			}
			program, err := projectExecutable(ctx, tool)
			text := ""
			if err == nil {
				probe, cancel := context.WithTimeout(ctx, 8*time.Second)
				result, e := runProcess(probe, append([]string{program}, args...), app.Root, projectExecutionEnvironment(ctx))
				cancel()
				if requiresFailureEvidence(e) {
					return nil, nil, executionFailure(e)
				}
				if ctx.Err() != nil {
					return nil, nil, executionFailure(ctx.Err())
				}
				if e == nil && result.ExitCode == 0 && !result.Cancelled && !result.Truncated {
					text = result.Stdout
				}
			}
			if text == "" {
				group["reason"] = tool + " unavailable; install the selected platform's SDK tools."
			} else if kind == "ios" {
				targets = iosDevTargets([]byte(text))
				if !json.Valid([]byte(text)) {
					group["reason"] = "xcrun simctl output could not be parsed"
				}
			} else {
				targets = androidDevTargets(text)
			}
		}
		rows := []any{}
		for _, target := range targets {
			typeName := "host"
			if kind == "web" {
				typeName = "browser"
			} else if kind == "ios" {
				typeName = "simulator"
			} else if kind == "android" {
				typeName = "device"
				if strings.HasPrefix(target.ID, "emulator-") {
					typeName = "emulator"
				}
			}
			value := map[string]any{"targetId": target.ID, "name": target.Name, "kind": typeName, "availability": "available", "busy": false}
			if target.Booted != nil {
				value["booted"] = *target.Booted
			}
			rows = append(rows, value)
			all = append(all, runtimeTarget{target, value})
		}
		group["targets"] = rows
		groups = append(groups, group)
	}
	return groups, all, nil
}

func selectRuntimeTarget(ctx context.Context, app appIdentity, selector string) (devTarget, *cliError) {
	groups, all, failure := discoverRuntimeTargets(ctx, app, "")
	if failure != nil {
		return devTarget{}, failure
	}
	candidates := []runtimeTarget{}
	for _, target := range all {
		if selector == "" || selector == target.target.ID || selector == target.target.Kind {
			candidates = append(candidates, target)
		}
	}
	if len(candidates) != 1 {
		code := "invalid_selection"
		if len(candidates) > 1 {
			code = "ambiguous_selection"
		} else if selector == "" {
			code = "prerequisite_missing"
		}
		return devTarget{}, &cliError{Code: code, Message: "Select exactly one eligible runtime target.", Context: map[string]any{"platforms": groups}, Recovery: map[string]string{"action": "Use `xplat targets` and pass an exact target id or platform name."}}
	}
	return candidates[0].target, nil
}

func runtimeReadParams(app appIdentity, id string) map[string]any {
	data, _ := json.Marshal(runtimeRequest{Version: 1, AppID: app.ID, AppRoot: app.Root, Grants: []string{"workspace"}, SessionID: id})
	var params map[string]any
	_ = json.Unmarshal(data, &params)
	return params
}

func runtimeTargetsCommand(ctx context.Context, workspace *workspaceContext, values map[string]any) (any, *cliError) {
	app, failure := runtimeSelectedApp(workspace)
	if failure != nil {
		return nil, failure
	}
	physical, err := canonical(app.Root)
	if err != nil {
		return nil, executionFailure(err)
	}
	app.Root = physical
	groups, all, failure := discoverRuntimeTargets(ctx, *app, stringValue(values["platform"]))
	if failure != nil {
		return nil, failure
	}
	parent, err := agentOwnerCacheParent()
	if err != nil {
		return nil, executionFailure(err)
	}
	client, failure := lookupAgentOwner(ctx, parent, workspace.Root)
	if failure != nil {
		return nil, failure
	}
	if client != nil {
		data, failure := client.call(ctx, "runtime.targetClaims", runtimeReadParams(*app, ""))
		if failure != nil {
			return nil, failure
		}
		var claims struct {
			Claims []struct {
				Platform, TargetID string
				Session            map[string]any
			}
		}
		if json.Unmarshal(data, &claims) != nil {
			return nil, ownerDisconnected("Invalid native target ownership response.")
		}
		for _, target := range all {
			for _, claim := range claims.Claims {
				if target.target.Kind == claim.Platform && target.target.ID == claim.TargetID {
					target.value["busy"] = true
					target.value["session"] = claim.Session
				}
			}
		}
	}
	return map[string]any{"app": app.ID, "platforms": groups}, nil
}

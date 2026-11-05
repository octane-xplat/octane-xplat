package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"
)

func init() {
	commandHandlers["status"] = func(ctx context.Context, workspace *workspaceContext, _ map[string]any) (any, *cliError) {
		return projectStatus(ctx, workspace)
	}
	commandHandlers["capabilities"] = func(_ context.Context, workspace *workspaceContext, values map[string]any) (any, *cliError) {
		platforms := workspace.platforms()
		if selected := stringValue(values["platform"]); selected != "" {
			platforms = slices.DeleteFunc(platforms, func(value string) bool { return value != selected })
		}
		return map[string]any{"capabilities": workspace.capabilityMatrix(platforms)}, nil
	}
}

func (workspace *workspaceContext) platforms() []string {
	selection := workspace.selection()
	if selection.State == "bound" {
		return slices.Clone(selection.App.Platforms)
	}
	platforms := []string{}
	for _, app := range workspace.Discovery.Apps {
		for _, platform := range app.Platforms {
			if !slices.Contains(platforms, platform) {
				platforms = append(platforms, platform)
			}
		}
	}
	return platforms
}

// A registered command can report unavailable services. Do not copy the Node
// registry's server-side defaults: those services must be ported independently.
func (workspace *workspaceContext) capabilityMatrix(platforms []string) []any {
	matrices := []any{}
	selection := workspace.selection()
	for _, platform := range platforms {
		entries := []any{}
		for _, capability := range metadata.CapabilityIDs {
			entry := map[string]any{"capability": capability, "status": "unavailable", "detail": "The Go " + strings.ReplaceAll(capability, "_", " ") + " provider is pending."}
			switch capability {
			case "project_status":
				entry = map[string]any{"capability": capability, "status": "supported"}
			case "target_discovery":
				entry = map[string]any{"capability": capability, "status": "partial", "detail": "Reads dev engines and connected app WebSocket instances; engine readiness remains separate from app attachment. Actual OS/app qualification is reported separately."}
			case "attach":
				entry["status"] = "partial"
				entry["detail"] = "Observes an app already connected over the dev WebSocket. Requires a runtime WebSocket implementation; platform/app qualification remains separate. Clients never start or terminate apps."
				if platform == "ios" || platform == "android" {
					entry["status"] = "unavailable"
					entry["detail"] = "NativeScript device relay/WebSocket adapters are not implemented. Engine spawn does not establish app attachment."
				}
			case "logs":
				entry["status"] = "partial"
				entry["detail"] = "Native retained foreground engine logs are readable live or offline with bounded cursor pagination. The Go Vite plugin forwards bounded browser warnings/errors; diagnostics distinguishes observed records from complete console coverage. Native Apple reports require the capture's recorded identity and the Mac that ran it; candidate/confirmed associations are distinct. Android exit history is package/device-scoped candidate evidence, not full traces or confirmed PID ownership. NativeScript identities require selected-device sync output; runtime qualification remains separate. Observed app sessions use separate identities."
			case "evidence":
				entry["status"] = "partial"
				entry["detail"] = "Native session text evidence and permission-gated restart-safe retention; pure offline reads/deletion, bounded private per-app storage and explicit expiry. Image/artifact-file retention is not implemented."
			case "interaction":
				if platform == "web" {
					entry["status"] = "partial"
					entry["detail"] = "Explicit programmatic HTML handler-dispatch through the connected app, with inspected document and request-key receipts. No CDP/OS-input qualification or app-state assertion."
				}
			case "ui_inspection":
				if platform == "web" {
					entry["status"] = "partial"
					entry["detail"] = "Named DOM hosts through an already-connected app inspector, with bounded pages and private-value redaction. Requires an announced browser inspector; no app/browser launch, component tree, shadow-root/iframe coverage or OS-input claim."
				}
			case "dev_actions":
				entry["status"] = "partial"
				entry["detail"] = "Native action invocation/status reuse canonical project-worker validation and app execution, with revision/effect checks, dedupe and unknown/partial outcomes. Raw stacks are retained; current served Vite maps may enrich HTTP frames. File/device mapping and platform qualification remain separate."
				if platform == "ios" || platform == "android" {
					entry["status"] = "unavailable"
					entry["detail"] = "NativeScript app action transport is not implemented; device relay and runtime WebSocket adapters are required."
				}
			case "build":
				entry["detail"] = "Use the ordinary xplat build command with a selected app and declared platform."
				if selection.State == "bound" && slices.Contains(selection.App.Platforms, platform) {
					if _, err := prepareBuildEngines(context.Background(), selection.App.Root, []string{platform}); err != nil {
						entry["detail"] = err.Error()
					} else {
						entry["status"] = "supported"
						entry["detail"] = "Explicit foreground builds use the selected project's engines. SDK prerequisites remain the engine's responsibility; provider availability does not qualify a device or host."
					}
				}
			case "guidance":
				entry["status"] = "partial"
				entry["detail"] = "Project status inventories guidance sources; tailored guidance retrieval is pending."
				if selection.State == "bound" {
					entry = map[string]any{"capability": capability, "status": "supported", "detail": "Native guidance follows the selected app's installed versions and current provider availability."}
				}
			case "code_search":
				if workspace.codeSelection() == nil {
					entry = map[string]any{"capability": capability, "status": "supported", "detail": "Native current-source search/read and a bounded local intent index; results retain corpus, version provenance and freshness."}
				} else {
					entry["detail"] = "Select an app before retrieving its source and installed framework packages."
				}
			case "docs":
				if selection.State == "bound" {
					entry = map[string]any{"capability": capability, "status": "partial", "detail": "Native version-bound docs read/search with explicit lexical fallback. Embeddings require the inference-enabled build and a pinned host runtime."}
					if nativeIndexSupported() {
						entry = map[string]any{"capability": capability, "status": "supported", "detail": "Native version-bound docs read/search/index; hybrid uses prepared native embeddings. Downloads require explicit docs index."}
					}
				}
			case "screenshot":
				entry["requiresPermission"] = "visual-capture"
				entry["detail"] = "The Go screenshot provider is pending. Capture requires explicit per-task developer approval when supported."
			}
			entries = append(entries, entry)
		}
		matrices = append(matrices, map[string]any{"platform": platform, "declared": selection.State == "bound" && slices.Contains(selection.App.Platforms, platform), "capabilities": entries})
	}
	return matrices
}

func guidanceSources(root string) []map[string]any {
	sources := []map[string]any{}
	for _, candidate := range [][2]string{{"AGENTS.md", "agents-md"}, {"CLAUDE.md", "claude-md"}, {".devin", "devin"}, {"docs/", "framework"}} {
		if pathExists(filepath.Join(root, candidate[0])) {
			sources = append(sources, map[string]any{"kind": candidate[1], "path": candidate[0]})
		}
	}
	return sources
}
func (workspace *workspaceContext) guidance() []map[string]any {
	sources := guidanceSources(workspace.Root)
	apps := workspace.Discovery.Apps
	if selection := workspace.selection(); selection.State == "bound" {
		apps = []appIdentity{*selection.App}
		if selection.App.RelativeRoot == "." {
			return sources
		}
	}
	for _, app := range apps {
		for _, source := range guidanceSources(app.Root) {
			source["path"] = app.ID + "/" + stringValue(source["path"])
			sources = append(sources, source)
		}
	}
	return sources
}

type prerequisiteCheck struct {
	ID, Name  string
	Argv      []string
	Platforms []string
	Remedy    string
}

func diagnosticEnvironment() []string {
	result := []string{}
	for _, entry := range os.Environ() {
		key, _, _ := strings.Cut(entry, "=")
		if !strings.EqualFold(key, "NODE_PATH") && !strings.EqualFold(key, "NODE_OPTIONS") && !strings.EqualFold(key, "COREPACK_ENABLE_NETWORK") && !strings.EqualFold(key, "COREPACK_ENABLE_DOWNLOAD_PROMPT") {
			result = append(result, entry)
		}
	}
	// Prerequisite inspection must not let a package-manager shim install itself.
	return append(result, "NODE_PATH=", "NODE_OPTIONS=", "COREPACK_ENABLE_NETWORK=0", "COREPACK_ENABLE_DOWNLOAD_PROMPT=0")
}

func (workspace *workspaceContext) prerequisites(ctx context.Context, platforms []string) []any {
	checks := []prerequisiteCheck{
		{"node", "Node.js", []string{"node", "--version"}, nil, "Install Node.js 22.18 or newer for project JavaScript workers."},
		{"git", "Git", []string{"git", "--version"}, nil, "Install Git for version-matched documentation checkouts."},
		{"xcode", "Xcode command line tools", []string{"xcodebuild", "-version"}, []string{"ios", "macos"}, "Install Xcode and run `xcode-select --install`."},
		{"adb", "Android Debug Bridge", []string{"adb", "--version"}, []string{"android"}, "Install Android platform-tools (adb on PATH)."},
	}
	// Package-manager selection is configuration, not an instruction to install
	// every supported manager. Engine availability is distinct from readiness.
	directory := workspace.Root
	if selection := workspace.selection(); selection.State == "bound" {
		directory = selection.App.Root
	}
	manager, err := projectPackageManager(ctx, directory, nil)
	if err == nil {
		managerCheck := prerequisiteCheck{manager, manager, []string{manager, "--version"}, nil, "Install the project's declared " + manager + " package manager for build/dev operations."}
		checks = append([]prerequisiteCheck{checks[0], managerCheck}, checks[1:]...)
	}
	filtered := []prerequisiteCheck{}
	for _, check := range checks {
		if len(check.Platforms) == 0 || slices.ContainsFunc(check.Platforms, func(platform string) bool { return slices.Contains(platforms, platform) }) {
			filtered = append(filtered, check)
		}
	}
	result := make([]any, len(filtered))
	var group sync.WaitGroup
	for index, check := range filtered {
		group.Go(func() {
			entry := map[string]any{"id": check.ID, "name": check.Name, "status": "missing", "remedy": check.Remedy}
			if len(check.Platforms) > 0 {
				entry["platforms"] = check.Platforms
			}
			probeContext, cancel := context.WithTimeout(ctx, 3*time.Second)
			defer cancel()
			process, err := runProcess(probeContext, check.Argv, directory, diagnosticEnvironment())
			if err == nil && !process.Cancelled && process.ExitCode == 0 && strings.TrimSpace(process.Stdout) != "" {
				entry["status"] = "satisfied"
				entry["detail"] = strings.Split(strings.TrimSpace(process.Stdout), "\n")[0]
				delete(entry, "remedy")
				if check.ID == "node" {
					var major, minor, patch int
					count, _ := fmt.Sscanf(strings.TrimSpace(process.Stdout), "v%d.%d.%d", &major, &minor, &patch)
					if count != 3 || major < 22 || (major == 22 && minor < 18) {
						entry["status"] = "missing"
						entry["remedy"] = check.Remedy
					}
				}
			} else if probeContext.Err() != nil {
				entry["status"] = "unknown"
				entry["detail"] = "The prerequisite probe was cancelled or exceeded three seconds."
			}
			result[index] = entry
		})
	}
	group.Wait()
	if err != nil {
		result = append(result, map[string]any{"id": "package-manager", "name": "Project package manager", "status": "missing", "remedy": err.Error()})
	}
	return result
}

func projectStatus(ctx context.Context, workspace *workspaceContext) (any, *cliError) {
	selection := workspace.selection()
	var binding any
	if selection.State == "bound" {
		value, err := resolveFrameworkBinding(ctx, workspace.Root, selection.App.Root)
		if err != nil {
			return nil, &cliError{Code: "execution_failure", Message: "Framework binding failed: " + err.Error()}
		}
		binding = value
	}
	platforms := workspace.platforms()
	prerequisites := workspace.prerequisites(ctx, platforms)
	steps := []string{}
	switch selection.State {
	case "none":
		steps = append(steps, "No Octane Xplat app was detected. Run `xplat status --project <directory>` with an app workspace.")
	case "ambiguous":
		steps = append(steps, "Several apps are available or the selector did not match. Select an exact app id with `xplat app select <id>`.")
	default:
		missing := []string{}
		for _, check := range prerequisites {
			entry := object(check)
			if entry["status"] == "missing" {
				missing = append(missing, fmt.Sprintf("%s — %s", entry["name"], entry["remedy"]))
			}
		}
		if len(missing) > 0 {
			steps = append(steps, "Missing prerequisites: "+strings.Join(missing, "; ")+".")
		}
		steps = append(steps, "Run `xplat capabilities --json` before promising runtime support.")
	}
	docsStatus := map[string]any{"state": "unavailable", "detail": "Select an app before retrieving installed-version documentation."}
	if selection.State == "bound" {
		docsStatus = map[string]any{"state": "ready", "detail": "Native read/search provider; release snapshot availability is checked on retrieval. Embeddings require the inference-enabled build and a pinned host runtime."}
		if nativeIndexSupported() {
			docsStatus = map[string]any{"state": "ready", "detail": "Native read/search/index provider; snapshot and prepared embedding availability are checked on retrieval. No latest-version fallback."}
		}
	}
	return map[string]any{
		"server":        map[string]any{"name": "@octane-xplat/cli", "version": metadata.Version},
		"identity":      map[string]any{"workspace": workspace.Discovery.Workspace, "apps": workspace.Discovery.Apps, "selection": selection, "framework": binding},
		"guidance":      map[string]any{"sources": workspace.guidance()},
		"docs":          docsStatus,
		"codeIndex":     workspace.codeIndexStatus(ctx),
		"prerequisites": prerequisites, "capabilities": workspace.capabilityMatrix(platforms),
		"permissions": permissionGrants(), "boundaries": metadata.Boundaries, "nextSteps": steps,
	}, nil
}

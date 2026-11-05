package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"sync"
	"time"
)

// Only this request's environment reaches project engines. It is transient and
// never part of a retained job, descriptor, dedupe key or diagnostic payload.
type runtimeExecutionKey struct{}
type runtimeExecution struct {
	Environment []string
	Node        string
	Observe     func(processResult)
	Tools       map[string]string
	Stream      func(historyRecord)
	Native      func(macDevFrame)
	OwnerID     string
}

var runtimeTools = []string{"xcrun", "adb", "bun", "npm", "pnpm", "git"}

func projectExecutable(ctx context.Context, name string) (string, error) {
	if execution, ok := ctx.Value(runtimeExecutionKey{}).(runtimeExecution); ok {
		if path := execution.Tools[name]; path != "" {
			return path, nil
		}
		return "", exec.ErrNotFound
	}
	return exec.LookPath(name)
}

func projectExecutionEnvironment(ctx context.Context) []string {
	if execution, ok := ctx.Value(runtimeExecutionKey{}).(runtimeExecution); ok {
		return slices.Clone(execution.Environment)
	}
	return projectToolEnvironment()
}

func projectNodeExecutable(ctx context.Context) (string, error) {
	if execution, ok := ctx.Value(runtimeExecutionKey{}).(runtimeExecution); ok {
		return execution.Node, nil
	}
	return exec.LookPath("node")
}

type runtimeRequest struct {
	Version     int               `json:"version"`
	AppID       string            `json:"appId"`
	AppRoot     string            `json:"appRoot"`
	Grants      []string          `json:"grants"`
	Environment []string          `json:"environment,omitempty"`
	Node        string            `json:"node,omitempty"`
	Platform    string            `json:"platform,omitempty"`
	RequestKey  string            `json:"requestKey,omitempty"`
	JobID       string            `json:"jobId,omitempty"`
	SessionID   string            `json:"sessionId,omitempty"`
	Target      string            `json:"target,omitempty"`
	BrowserMode string            `json:"browserMode,omitempty"`
	Tools       map[string]string `json:"tools,omitempty"`
}

func init() {
	for name, method := range map[string]string{"runtime build": "runtime.build", "job status": "jobs.status", "job cancel": "jobs.cancel"} {
		commandHandlers[name] = func(ctx context.Context, workspace *workspaceContext, values map[string]any) (any, *cliError) {
			return runtimeCommand(ctx, workspace, method, values)
		}
	}
	commandHandlers["targets"] = runtimeTargetsCommand
	commandHandlers["session start"] = func(ctx context.Context, w *workspaceContext, v map[string]any) (any, *cliError) {
		return runtimeCommand(ctx, w, "runtime.launch", v)
	}
	for name, method := range map[string]string{"session list": "sessions.list", "session status": "sessions.get", "session end": "sessions.end"} {
		commandHandlers[name] = func(ctx context.Context, w *workspaceContext, v map[string]any) (any, *cliError) {
			return runtimeSessionCommand(ctx, w, method, v)
		}
	}
}

func runtimeSelectedApp(workspace *workspaceContext) (*appIdentity, *cliError) {
	selection := workspace.selection()
	if selection.State != "bound" {
		code := "invalid_selection"
		if selection.State == "ambiguous" {
			code = "ambiguous_selection"
		}
		return nil, &cliError{Code: code, Message: "Runtime work needs an explicit app binding.", Recovery: map[string]string{"action": "Select an app with --app or `xplat app select`."}}
	}
	return selection.App, nil
}

func runtimeCommand(ctx context.Context, workspace *workspaceContext, method string, values map[string]any) (any, *cliError) {
	if method == "jobs.cancel" || method == "jobs.status" {
		cache, err := agentOwnerCacheParent()
		if err != nil {
			return nil, executionFailure(err)
		}
		client, failure := lookupAgentOwner(ctx, cache, workspace.Root)
		if failure != nil {
			return nil, failure
		}
		if client == nil {
			return nil, &cliError{Code: "not_found", Message: "No native agent owner is running; no jobs exist for this workspace."}
		}
		operation := "jobs.statusOwned"
		if method == "jobs.cancel" {
			operation = "jobs.cancelOwned"
		}
		return client.call(ctx, operation, runtimeOwnedParams(workspace, stringValue(values["jobId"]), method == "jobs.cancel"))
	}
	app, failure := runtimeSelectedApp(workspace)
	if failure != nil {
		return nil, failure
	}
	root, err := canonical(app.Root)
	if err != nil {
		return nil, executionFailure(err)
	}
	request := runtimeRequest{Version: 1, AppID: app.ID, AppRoot: root, Platform: stringValue(values["platform"]), RequestKey: stringValue(values["requestKey"]), JobID: stringValue(values["jobId"])}
	request.SessionID = stringValue(values["sessionId"])
	request.Target = stringValue(values["target"])
	request.BrowserMode = stringValue(values["browserMode"])
	for _, grant := range permissionGrants() {
		if grant["state"] == "granted" {
			request.Grants = append(request.Grants, stringValue(grant["scope"]))
		}
	}
	create := method == "runtime.build" || method == "runtime.launch"
	if create {
		if method == "runtime.build" {
			if request.Platform == "" {
				return nil, invalid("Pass --platform to build one declared platform.")
			}
			if !slices.Contains(app.Platforms, request.Platform) {
				return nil, invalid(fmt.Sprintf("App %q does not declare the %q platform.", app.ID, request.Platform))
			}
		}
		request.Node, err = exec.LookPath("node")
		if err != nil {
			return nil, runtimePrerequisite("Node is required; install the Node version required by the selected project and put it on PATH.")
		}
		request.Node, err = filepath.Abs(request.Node)
		if err != nil {
			return nil, executionFailure(err)
		}
		request.Environment = projectToolEnvironment()
		request.Tools = map[string]string{}
		for _, tool := range runtimeTools {
			if found, e := exec.LookPath(tool); e == nil {
				if path, e := filepath.Abs(found); e == nil {
					request.Tools[tool] = path
				}
			}
		}
		request.Environment, failure = runtimeEnvironment(request)
		if failure != nil {
			return nil, failure
		}
	}
	cache, err := agentOwnerCacheParent()
	if err != nil {
		return nil, executionFailure(err)
	}
	var client *agentOwnerClient
	if create {
		executable, err := os.Executable()
		if err != nil {
			return nil, executionFailure(err)
		}
		client, failure = ensureAgentOwner(ctx, cache, workspace.Root, executable, ownerStartupHooks{})
	} else {
		client, failure = lookupAgentOwner(ctx, cache, workspace.Root)
	}
	if failure != nil {
		return nil, failure
	}
	if client == nil {
		return nil, &cliError{Code: "not_found", Message: "No native agent owner is running; no jobs exist for this workspace.", Recovery: map[string]string{"action": "Start work with `xplat runtime build`; completed job history is bounded by the owner's lifetime."}}
	}
	data, err := json.Marshal(request)
	if err != nil {
		return nil, executionFailure(err)
	}
	var params map[string]any
	_ = json.Unmarshal(data, &params)
	return client.call(ctx, method, params)
}

func runtimePrerequisite(message string) *cliError {
	return &cliError{Code: "prerequisite_missing", Message: message, Recovery: map[string]string{"action": "Install the selected project's required Node/build engines and retry."}}
}

func decodeRuntimeRequest(params map[string]any) (runtimeRequest, *cliError) {
	var request runtimeRequest
	data, err := json.Marshal(params)
	if err != nil || len(data) > 512<<10 {
		return request, invalid("Native runtime request exceeds 512 KiB.")
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&request) != nil || decoder.Decode(new(any)) != io.EOF || request.Version != 1 || request.AppID == "" || request.AppRoot == "" || len(request.RequestKey) > 4096 {
		return request, invalid("Invalid native runtime request identity or version.")
	}
	for _, scope := range request.Grants {
		if !slices.Contains(permissionScopes, scope) {
			return request, invalid("Unknown native runtime permission scope.")
		}
	}
	return request, nil
}

func runtimeEnvironment(request runtimeRequest) ([]string, *cliError) {
	for name, path := range request.Tools {
		if !slices.Contains(runtimeTools, name) || !filepath.IsAbs(path) {
			return nil, invalid("Invalid runtime tool selection.")
		}
		if info, err := os.Stat(path); err != nil || !info.Mode().IsRegular() {
			return nil, runtimePrerequisite("An invoking-client runtime tool is unavailable.")
		}
	}
	if !filepath.IsAbs(request.Node) {
		return nil, runtimePrerequisite("The invoking client must select an absolute Node executable.")
	}
	info, err := os.Stat(request.Node)
	if err != nil || !info.Mode().IsRegular() || (runtime.GOOS != "windows" && info.Mode().Perm()&0111 == 0) {
		return nil, runtimePrerequisite("The invoking client's Node executable is unavailable.")
	}
	env := []string{}
	bytes := 0
	for _, entry := range request.Environment {
		bytes += len(entry)
		key, _, present := strings.Cut(entry, "=")
		if key == "" && runtime.GOOS == "windows" && len(entry) >= 4 && entry[0] == '=' && entry[2:4] == ":=" && ((entry[1] >= 'a' && entry[1] <= 'z') || (entry[1] >= 'A' && entry[1] <= 'Z')) {
			key = entry[:3] // Windows drive-current-directory entry, e.g. =C:=C:\app.
		}
		if !present || key == "" || strings.ContainsRune(entry, 0) || bytes > 256<<10 {
			return nil, invalid("Invalid or oversized native project environment.")
		}
		if !strings.EqualFold(key, "NODE_PATH") && !strings.EqualFold(key, "NODE_OPTIONS") && !strings.EqualFold(key, "XPLAT_PERMISSIONS") && !strings.EqualFold(key, "XPLAT_AGENT_CLIENT") && !strings.EqualFold(key, "XPLAT_AGENT_APP") {
			env = append(env, entry)
		}
	}
	return append(env, "NODE_PATH=", "NODE_OPTIONS=", "XPLAT_PERMISSIONS=", "XPLAT_AGENT_CLIENT=", "XPLAT_AGENT_APP="), nil
}

func dispatchRuntime(ctx context.Context, owner *agentOwner, call agentOwnerRequest) (any, *cliError) {
	if slices.Contains([]string{"sessions.overview", "sessions.endOwned", "jobs.cancelOwned", "jobs.statusOwned"}, call.Method) {
		return dispatchOwnedRuntime(ctx, owner, call)
	}
	if !slices.Contains([]string{"runtime.build", "jobs.status", "jobs.cancel", "runtime.launch", "runtime.targetClaims", "sessions.list", "sessions.get", "sessions.end"}, call.Method) {
		return nil, invalid("Unknown native owner operation.")
	}
	request, failure := decodeRuntimeRequest(call.Params)
	if failure != nil {
		return nil, failure
	}
	required := "workspace"
	if !slices.Contains([]string{"jobs.status", "runtime.targetClaims", "sessions.list", "sessions.get"}, call.Method) {
		required = "runtime-actions"
	}
	if !slices.Contains(request.Grants, required) {
		return nil, &cliError{Code: "permission_denied", Message: fmt.Sprintf("Permission %q has not been granted for this request.", required)}
	}
	workspace, err := newWorkspaceContext(map[string]any{"project": owner.descriptor.Project, "app": request.AppID, "client": "native-request"})
	if err != nil {
		return nil, executionFailure(err)
	}
	app, failure := runtimeSelectedApp(workspace)
	if failure != nil {
		return nil, failure
	}
	physical, err := canonical(app.Root)
	if err != nil || filesystemKey(physical) != filesystemKey(request.AppRoot) || app.ID != request.AppID {
		return nil, &cliError{Code: "stale_identity", Message: "Selected app identity changed; rediscover the app before starting or observing work."}
	}
	app.Root = physical
	switch call.Method {
	case "runtime.targetClaims":
		return map[string]any{"claims": owner.sessions.claims(*app)}, nil
	case "sessions.list":
		return map[string]any{"sessions": owner.sessions.list(*app)}, nil
	case "sessions.get":
		return owner.sessions.status(*app, request.SessionID)
	case "sessions.end":
		return owner.sessions.end(ctx, *app, request.SessionID)
	case "jobs.status", "jobs.cancel":
		var job runtimeJob
		if call.Method == "jobs.cancel" {
			job, failure = owner.jobs.cancel(app.ID, app.Root, request.JobID)
		} else {
			job, failure = owner.jobs.status(app.ID, app.Root, request.JobID)
		}
		return map[string]any{"job": job}, failure
	}
	if call.Method == "runtime.launch" {
		environment, failure := runtimeEnvironment(request)
		if failure != nil {
			return nil, failure
		}
		execution := runtimeExecution{Environment: environment, Node: request.Node, Tools: request.Tools, OwnerID: owner.descriptor.Generation}
		launchCtx := context.WithValue(ctx, runtimeExecutionKey{}, execution)
		target, failure := selectRuntimeTarget(launchCtx, *app, request.Target)
		if failure != nil {
			return nil, failure
		}
		if request.BrowserMode != "" && request.BrowserMode != "headless" && request.BrowserMode != "headed" {
			return nil, invalid("Unknown browser mode.")
		}
		return owner.sessions.start(*app, target, request.RequestKey, func(operation context.Context, entry *runtimeSessionEntry, report func(runtimeLaunch, string)) error {
			return runRuntimeSession(context.WithValue(operation, runtimeExecutionKey{}, execution), owner.sessions, entry, target, request.BrowserMode, report)
		})
	}
	if !slices.Contains(app.Platforms, request.Platform) {
		return nil, invalid(fmt.Sprintf("App %q does not declare the %q platform.", app.ID, request.Platform))
	}
	environment, failure := runtimeEnvironment(request)
	if failure != nil {
		return nil, failure
	}
	input := runtimeJobInput{AppID: app.ID, AppRoot: app.Root, Platform: request.Platform, Kind: "build", RequestKey: request.RequestKey}
	job, deduplicated, failure := owner.jobs.start(input, func(operation context.Context, report func(map[string]any) error) (any, error) {
		budget, cancel := context.WithTimeout(operation, 30*time.Minute)
		defer cancel()
		return runRuntimeBuild(context.WithValue(budget, runtimeExecutionKey{}, runtimeExecution{Environment: environment, Node: request.Node, Tools: request.Tools, OwnerID: owner.descriptor.Generation}), *app, request.Platform, report)
	})
	return map[string]any{"job": job, "deduplicated": deduplicated}, failure
}

// Capture bounded completed-process diagnostics without retaining argv or env.
type runtimeBuildTail struct {
	mu    sync.Mutex
	lines []string
}

func (tail *runtimeBuildTail) observe(result processResult) {
	tail.mu.Lock()
	defer tail.mu.Unlock()
	for _, stream := range []string{result.Stdout, result.Stderr} {
		for _, line := range strings.Split(stream, "\n") {
			if line == "" {
				continue
			}
			if len(line) > 2048 {
				line = strings.ToValidUTF8(line[:2048], "�") + " [truncated]"
			}
			tail.lines = append(tail.lines, line)
			if len(tail.lines) > 25 {
				tail.lines = tail.lines[1:]
			}
		}
	}
	if result.Truncated {
		tail.lines = append(tail.lines, "[build output truncated]")
		if len(tail.lines) > 25 {
			tail.lines = tail.lines[1:]
		}
	}
}
func (tail *runtimeBuildTail) snapshot() []string {
	tail.mu.Lock()
	defer tail.mu.Unlock()
	return slices.Clone(tail.lines)
}

func runRuntimeBuild(ctx context.Context, app appIdentity, platform string, report func(map[string]any) error) (answer any, failure error) {
	if err := report(map[string]any{"phase": "starting", "platform": platform}); err != nil {
		return nil, err
	}
	engines, err := prepareBuildEngines(ctx, app.Root, []string{platform})
	if err != nil {
		return nil, runtimePrerequisite(err.Error())
	}
	execution := ctx.Value(runtimeExecutionKey{}).(runtimeExecution)
	release, err := lockOwnedProjectOutputs(app.Root, execution.OwnerID)
	if err != nil {
		var busy *projectOutputsBusyError
		if errors.As(err, &busy) {
			return nil, &cliError{Code: "target_busy", Message: err.Error()}
		}
		return nil, executionFailure(err)
	}
	defer func() {
		panicked := recover()
		var process *processCleanupError
		var cleanup *runtimeSessionCleanupError
		var startup *ownerStartupCleanupError
		if err := release(panicked == nil && !errors.As(failure, &process) && !errors.As(failure, &cleanup) && !errors.As(failure, &startup)); err != nil {
			failure = errors.Join(failure, &runtimeSessionCleanupError{Err: err})
		}
		if panicked != nil {
			panic(panicked)
		}
	}()
	tail := &runtimeBuildTail{}
	execution.Observe = tail.observe
	ctx = context.WithValue(ctx, runtimeExecutionKey{}, execution)
	if err := report(map[string]any{"phase": "building", "platform": platform}); err != nil {
		return nil, err
	}
	engine := engines[0]
	if platform == "macos" || platform == "linux" {
		var location routeLocation
		location, err = locateRoutes(app.Root, routeOptions{}, "")
		if err == nil {
			var prepared preparedRoutes
			prepared, err = prepareRoutes(ctx, location, true)
			if err == nil {
				err = prepared.publish(ctx)
			}
		}
		if err == nil && platform == "macos" {
			err = runMacOSPackage(ctx, app.Root, engine.Entry)
		}
		if err == nil && platform == "linux" {
			err = runLinuxPackage(ctx, app.Root, engine.Entry)
		}
	} else {
		args := []string{execution.Node, engine.Entry, "build"}
		if platform != "web" {
			args = append(args, platform)
		}
		var result processResult
		result, err = runProcess(ctx, args, app.Root, execution.Environment)
		if err == nil && ctx.Err() != nil {
			err = ctx.Err()
		}
		if err == nil && result.ExitCode != 0 {
			err = fmt.Errorf("%s build exited %d", platform, result.ExitCode)
		}
	}
	if err != nil {
		if requiresFailureEvidence(err) || errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return nil, err
		}
		retryable := false
		return nil, &cliError{Code: "execution_failure", Message: err.Error(), Retryable: &retryable, Context: map[string]any{"tail": tail.snapshot()}, cause: err}
	}
	revision, err := runtimeBuildRevision(ctx, app.Root)
	if err != nil {
		return nil, err
	}
	return map[string]any{"platform": platform, "appId": app.ID, "summary": platform + " build succeeded", "buildIdentity": map[string]any{"revision": revision}, "diagnostics": map[string]any{"tail": tail.snapshot()}}, nil
}

func runtimeBuildRevision(ctx context.Context, project string) (any, error) {
	tool, err := projectExecutable(ctx, "git")
	if err != nil {
		return nil, nil
	}
	execution := ctx.Value(runtimeExecutionKey{}).(runtimeExecution)
	execution.Observe = nil
	ctx = context.WithValue(ctx, runtimeExecutionKey{}, execution)
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	result, err := runProcess(ctx, []string{tool, "rev-parse", "HEAD"}, project, projectExecutionEnvironment(ctx))
	if requiresFailureEvidence(err) {
		return nil, err
	}
	if err != nil || result.ExitCode != 0 || result.Truncated {
		return nil, nil
	}
	value := strings.TrimSpace(result.Stdout)
	if !ownerHex(value, 40) && !ownerHex(value, 64) {
		return nil, nil
	}
	status, err := runProcess(ctx, []string{tool, "status", "--porcelain"}, project, projectExecutionEnvironment(ctx))
	if requiresFailureEvidence(err) {
		return nil, err
	}
	if err == nil && status.ExitCode == 0 && strings.TrimSpace(status.Stdout) != "" {
		value += "-dirty"
	}
	return value, nil
}

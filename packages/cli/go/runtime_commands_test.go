package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

func runtimeRPCFixture(t *testing.T) (*agentOwner, appIdentity) {
	t.Helper()
	project := t.TempDir()
	for name, data := range map[string]string{"package.json": `{"name":"runtime-app","private":true,"xplat":{"targets":{}}}`, "index.html": "<h1>fixture</h1>", "vite.config.mjs": "export default {}"} {
		if err := os.WriteFile(filepath.Join(project, name), []byte(data), 0600); err != nil {
			t.Fatal(err)
		}
	}
	project, err := canonical(project)
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	owner := &agentOwner{ctx: ctx, cancel: cancel, touched: time.Now(), descriptor: agentOwnerDescriptor{Project: project}}
	owner.jobs = newRuntimeJobs(owner)
	t.Cleanup(func() { owner.stop(); owner.operations.Wait() })
	return owner, appIdentity{ID: ".", Root: project, Platforms: []string{"web"}}
}

func runtimeTestParams(t *testing.T, request runtimeRequest) map[string]any {
	t.Helper()
	data, err := json.Marshal(request)
	if err != nil {
		t.Fatal(err)
	}
	var value map[string]any
	if err = json.Unmarshal(data, &value); err != nil {
		t.Fatal(err)
	}
	return value
}

func TestAgentOwnerRuntimeDispatchRevalidatesAppAndRequestPolicy(t *testing.T) {
	owner, app := runtimeRPCFixture(t)
	t.Setenv("XPLAT_PERMISSIONS", "workspace,runtime-actions,visual-capture")
	request := runtimeRequest{Version: 1, AppID: app.ID, AppRoot: app.Root, Platform: "web"}
	call := func(method string, request runtimeRequest) *cliError {
		_, err := dispatchRuntime(context.Background(), owner, agentOwnerRequest{Method: method, Params: runtimeTestParams(t, request)})
		return err
	}
	if failure := call("runtime.build", request); failure == nil || failure.Code != "permission_denied" {
		t.Fatal("owner inherited global permission grants", failure)
	}
	request.Grants = []string{"workspace"}
	if failure := call("jobs.status", request); failure == nil || failure.Code != "not_found" {
		t.Fatal("read did not use this request's policy", failure)
	}
	if failure := call("jobs.cancel", request); failure == nil || failure.Code != "permission_denied" {
		t.Fatal("read grant permitted cancellation", failure)
	}
	request.Grants = []string{"runtime-actions"}
	request.AppRoot = filepath.Dir(app.Root)
	if failure := call("runtime.build", request); failure == nil || failure.Code != "stale_identity" {
		t.Fatal("changed app root accepted", failure)
	}
	owner.mu.Lock()
	active := owner.active
	owner.mu.Unlock()
	if active != 0 {
		t.Fatal("rejected request admitted resources")
	}
}

func TestAgentOwnerRuntimeRequestAndEnvironmentAreBounded(t *testing.T) {
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	request := runtimeRequest{Version: 1, AppID: ".", AppRoot: t.TempDir(), Node: executable, Environment: []string{"PATH=/chosen/bin", "MARKER=selected-client", "NODE_OPTIONS=bad", "node_path=bad", "XPLAT_PERMISSIONS=visual-capture", "XPLAT_AGENT_CLIENT=first"}}
	env, failure := runtimeEnvironment(request)
	if failure != nil {
		t.Fatal(failure)
	}
	joined := strings.Join(env, "\n")
	if !strings.Contains(joined, "MARKER=selected-client") || strings.Contains(joined, "=bad") || strings.Contains(joined, "=visual-capture") || strings.Contains(joined, "=first") {
		t.Fatal("request engine environment was not isolated")
	}
	if runtime.GOOS == "windows" {
		request.Environment = append(request.Environment, `=C:=C:\selected`)
		if env, failure = runtimeEnvironment(request); failure != nil || !strings.Contains(strings.Join(env, "\n"), `=C:=C:\selected`) {
			t.Fatal("Windows drive environment was lost")
		}
	}
	for _, entry := range []string{"not-an-assignment", "=invalid", "BAD=zero\x00byte", "BIG=" + strings.Repeat("x", 257<<10)} {
		request.Environment = []string{entry}
		if _, failure := runtimeEnvironment(request); failure == nil {
			t.Fatal("invalid environment accepted")
		}
	}
	params := runtimeTestParams(t, request)
	params["unexpected"] = true
	if _, failure := decodeRuntimeRequest(params); failure == nil {
		t.Fatal("unknown runtime option accepted")
	}
	delete(params, "unexpected")
	params["version"] = float64(2)
	if _, failure := decodeRuntimeRequest(params); failure == nil {
		t.Fatal("unknown runtime version accepted")
	}
}

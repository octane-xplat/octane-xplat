package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func devServerFixture(t *testing.T, dispatch devServerDispatch) (*devServer, string, string) {
	t.Helper()
	app, cache := t.TempDir(), t.TempDir()
	server, err := startDevServer(context.Background(), cache, app, dispatch)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := server.close(); err != nil {
			t.Error(err)
		}
	})
	return server, cache, app
}

func TestDevServerLookupDoesNotCreateMissingState(t *testing.T) {
	cache, app := t.TempDir(), t.TempDir()
	if client, failure := lookupDevServer(context.Background(), cache, app); client != nil || failure == nil || failure.Code != "disconnected_runtime" {
		t.Fatal("missing server did not report disconnected", failure)
	}
	entries, err := os.ReadDir(cache)
	if err != nil || len(entries) != 0 {
		t.Fatal("a read created dev runtime state", entries, err)
	}
	if _, err := openDevServerStore(app, app); err == nil {
		t.Fatal("discovery was allowed inside the app")
	}
	entries, err = os.ReadDir(app)
	if err != nil || len(entries) != 0 {
		t.Fatal("rejected in-app discovery created directories", entries, err)
	}
}

func TestDevServerCanonicalAppIdentityAndWorktreeSeparation(t *testing.T) {
	cache, app, other := t.TempDir(), t.TempDir(), t.TempDir()
	first, root, err := devServerDirectory(cache, app)
	if err != nil {
		t.Fatal(err)
	}
	second, _, err := devServerDirectory(cache, other)
	if err != nil || first == second {
		t.Fatal("separate app/worktree directories shared discovery", err)
	}
	alias := filepath.Join(t.TempDir(), "alias")
	if err := os.Symlink(app, alias); err != nil {
		if runtime.GOOS == "windows" {
			t.Log("Windows symlink privilege unavailable; portable junction coverage remains separate")
			return
		}
		t.Fatal(err)
	}
	throughAlias, canonicalApp, err := devServerDirectory(cache, alias)
	if err != nil || throughAlias != first || filesystemKey(canonicalApp) != filesystemKey(root) {
		t.Fatal("symlink aliases did not converge", err)
	}
}

func TestDevServerAuthenticatesAppAndInstanceAndRejectsLaunchCommands(t *testing.T) {
	var calls atomic.Int32
	server, cache, app := devServerFixture(t, func(_ context.Context, command string, _ map[string]any) (any, *cliError) {
		calls.Add(1)
		return map[string]any{"command": command}, nil
	})
	client, failure := lookupDevServer(context.Background(), cache, app)
	if failure != nil {
		t.Fatal(failure)
	}
	data, failure := client.call(context.Background(), "targets", nil)
	if failure != nil || !bytes.Contains(data, []byte("targets")) || calls.Load() != 1 {
		t.Fatal("authenticated target request failed", string(data), failure)
	}
	for _, command := range []string{"session start", "session end", "runtime.launch", "host.shutdown", "runtime build"} {
		if _, failure := client.call(context.Background(), command, nil); failure == nil || failure.Code != "unsupported_capability" {
			t.Fatal("process ownership command was admitted", command, failure)
		}
	}
	if calls.Load() != 1 {
		t.Fatal("a launch/termination request reached app dispatch")
	}
	for _, change := range []func(*devServerRecord){
		func(record *devServerRecord) { record.Token = strings.Repeat("0", 64) },
		func(record *devServerRecord) { record.InstanceID = strings.Repeat("0", 32) },
		func(record *devServerRecord) { record.AppRoot = t.TempDir() },
	} {
		bad := *client
		change(&bad.record)
		if _, failure := bad.call(context.Background(), "targets", nil); failure == nil {
			t.Fatal("wrong token, app or startup instance was accepted")
		}
	}
	for _, origin := range []string{"http://localhost:5173", "null", ""} {
		body, _ := json.Marshal(devServerRequest{Version: 1, AppRoot: server.record.AppRoot, Command: "targets"})
		request, _ := http.NewRequest("POST", server.record.Endpoint, bytes.NewReader(body))
		request.Header.Set("Authorization", "Bearer "+server.record.Token)
		request.Header.Set("X-Octane-Dev-Instance", server.record.InstanceID)
		request.Header.Set("Origin", origin)
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}
		response.Body.Close()
		if response.StatusCode != http.StatusForbidden {
			t.Fatal("browser-origin RPC was admitted", origin)
		}
	}
	if calls.Load() != 1 {
		t.Fatal("an unauthorized request reached dispatch")
	}
	ping, failure := client.call(context.Background(), "server.ping", nil)
	if failure != nil || bytes.Contains(ping, []byte(server.record.Token)) || server.ctx.Err() != nil {
		t.Fatal("rejected requests changed server lifetime or exposed credentials", failure)
	}
	directory, _, _ := devServerDirectory(cache, app)
	if err := validatePrivateCache(directory); err != nil {
		t.Fatal(err)
	}
	if runtime.GOOS != "windows" {
		info, err := os.Stat(filepath.Join(directory, "server.json"))
		if err != nil || info.Mode().Perm() != 0600 {
			t.Fatal("discovery credential is not private", err)
		}
	}
}

func TestDevServerClientCancellationDoesNotCancelServerLifetime(t *testing.T) {
	entered, left := make(chan struct{}), make(chan struct{})
	server, cache, app := devServerFixture(t, func(ctx context.Context, _ string, _ map[string]any) (any, *cliError) {
		close(entered)
		<-ctx.Done()
		close(left)
		return nil, executionFailure(ctx.Err())
	})
	client, failure := lookupDevServer(context.Background(), cache, app)
	if failure != nil {
		t.Fatal(failure)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() { _, _ = client.call(ctx, "targets", nil); close(done) }()
	select {
	case <-entered:
	case <-time.After(time.Second):
		t.Fatal("request did not reach the existing server")
	}
	cancel()
	<-done
	select {
	case <-left:
	case <-time.After(time.Second):
		t.Fatal("disconnected request did not finish")
	}
	if server.ctx.Err() != nil {
		t.Fatal("client cancellation ended the server")
	}
	if _, failure := client.call(context.Background(), "server.ping", nil); failure != nil {
		t.Fatal("server did not survive client disconnect", failure)
	}
}

func TestDevServerClaimSurvivesConnectionShutdownUntilExplicitFinalization(t *testing.T) {
	app, cache := t.TempDir(), t.TempDir()
	ctx, cancel := context.WithCancel(context.Background())
	server, err := startDevServer(ctx, cache, app, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer server.close()
	old := server.record
	cancel()
	select {
	case <-server.served:
	case <-time.After(time.Second):
		t.Fatal("foreground cancellation did not close the HTTP listener")
	}
	if _, failure := lookupDevServer(context.Background(), cache, app); failure == nil {
		t.Fatal("dead listener was treated as a running dev server")
	}
	if duplicate, err := startDevServer(context.Background(), cache, app, nil); err == nil {
		duplicate.close()
		t.Fatal("explicit dev start bypassed a still-held lifetime claim")
	}
	if err := server.close(); err != nil {
		t.Fatal(err)
	}
	directory, _, _ := devServerDirectory(cache, app)
	if pathExists(filepath.Join(directory, "server.json")) {
		t.Fatal("finished instance retained an active discovery credential")
	}
	// A stale record is not startup authority for a read; only another explicit
	// dev start may publish a fresh instance under the same stable claim.
	data, _ := json.Marshal(old)
	if err := os.WriteFile(filepath.Join(directory, "server.json"), data, 0600); err != nil {
		t.Fatal(err)
	}
	if _, failure := lookupDevServer(context.Background(), cache, app); failure == nil {
		t.Fatal("stale discovery restarted a server")
	}
	next, err := startDevServer(context.Background(), cache, app, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer next.close()
	if old.InstanceID == next.record.InstanceID || old.Token == next.record.Token {
		t.Fatal("an explicit restart reused startup credentials")
	}
	if _, failure := lookupDevServer(context.Background(), cache, app); failure != nil {
		t.Fatal(failure)
	}
}

func TestDevServerClientRejectsRedirectsAndWrongResponseIdentity(t *testing.T) {
	var foreignCalls atomic.Int32
	foreign := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { foreignCalls.Add(1) }))
	defer foreign.Close()
	app, _ := canonical(t.TempDir())
	for _, wrongIdentity := range []bool{false, true} {
		record := devServerRecord{Protocol: devServerProtocol, Version: 1, AppRoot: app, InstanceID: identity(), Token: identity() + identity()}
		mock := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !wrongIdentity {
				http.Redirect(w, r, foreign.URL, http.StatusTemporaryRedirect)
				return
			}
			_ = json.NewEncoder(w).Encode(devServerReply{Protocol: devServerProtocol, Version: 1, AppRoot: app, InstanceID: identity(), Data: json.RawMessage(`{}`)})
		}))
		record.Endpoint = mock.URL + "/rpc"
		client := &devServerClient{record: record}
		t.Setenv("HTTP_PROXY", "http://127.0.0.1:1")
		if _, failure := client.call(context.Background(), "server.ping", nil); failure == nil {
			t.Fatal("redirect or foreign startup response was accepted")
		}
		mock.Close()
	}
	if foreignCalls.Load() != 0 {
		t.Fatal("a credential was forwarded through a redirect")
	}
}

func TestDevServerPreservesChangedDiscoveryRecord(t *testing.T) {
	cache, app := t.TempDir(), t.TempDir()
	server, err := startDevServer(context.Background(), cache, app, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer server.close()
	directory, _, _ := devServerDirectory(cache, app)
	replacement := server.record
	replacement.InstanceID = identity()
	replacement.Token = identity() + identity()
	data, _ := json.Marshal(replacement)
	if err := os.WriteFile(filepath.Join(directory, "server.json"), data, 0600); err != nil {
		t.Fatal(err)
	}
	if err := server.close(); err == nil {
		t.Fatal("changed discovery ownership was silently removed")
	}
	actual, err := os.ReadFile(filepath.Join(directory, "server.json"))
	if err != nil || !bytes.Equal(actual, data) {
		t.Fatal("shutdown removed another startup's credential", err)
	}
}

func TestDevServerResponseNeverContainsItsCredential(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	body, _ := json.Marshal(devServerRequest{Version: 1, AppRoot: server.record.AppRoot, Command: "server.ping"})
	request, _ := http.NewRequest("POST", server.record.Endpoint, bytes.NewReader(body))
	request.Header.Set("Authorization", "Bearer "+server.record.Token)
	request.Header.Set("X-Octane-Dev-Instance", server.record.InstanceID)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	data, err := io.ReadAll(response.Body)
	if err != nil || response.StatusCode != 200 || bytes.Contains(data, []byte(server.record.Token)) {
		t.Fatal("public reply exposed a credential or failed", err)
	}
}

func TestDevServerWorkspaceSelectionAcceptsPortablePathSeparators(t *testing.T) {
	root := t.TempDir()
	for _, name := range []string{"one", "two"} {
		app := filepath.Join(root, "apps", name)
		if err := os.MkdirAll(app, 0700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(app, "package.json"), []byte(`{"name":"same-name","xplat":{"targets":{"web":{}}}}`), 0600); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(root, "package.json"), []byte(`{"name":"workspace","workspaces":["apps/*"]}`), 0600); err != nil {
		t.Fatal(err)
	}
	app, err := selectedDevApp(map[string]any{"project": root, "app": "apps/one"})
	expected, canonicalErr := canonical(filepath.Join(root, "apps", "one"))
	if err != nil || canonicalErr != nil || filesystemKey(app.Root) != filesystemKey(expected) {
		t.Fatal("portable explicit app path did not select exact app", app, err, canonicalErr)
	}
	if _, err := selectedDevApp(map[string]any{"project": root}); err == nil {
		t.Fatal("ambiguous workspace selected implicitly")
	}
}

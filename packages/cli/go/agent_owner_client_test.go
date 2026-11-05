package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestAgentOwnerLookupNeverCreatesMissingState(t *testing.T) {
	parent, project := t.TempDir(), t.TempDir()
	directory, err := agentOwnerDirectory(parent, project)
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		client, failure := lookupAgentOwner(context.Background(), parent, project)
		if client != nil || failure != nil {
			t.Fatal("missing namespace invented an owner", failure)
		}
	}
	if pathExists(filepath.Dir(directory)) {
		t.Fatal("read-only lookup created native cache state")
	}
	if err = preparePrivateCache(filepath.Dir(directory)); err != nil {
		t.Fatal(err)
	}
	if err = preparePrivateCache(directory); err != nil {
		t.Fatal(err)
	}
	entries, err := os.ReadDir(directory)
	if err != nil {
		t.Fatal(err)
	}
	if client, failure := lookupAgentOwner(context.Background(), parent, project); client != nil || failure != nil {
		t.Fatal("empty namespace invented an owner", failure)
	}
	after, err := os.ReadDir(directory)
	if err != nil || len(after) != len(entries) {
		t.Fatal("read-only lookup mutated an empty namespace")
	}
	if client, failure := lookupAgentOwner(context.Background(), project, project); client != nil || failure == nil {
		t.Fatal("in-project native cache accepted")
	}
	if pathExists(filepath.Join(project, "owner-go-v1")) {
		t.Fatal("rejected in-project lookup left side effects")
	}
}
func TestAgentOwnerClientAuthenticatesWithoutProxyAndObservesRetirement(t *testing.T) {
	f := startAgentOwnerFixture(t, 2*time.Second, nil)
	t.Setenv("HTTP_PROXY", "http://127.0.0.1:1")
	t.Setenv("http_proxy", "http://127.0.0.1:1")
	client, failure := connectAgentOwnerAt(context.Background(), f.directory, f.project)
	if failure != nil || client == nil {
		t.Fatal("direct authenticated owner lookup failed", failure)
	}
	data, failure := client.call(context.Background(), "host.ping", nil)
	if failure != nil || !strings.Contains(string(data), `"implementation":"go"`) {
		t.Fatal("native owner ping unavailable", failure)
	}
	if _, failure = client.call(context.Background(), "host.shutdown", nil); failure != nil {
		t.Fatal(failure)
	}
	if err := awaitAgentOwner(t, f); err != nil {
		t.Fatal(err)
	}
	if _, failure = client.call(context.Background(), "host.ping", nil); failure == nil || failure.Code != "disconnected_runtime" {
		t.Fatal("cached generation revived a retired owner", failure)
	}
	if client, failure := connectAgentOwnerAt(context.Background(), f.directory, f.project); client != nil || failure != nil {
		t.Fatal("retired descriptor was recreated", failure)
	}
}
func TestAgentOwnerClientRejectsUntrustedEndpointsAndDescriptorIdentity(t *testing.T) {
	project, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	good := agentOwnerDescriptor{Protocol: "octane-agent-owner", Version: agentOwnerProtocolVersion, Generation: identity(), Token: identity() + identity(), Project: project, Address: "http://127.0.0.1:12345/rpc", PID: 1, State: "running"}
	for _, address := range []string{"https://127.0.0.1:12345/rpc", "http://localhost:12345/rpc", "http://127.0.0.2:12345/rpc", "http://[::1]:12345/rpc", "http://127.0.0.1:0/rpc", "http://127.0.0.1:65536/rpc", "http://127.0.0.1:0123/rpc", "http://user@127.0.0.1:12345/rpc", "http://127.0.0.1:12345/other", "http://127.0.0.1:12345/rpc?", "http://127.0.0.1:12345/rpc#fragment"} {
		bad := good
		bad.Address = address
		if validateAgentOwnerDescriptor(bad, project) == nil {
			t.Fatalf("untrusted native owner endpoint accepted: %s", address)
		}
	}
	if err := validateAgentOwnerDescriptor(good, project); err != nil {
		t.Fatal(err)
	}
	good.Generation = ""
	if validateAgentOwnerDescriptor(good, project) == nil {
		t.Fatal("missing generation accepted")
	}
	good.Generation = identity()
	good.Token = "short"
	if validateAgentOwnerDescriptor(good, project) == nil {
		t.Fatal("weak bearer accepted")
	}
	good.Token = identity() + identity()
	if validateAgentOwnerDescriptor(good, filepath.Dir(project)) == nil {
		t.Fatal("wrong project accepted")
	}
}
func TestAgentOwnerClientDoesNotFollowRedirectOrAcceptForgedGeneration(t *testing.T) {
	var hits atomic.Int32
	destination := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { hits.Add(1); w.WriteHeader(200) }))
	defer destination.Close()
	project, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	descriptor := agentOwnerDescriptor{Protocol: "octane-agent-owner", Version: agentOwnerProtocolVersion, Generation: identity(), Token: identity() + identity(), Project: project, PID: 1, State: "running"}
	var forged atomic.Bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !forged.Load() {
			http.Redirect(w, r, destination.URL, http.StatusFound)
			return
		}
		json.NewEncoder(w).Encode(map[string]any{"ok": true, "generation": "wrong", "data": map[string]any{}})
	}))
	defer server.Close()
	descriptor.Address = server.URL + "/rpc"
	client := &agentOwnerClient{descriptor: descriptor}
	if _, failure := client.call(context.Background(), "host.ping", nil); failure == nil {
		t.Fatal("redirect followed")
	}
	if hits.Load() != 0 {
		t.Fatal("native owner redirected its bearer to a second service")
	}
	// The first handler completed before changing this test-only response mode.
	forged.Store(true)
	if _, failure := client.call(context.Background(), "host.ping", nil); failure == nil {
		t.Fatal("forged reply generation accepted")
	}
}
func TestAgentOwnerClientCancellationDoesNotBecomeDisconnection(t *testing.T) {
	project, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	ready := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(200)
		w.(http.Flusher).Flush()
		close(ready)
		<-r.Context().Done()
	}))
	defer server.Close()
	client := &agentOwnerClient{descriptor: agentOwnerDescriptor{Protocol: "octane-agent-owner", Version: agentOwnerProtocolVersion, Generation: identity(), Token: identity() + identity(), Project: project, Address: server.URL + "/rpc", PID: 1, State: "running"}}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan *cliError, 1)
	go func() { _, failure := client.call(ctx, "host.ping", nil); done <- failure }()
	select {
	case <-ready:
	case <-time.After(2 * time.Second):
		t.Fatal("owner HTTP fixture never produced headers")
	}
	cancel()
	select {
	case failure := <-done:
		if failure == nil || failure.Code != "cancelled" {
			t.Fatal("cancellation changed into disconnection", failure)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("owner HTTP cancellation did not complete")
	}
}

func TestAgentOwnerClientBoundsRepliesAndPreservesStructuredErrors(t *testing.T) {
	project, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	descriptor := agentOwnerDescriptor{Protocol: "octane-agent-owner", Version: agentOwnerProtocolVersion, Generation: identity(), Token: identity() + identity(), Project: project, PID: 1, State: "running"}
	var large atomic.Bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if large.Load() {
			json.NewEncoder(w).Encode(map[string]any{"ok": true, "generation": descriptor.Generation, "data": strings.Repeat("x", 16<<20)})
		} else {
			json.NewEncoder(w).Encode(map[string]any{"ok": false, "generation": descriptor.Generation, "error": map[string]any{"code": "target_busy", "message": "Owned target is occupied.", "retryable": true, "context": map[string]any{"sessionId": "sess-owned"}}})
		}
	}))
	defer server.Close()
	descriptor.Address = server.URL + "/rpc"
	client := &agentOwnerClient{descriptor: descriptor}
	_, failure := client.call(context.Background(), "operation", nil)
	if failure == nil || failure.Code != "target_busy" || failure.Retryable == nil || !*failure.Retryable || object(failure.Context)["sessionId"] != "sess-owned" {
		t.Fatal("structured native owner failure lost contract fields", failure)
	}
	large.Store(true)
	if _, failure = client.call(context.Background(), "operation", nil); failure == nil || failure.Code != "disconnected_runtime" {
		t.Fatal("oversized native owner reply accepted", failure)
	}
}

package main

import (
	"context"
	"encoding/json"
	"github.com/coder/websocket"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestDevAppActionSourceStacks(t *testing.T) {
	service := newDevActions(&devServer{apps: newDevAppHub()})
	peer := &devAppPeer{target: "web"}
	grant := &devAppGrant{Token: "app-token", InstanceID: "start", TargetID: "web", origins: map[string]bool{}}
	service.server.apps.grants["web"] = grant
	raw := []json.RawMessage{json.RawMessage(`{"stack":"raw stack","sourceStack":"untrusted"}`)}
	hit := 0
	engine := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hit++
		if r.URL.Path != "/__xplat_dev__/stacks" || r.Header.Get("X-Xplat-Dev-Token") != "app-token" {
			t.Error("invalid engine request")
		}
		json.NewEncoder(w).Encode(map[string]any{"version": 1, "instanceId": "start", "targetId": "web", "sourceStacks": []string{"src/action.ts:2:1"}})
	}))
	defer engine.Close()
	grant.origins[engine.URL] = true
	failures, status := service.resolveFailureStacks(context.Background(), peer, raw)
	if status != "vite-current" || !strings.Contains(string(failures[0]), "src/action.ts:2:1") || hit != 1 {
		t.Fatalf("%s %s %d", status, failures, hit)
	}
	grant.InstanceID = "stale"
	failures, status = service.resolveFailureStacks(context.Background(), peer, raw)
	if status != "runtime-raw" || strings.Contains(string(failures[0]), "sourceStack") {
		t.Fatalf("stale source admitted: %s %s", status, failures)
	}
}

func TestDevAppActionSourceStacksFallbackAndOrigins(t *testing.T) {
	for _, origin := range []string{"http://example.com:80", "http://127.0.0.1:80/path", "http://user@127.0.0.1:80", "http://127.0.0.1:80?x=y", "file:///tmp/stack", "http://localhost"} {
		if stackOrigin(origin) != nil {
			t.Errorf("accepted %s", origin)
		}
	}
	for _, origin := range []string{"http://localhost:80", "http://127.0.0.1:80", "http://[::1]:80"} {
		if stackOrigin(origin) == nil {
			t.Errorf("rejected %s", origin)
		}
	}
	service := newDevActions(&devServer{apps: newDevAppHub()})
	peer := &devAppPeer{target: "web"}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	service.server.apps.grants["web"] = &devAppGrant{origins: map[string]bool{"http://127.0.0.1:1": true}}
	before := time.Now()
	failures, status := service.resolveFailureStacks(ctx, peer, []json.RawMessage{json.RawMessage(`{"stack":"raw","sourceStack":"untrusted"}`)})
	if status != "runtime-raw" || strings.Contains(string(failures[0]), "sourceStack") || time.Since(before) > time.Second {
		t.Fatalf("fallback lost: %s %s", status, failures)
	}
}

func TestDevAppActionSourceEnrichmentPreservesConfirmedFailure(t *testing.T) {
	server, client, conn, instance := devActionsFixture(t, devActionPolicy{Allowed: true, TimeoutMs: 30000})
	engine := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{"version": 1, "instanceId": server.record.InstanceID, "targetId": "web", "sourceStacks": []string{"at handler (src/action.ts:2:1)"}})
	}))
	defer engine.Close()
	server.apps.allowOrigin("web", engine.URL)
	accepted, failure := callAction(t, client, instance, "mapped-once")
	if failure != nil {
		t.Fatal(failure)
	}
	_ = appSocketRead(t, conn)
	outcome := devActionOutcome{RequestID: accepted["requestId"].(string), Status: "failed", Error: mustJSON(map[string]any{"code": "execution_failure", "message": "handler failed", "failures": []any{map[string]any{"stack": "at handler (raw)", "message": "handler failed"}}}), PartialEffects: []string{"local effect completed"}, CompletedAt: isoNow()}
	if err := conn.Write(context.Background(), websocket.MessageText, mustJSON(map[string]any{"type": "outcome", "outcome": outcome})); err != nil {
		t.Fatal(err)
	}
	job := actionTerminal(t, client, accepted["job"].(map[string]any)["jobId"].(string))
	if job.State != "failed" || !strings.Contains(string(job.Error), `"stackResolution":"vite-current"`) || !strings.Contains(string(job.Error), "local effect completed") || !strings.Contains(string(job.Error), "at handler (raw)") {
		t.Fatal("enrichment changed primary failure", job.State, string(job.Error))
	}
}

func TestDevAppActionSourceNoRedirectAndBoundedWait(t *testing.T) {
	service := newDevActions(&devServer{apps: newDevAppHub()})
	peer := &devAppPeer{target: "web"}
	grant := &devAppGrant{origins: map[string]bool{}}
	service.server.apps.grants["web"] = grant
	destination := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { t.Error("source-map credential followed redirect") }))
	defer destination.Close()
	redirect := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, destination.URL, http.StatusTemporaryRedirect)
	}))
	defer redirect.Close()
	grant.origins[redirect.URL] = true
	raw := []json.RawMessage{json.RawMessage(`{"stack":"raw"}`)}
	_, status := service.resolveFailureStacks(context.Background(), peer, raw)
	if status != "runtime-raw" {
		t.Fatal(status)
	}
	observed := make(chan struct{})
	release := make(chan struct{})
	slow := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.Copy(io.Discard, r.Body)
		select {
		case <-r.Context().Done():
			close(observed)
		case <-release:
		}
	}))
	defer slow.Close()
	defer close(release)
	grant.origins = map[string]bool{slow.URL: true}
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()
	_, status = service.resolveFailureStacks(ctx, peer, raw)
	if status != "runtime-raw" {
		t.Fatal(status)
	}
	select {
	case <-observed:
	case <-time.After(time.Second):
		t.Fatal("source-map request was left running")
	}
}

package main

import (
	"context"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func runtimeSessionsFixture(t *testing.T) (*agentOwner, *runtimeSessions, appIdentity) {
	t.Helper()
	owner, app := runtimeRPCFixture(t)
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("LOCALAPPDATA", filepath.Join(home, "cache"))
	t.Setenv("XDG_CACHE_HOME", filepath.Join(home, "cache"))
	owner.descriptor.Generation = identity()
	owner.cacheParent = t.TempDir()
	owner.sessions = newRuntimeSessions(owner)
	t.Cleanup(func() {
		owner.stop()
		owner.operations.Wait()
		owner.sessions.mu.Lock()
		defer owner.sessions.mu.Unlock()
		for _, project := range owner.sessions.projects {
			_ = project.release(true)
		}
	})
	return owner, owner.sessions, app
}

func TestAgentOwnerSessionsClaimBeforeLaunchAndAwaitConcurrentEnd(t *testing.T) {
	owner, registry, app := runtimeSessionsFixture(t)
	ready, cleanup := make(chan struct{}), make(chan struct{})
	var release sync.Once
	defer release.Do(func() { close(cleanup) })
	run := func(ctx context.Context, entry *runtimeSessionEntry, report func(runtimeLaunch, string)) error {
		select {
		case <-ready:
			report(runtimeLaunch{Phase: "ready", Readiness: "fixture"}, "ready")
		case <-ctx.Done():
		}
		<-ctx.Done()
		<-cleanup
		return ctx.Err()
	}
	target := devTarget{Kind: "web", ID: "web", Name: "web"}
	var callers sync.WaitGroup
	ids := make(chan string, 32)
	for range 32 {
		callers.Go(func() {
			result, failure := registry.start(app, target, "same", run)
			if failure != nil {
				t.Error(failure)
				return
			}
			ids <- stringValue(result.(map[string]any)["session"].(map[string]any)["sessionId"])
		})
	}
	callers.Wait()
	close(ids)
	id := ""
	for next := range ids {
		if id != "" && next != id {
			t.Fatal("duplicate target admission")
		}
		id = next
	}
	if id == "" {
		t.Fatal("missing session")
	}
	if _, failure := registry.start(app, target, "different", run); failure == nil || failure.Code != "target_busy" {
		t.Fatal("different pending request was not busy")
	}
	if len(registry.claims(app)) != 1 || owner.retireIdle(0) {
		t.Fatal("starting session did not retain ownership")
	}
	foreign := app
	foreign.ID = "other"
	if _, failure := registry.status(foreign, id); failure == nil || failure.Code != "not_found" {
		t.Fatal("foreign app observed session")
	}
	close(ready)
	for range 8 {
		callers.Go(func() {
			result, failure := registry.end(context.Background(), app, id)
			if failure != nil {
				t.Error(failure)
				return
			}
			if result.(map[string]any)["result"].(map[string]any)["ended"] != true {
				t.Error("end not confirmed")
			}
		})
	}
	time.Sleep(20 * time.Millisecond)
	if len(registry.claims(app)) != 1 {
		t.Fatal("claim freed while cleanup was pending")
	}
	release.Do(func() { close(cleanup) })
	callers.Wait()
	if len(registry.claims(app)) != 0 {
		t.Fatal("confirmed cleanup retained target")
	}
	result, failure := registry.status(app, id)
	if failure != nil {
		t.Fatal(failure)
	}
	record := result.(map[string]any)["session"].(map[string]any)
	if record["state"] != "stopped" || record["cleanupConfirmed"] != true || record["endedAt"] == nil {
		t.Fatal("terminal metadata preceded awaited cleanup")
	}
	if _, failure := registry.end(context.Background(), app, id); failure != nil {
		t.Fatal("end was not idempotent", failure)
	}
}

func TestAgentOwnerSessionsUnknownCleanupPreventsReplacement(t *testing.T) {
	owner, registry, app := runtimeSessionsFixture(t)
	target := devTarget{Kind: "web", ID: "web", Name: "web"}
	started := make(chan struct{})
	result, failure := registry.start(app, target, "", func(ctx context.Context, entry *runtimeSessionEntry, report func(runtimeLaunch, string)) error {
		close(started)
		<-ctx.Done()
		return &runtimeSessionCleanupError{Err: &cliError{Code: "execution_failure", Message: "injected unconfirmed resource", Context: map[string]any{"resource": "fixture"}}}
	})
	if failure != nil {
		t.Fatal(failure)
	}
	<-started
	id := stringValue(result.(map[string]any)["session"].(map[string]any)["sessionId"])
	if _, failure := registry.end(context.Background(), app, id); failure == nil {
		t.Fatal("unknown cleanup reported success")
	} else if details, ok := failure.Context.(map[string]any); !ok || details["resource"] != "fixture" {
		t.Fatal("cleanup discarded provider diagnostics", failure)
	}
	if _, failure := registry.start(app, target, "new", func(context.Context, *runtimeSessionEntry, func(runtimeLaunch, string)) error { return nil }); failure == nil || failure.Code != "target_busy" {
		t.Fatal("failed state freed an unconfirmed target")
	}
	owner.mu.Lock()
	unknown := owner.cleanupErr
	owner.mu.Unlock()
	if unknown == nil {
		t.Fatal("owner lost cleanup failure")
	}
}

func TestAgentOwnerSessionHistoryLookupDoesNotCreateState(t *testing.T) {
	_, _, app := runtimeSessionsFixture(t)
	parent := t.TempDir()
	store, err := lookupRuntimeHistory(parent, app.Root)
	if err != nil || store != nil {
		t.Fatal("missing history lookup was not empty", err)
	}
	if pathExists(parent + "/history-go-v1") {
		t.Fatal("history read created state")
	}
}

func TestAgentOwnerProjectCleanupWitnessSurvivesReleasedLease(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("LOCALAPPDATA", filepath.Join(home, "cache"))
	t.Setenv("XDG_CACHE_HOME", filepath.Join(home, "cache"))
	project := t.TempDir()
	release, err := lockOwnedProjectOutputs(project, identity())
	if err != nil {
		t.Fatal(err)
	}
	if err = release(false); err != nil {
		t.Fatal(err)
	}
	if next, err := lockProjectOutputs(project); err == nil {
		next()
		t.Fatal("released kernel lease erased unconfirmed cleanup")
	} else if !strings.Contains(err.Error(), "did not confirm") {
		t.Fatal(err)
	}
	confirmed := t.TempDir()
	finish, err := lockOwnedProjectOutputs(confirmed, identity())
	if err != nil {
		t.Fatal(err)
	}
	if err = finish(true); err != nil {
		t.Fatal(err)
	}
	next, err := lockProjectOutputs(confirmed)
	if err != nil {
		t.Fatal("confirmed project could not be reused", err)
	}
	next()
}

func TestAgentOwnerSessionExitAfterReadinessPreservesFailure(t *testing.T) {
	for _, test := range []struct {
		name, state string
		failure     error
	}{
		{name: "clean", state: "disconnected"},
		{name: "engine failure", state: "failed", failure: &cliError{Code: "execution_failure", Message: "engine exited 23", Context: map[string]any{"exitCode": 23}}},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, registry, app := runtimeSessionsFixture(t)
			result, failure := registry.start(app, devTarget{Kind: "web", ID: "web", Name: "web"}, "", func(ctx context.Context, entry *runtimeSessionEntry, report func(runtimeLaunch, string)) error {
				report(runtimeLaunch{Phase: "ready", Readiness: "fixture"}, "ready")
				return test.failure
			})
			if failure != nil {
				t.Fatal(failure)
			}
			id := stringValue(result.(map[string]any)["session"].(map[string]any)["sessionId"])
			registry.mu.Lock()
			entry := registry.entries[id]
			registry.mu.Unlock()
			select {
			case <-entry.done:
			case <-time.After(5 * time.Second):
				t.Fatal("session completion stalled")
			}
			registry.mu.Lock()
			record := entry.record
			registry.mu.Unlock()
			if record.State != test.state || !record.CleanupConfirmed {
				t.Fatalf("unexpected terminal record: %+v", record)
			}
			if test.failure != nil {
				if record.Launch == nil || record.Launch.Error == nil || record.Launch.Error.Message != "engine exited 23" {
					t.Fatal("engine failure lost", record)
				}
				details, ok := record.Launch.Error.Context.(map[string]any)
				if !ok || details["exitCode"] != 23 {
					t.Fatal("engine diagnostics lost", record.Launch.Error)
				}
			}
		})
	}
}

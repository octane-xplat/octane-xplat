package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// A one-shot native client fixture. The server is the actual public CLI's
// hidden owner entry, not this test executable or a Node runtime wrapper.
func TestAgentOwnerBootstrapFixture(t *testing.T) {
	if os.Getenv("XPLAT_GO_OWNER_FIXTURE") != "1" {
		t.Skip("subprocess fixture")
	}
	project, cache, invoked := os.Getenv("XPLAT_GO_OWNER_PROJECT"), os.Getenv("XPLAT_GO_OWNER_CACHE"), os.Getenv("XPLAT_GO_OWNER_BINARY")
	ctx, stop := cliSignalContext(context.Background())
	defer stop()
	emit := func(value any) { json.NewEncoder(os.Stdout).Encode(value) }
	phase := func(name string) func(*agentOwnerClient) {
		return func(client *agentOwnerClient) {
			emit(map[string]any{"phase": name, "ownerPid": client.descriptor.PID, "generation": client.descriptor.Generation, "directory": client.directory})
			<-ctx.Done()
		}
	}
	var client *agentOwnerClient
	var failure *cliError
	mode := os.Getenv("XPLAT_GO_OWNER_MODE")
	if mode == "start" {
		hooks := ownerStartupHooks{}
		if os.Getenv("XPLAT_GO_OWNER_PAUSE") == "before" {
			hooks.BeforeHandoff = phase("before-handoff")
		}
		if os.Getenv("XPLAT_GO_OWNER_PAUSE") == "after" {
			hooks.AfterHandoff = phase("after-handoff")
		}
		client, failure = ensureAgentOwner(ctx, cache, project, invoked, hooks)
	} else if mode == "collect" {
		directory, err := agentOwnerDirectory(cache, project)
		if err != nil {
			failure = executionFailure(err)
		} else if err = validatePrivateCache(directory); err != nil && !os.IsNotExist(err) {
			failure = executionFailure(err)
		} else if err == nil {
			root, err := os.OpenRoot(directory)
			if err != nil {
				failure = executionFailure(err)
			} else {
				release, err := lockCache(ctx, root, "bootstrap.lock")
				if err == nil {
					err = pruneOwnerStages(ctx, root, directory, project)
					release()
				}
				root.Close()
				if err != nil {
					failure = executionFailure(err)
				}
			}
		}
	} else {
		client, failure = lookupAgentOwner(ctx, cache, project)
	}
	if failure != nil {
		emit(map[string]any{"ok": false, "error": failure})
		os.Exit(errorExit(failure))
	}
	if client == nil {
		emit(map[string]any{"ok": true, "owner": nil})
		os.Exit(0)
	}
	method := os.Getenv("XPLAT_GO_OWNER_METHOD")
	if method == "" {
		method = "host.ping"
	}
	data, failure := client.call(ctx, method, nil)
	if failure != nil {
		emit(map[string]any{"ok": false, "error": failure})
		os.Exit(errorExit(failure))
	}
	value := map[string]any{"ok": true, "ownerPid": client.descriptor.PID, "generation": client.descriptor.Generation, "adopted": client.adopted, "directory": client.directory, "data": data}
	if os.Getenv("XPLAT_GO_OWNER_READ_STDIN") == "1" {
		bytes, err := io.ReadAll(io.LimitReader(os.Stdin, 256))
		if err != nil {
			emit(map[string]any{"ok": false, "message": err.Error()})
			os.Exit(1)
		}
		value["stdin"] = string(bytes)
	}
	emit(value)
	os.Exit(0)
}
func TestAgentOwnerDoesNotAdmitResourcesBeforeHandoff(t *testing.T) {
	adopted := make(chan struct{})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	owner := &agentOwner{ctx: ctx, cancel: cancel, handoff: adopted}
	if _, _, err := owner.admit(); err == nil {
		t.Fatal("resource admission preceded startup handoff")
	}
	close(adopted)
	_, finish, err := owner.admit()
	if err != nil {
		t.Fatal(err)
	}
	finish(nil)
	owner.stop()
	owner.operations.Wait()
}
func TestAgentOwnerStageCollectionRequiresAdoptionCleanupEvidence(t *testing.T) {
	project, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	directory, err := privateDirectory(t.TempDir(), "owner-cache-")
	if err != nil {
		t.Fatal(err)
	}
	root, err := os.OpenRoot(directory)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	id := identity()
	run := filepath.Join(directory, "launch-"+id)
	if err = preparePrivateCache(run); err != nil {
		t.Fatal(err)
	}
	stage, err := os.OpenRoot(run)
	if err != nil {
		t.Fatal(err)
	}
	defer stage.Close()
	helper := "native-helper-" + id + ".exe"
	if err = privateFile(filepath.Join(run, helper), []byte("fixture-owned-stage")); err != nil {
		t.Fatal(err)
	}
	digest, err := nativeExecutableSHA(filepath.Join(run, helper))
	if err != nil {
		t.Fatal(err)
	}
	request := ownerLaunch{Version: 1, Project: project, LaunchID: id, CLIVersion: metadata.Version, Helper: helper, BinarySHA256: digest, IdleMillis: 1000, ImageReady: true}
	if err = writeOwnerLaunch(stage, request); err != nil {
		t.Fatal(err)
	}
	if err = privateFile(filepath.Join(run, "adopted"), []byte(id)); err != nil {
		t.Fatal(err)
	}
	if err = pruneOwnerStages(context.Background(), root, directory, project); err == nil {
		t.Fatal("adopted stage erased without cleanup evidence")
	}
	if !pathExists(filepath.Join(run, helper)) {
		t.Fatal("unconfirmed executable removed")
	}
	request.CleanupConfirmed = true
	if err = writeOwnerLaunch(stage, request); err != nil {
		t.Fatal(err)
	}
	if err = privateFile(filepath.Join(run, "user-notes"), []byte("preserve me")); err != nil {
		t.Fatal(err)
	}
	if err = pruneOwnerStages(context.Background(), root, directory, project); err == nil {
		t.Fatal("unknown stage file was implicitly authorized")
	}
	if bytes, err := os.ReadFile(filepath.Join(run, "user-notes")); err != nil || string(bytes) != "preserve me" {
		t.Fatal("unrelated stage contents changed")
	}
	os.Remove(filepath.Join(run, "user-notes"))
	stage.Close()
	if err = pruneOwnerStages(context.Background(), root, directory, project); err != nil {
		t.Fatal(err)
	}
	if pathExists(run) {
		t.Fatal("confirmed retired stage was not reclaimed")
	}
}
func TestAgentOwnerAbandonedCopyCannotBeReplayed(t *testing.T) {
	project, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	directory, err := privateDirectory(t.TempDir(), "owner-cache-")
	if err != nil {
		t.Fatal(err)
	}
	root, err := os.OpenRoot(directory)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	id := identity()
	run := filepath.Join(directory, "launch-"+id)
	if err = preparePrivateCache(run); err != nil {
		t.Fatal(err)
	}
	stage, err := os.OpenRoot(run)
	if err != nil {
		t.Fatal(err)
	}
	request := ownerLaunch{Version: 1, Project: project, LaunchID: id, CLIVersion: metadata.Version, Helper: "native-helper-" + id + ".exe", BinarySHA256: strings.Repeat("a", 64), IdleMillis: 1000}
	if err = writeOwnerLaunch(stage, request); err != nil {
		t.Fatal(err)
	}
	privateFile(filepath.Join(run, request.Helper), []byte("interrupted partial image"))
	release, err := ownerStageLease(stage)
	if err != nil {
		t.Fatal(err)
	}
	if err = pruneOwnerStages(context.Background(), root, directory, project); err == nil {
		t.Fatal("active startup claim bypassed")
	}
	release()
	stage.Close()
	if err = pruneOwnerStages(context.Background(), root, directory, project); err != nil {
		t.Fatal(err)
	}
	if pathExists(run) {
		t.Fatal("unadopted interrupted copy accumulated")
	}
}
func TestAgentOwnerEnvironmentExcludesFirstClientGrants(t *testing.T) {
	t.Setenv("XPLAT_PERMISSIONS", "runtime-actions,visual-capture")
	t.Setenv("XPLAT_AGENT_CLIENT", "fixture-first-client")
	t.Setenv("NODE_OPTIONS", "--inspect=0")
	for _, entry := range ownerChildEnvironment() {
		for _, key := range []string{"XPLAT_PERMISSIONS", "XPLAT_AGENT_CLIENT", "NODE_OPTIONS"} {
			if strings.HasPrefix(entry, key+"=") && entry != key+"=" {
				t.Fatal(fmt.Sprintf("native owner inherited reserved %s", key))
			}
		}
	}
}

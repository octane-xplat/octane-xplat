package main

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"
)

func TestDevtoolsBackendFixture(t *testing.T) {
	if os.Getenv("XPLAT_TEST_EXTERNAL_BACKEND") != "1" {
		return
	}
	os.Exit(runCLI([]string{"devtools", "--project", os.Getenv("XPLAT_TEST_PROJECT"), "--host-backend", "backend.mjs"}))
}

func TestDevtoolsHostBackendFollowsParentPipe(t *testing.T) {
	if _, err := exec.LookPath("node"); err != nil {
		t.Skip("Node project runtime unavailable")
	}
	app, cache := t.TempDir(), t.TempDir()
	write := func(name, body string) {
		t.Helper()
		if err := os.WriteFile(filepath.Join(app, name), []byte(body), 0600); err != nil {
			t.Fatal(err)
		}
	}
	write("package.json", `{"name":"external-devtools","xplat":{"targets":{"web":{}}}}`)
	write("backend.mjs", `import { writeFileSync } from "node:fs";
const grant = JSON.parse(process.env.XPLAT_DEV_BACKEND);
if (grant.protocol !== "octane-devtools-backend" || grant.targetId !== "external" ||
    process.env.XPLAT_DEV_APP_BRIDGE || !/^ws:\/\/127\.0\.0\.1:\d+\/backend$/.test(grant.socket)) process.exit(42);
writeFileSync("backend-started", "yes");
setInterval(() => {}, 1000);`)

	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(t.Context(), 15*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, exe, "-test.run=^TestDevtoolsBackendFixture$")
	cmd.Env = append(os.Environ(), "XPLAT_TEST_EXTERNAL_BACKEND=1", "XPLAT_TEST_PROJECT="+app,
		"XPLAT_DEV_CACHE="+cache, "XPLAT_DEV_BACKEND=stale", "XPLAT_DEV_APP_BRIDGE=stale")
	lease, err := cmd.StdinPipe()
	if err != nil {
		t.Fatal(err)
	}
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()
	waited := false
	defer func() {
		_ = lease.Close()
		if !waited {
			<-done
		}
	}()
	tick := time.NewTicker(10 * time.Millisecond)
	defer tick.Stop()
wait:
	for {
		if _, err := os.Stat(filepath.Join(app, "backend-started")); err == nil {
			break wait
		}
		select {
		case err := <-done:
			waited = true
			t.Fatal("backend exited before startup", err)
		case <-ctx.Done():
			t.Fatal("backend did not start", ctx.Err())
		case <-tick.C:
		}
	}
	discovery := filepath.Join(cache, "dev-servers-v1", "*", "server.json")
	if records, err := filepath.Glob(discovery); err != nil || len(records) != 1 {
		t.Fatal("expected one discoverable live backend", err)
	}
	if err := lease.Close(); err != nil {
		t.Fatal(err)
	}
	err = <-done
	waited = true
	if err != nil {
		t.Fatal("closing the parent pipe did not stop the hub cleanly", err)
	}
	if records, err := filepath.Glob(discovery); err != nil || len(records) != 0 {
		t.Fatal("hub retained its discovery record after shutdown", err)
	}
}

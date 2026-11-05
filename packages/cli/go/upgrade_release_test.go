package main

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestReleaseWorkerRetainedWhenChildCleanupIsUnknown(t *testing.T) {
	stage := t.TempDir()
	entry := filepath.Join(stage, "worker.mjs")
	if err := os.WriteFile(entry, []byte("worker"), 0600); err != nil {
		t.Fatal(err)
	}
	helper := filepath.Join(stage, "native-helper.exe")
	if err := os.WriteFile(helper, []byte("helper"), 0700); err != nil {
		t.Fatal(err)
	}
	lease := upgradeWorkerLease{Entry: entry, Directory: stage, Helper: helper}
	result := lease.finish(&processCleanupError{Err: errors.New("fixture could not observe child")})
	var unknown *processCleanupError
	if !errors.As(result, &unknown) {
		t.Fatalf("cleanup identity lost: %v", result)
	}
	if _, err := os.Stat(entry); err != nil {
		t.Fatalf("live-child worker removed: %v", err)
	}
	if _, err := os.Stat(helper); err != nil {
		t.Fatalf("live-child helper removed: %v", err)
	}
}

func TestUpgradeHelperMatchesInvokedExecutableAndCleansWithItsLease(t *testing.T) {
	lease := upgradeWorkerLease{Directory: t.TempDir()}
	if err := stageUpgradeHelper(&lease); err != nil {
		t.Fatal(err)
	}
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	original, err := os.ReadFile(exe)
	if err != nil {
		t.Fatal(err)
	}
	copy, err := os.ReadFile(lease.Helper)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(original, copy) {
		t.Fatal("helper is not the invoked executable")
	}
	if err := lease.finish(nil); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(lease.Helper); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("completed helper lease retained: %v", err)
	}
}

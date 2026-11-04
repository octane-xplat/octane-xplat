package main

import (
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
	lease := upgradeWorkerLease{Entry: entry, Directory: stage}
	result := lease.finish(&processCleanupError{Err: errors.New("fixture could not observe child")})
	var unknown *processCleanupError
	if !errors.As(result, &unknown) {
		t.Fatalf("cleanup identity lost: %v", result)
	}
	if _, err := os.Stat(entry); err != nil {
		t.Fatalf("live-child worker removed: %v", err)
	}
}

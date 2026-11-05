//go:build windows

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"golang.org/x/sys/windows"
)

func exclusiveTestFile(t *testing.T, path string) func() {
	t.Helper()
	name, err := windows.UTF16PtrFromString(path)
	if err != nil {
		t.Fatal(err)
	}
	handle, err := windows.CreateFile(name, windows.GENERIC_WRITE, 0, nil, windows.CREATE_NEW, windows.FILE_ATTRIBUTE_NORMAL, 0)
	if err != nil {
		t.Fatal(err)
	}
	var once sync.Once
	close := func() { once.Do(func() { _ = windows.CloseHandle(handle) }) }
	t.Cleanup(close)
	return close
}

func TestWindowsSharingProfileCleanupAndServiceObservation(t *testing.T) {
	t.Run("profile waits for sharing release", func(t *testing.T) {
		profile := filepath.Join(t.TempDir(), "profile")
		if err := os.Mkdir(profile, 0700); err != nil {
			t.Fatal(err)
		}
		close := exclusiveTestFile(t, filepath.Join(profile, "database"))
		done := make(chan error, 1)
		go func() { done <- removeRuntimeBrowserProfile(profile) }()
		select {
		case err := <-done:
			t.Fatalf("cleanup returned before exclusive handle release: %v", err)
		case <-time.After(100 * time.Millisecond):
		}
		close()
		select {
		case err := <-done:
			if err != nil || pathExists(profile) {
				t.Fatal("profile cleanup did not complete", err)
			}
		case <-time.After(5 * time.Second):
			t.Fatal("profile cleanup did not join")
		}
	})
	t.Run("startup sharing is pending, malformed JSON is not", func(t *testing.T) {
		root := t.TempDir()
		path := filepath.Join(root, "service.json")
		close := exclusiveTestFile(t, path)
		if ready, err := readServiceStart(path, "request", root, "workshop-dev", "web"); ready || err != nil {
			t.Fatal("exclusive publication was treated as evidence or failure", ready, err)
		}
		close()
		frame := serviceStart{Protocol: "octane-project-service", Version: 1, ID: "request", Project: root, Operation: "workshop-dev", Target: "web", Kind: "web-listening", URL: "http://localhost:5173/"}
		data, _ := json.Marshal(frame)
		if err := os.WriteFile(path, data, 0600); err != nil {
			t.Fatal(err)
		}
		if ready, err := readServiceStart(path, "request", root, "workshop-dev", "web"); !ready || err != nil {
			t.Fatal("published startup evidence was not readable", ready, err)
		}
		if err := os.WriteFile(path, []byte("{"), 0600); err != nil {
			t.Fatal(err)
		}
		if _, err := readServiceStart(path, "request", root, "workshop-dev", "web"); err == nil {
			t.Fatal("sharing retry hid malformed JSON")
		}
	})
}

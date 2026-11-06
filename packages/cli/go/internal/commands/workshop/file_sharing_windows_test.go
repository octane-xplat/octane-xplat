//go:build windows

package workshop

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"testing"

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

func TestWindowsSharingServiceObservation(t *testing.T) {
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

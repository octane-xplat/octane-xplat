//go:build windows

package history

import (
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

func TestWindowsRetainedLogReadRetriesSharingWithoutHidingPersistentFailure(t *testing.T) {
	path := t.TempDir()
	root, err := os.OpenRoot(path)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	close := exclusiveTestFile(t, filepath.Join(path, "previous.jsonl"))
	if _, err := historyLogFile(root, "previous.jsonl"); err == nil {
		t.Fatal("persistent exclusive access became a successful empty log")
	}
	close()
	if _, err := historyLogFile(root, "previous.jsonl"); err != nil {
		t.Fatal("log read did not recover after sharing release", err)
	}
}

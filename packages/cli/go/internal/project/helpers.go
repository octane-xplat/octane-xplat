package project

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
)

type WorkspaceMutationError struct {
	Operation, Root string
	Hint            string
	Err             error
}

func WorkspaceStartDirectory(root string) (string, error) {
	if root != "" && root != "." {
		return filepath.Abs(root)
	}
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for at := cwd; ; at = filepath.Dir(at) {
		if osfs.PathExists(filepath.Join(at, "package.json")) {
			return at, nil
		}
		if filepath.Dir(at) == at {
			return cwd, nil
		}
	}
}
func (e *WorkspaceMutationError) RequiresFailureEvidence() bool { return true }
func (e *WorkspaceMutationError) Error() string {
	hint := e.Hint
	if hint == "" {
		hint = "Inspect changes and rerun patches check"
	}
	return fmt.Sprintf("%s failed; workspace files may have changed in %s. %s: %v", e.Operation, e.Root, hint, e.Err)
}
func (e *WorkspaceMutationError) Unwrap() error { return e.Err }

type ToolExit struct{ Code int }

func (err *ToolExit) Error() string { return fmt.Sprintf("project tool exited %d", err.Code) }

func DiagnosticEnvironment() []string {
	result := []string{}
	for _, entry := range os.Environ() {
		key, _, _ := strings.Cut(entry, "=")
		if !strings.EqualFold(key, "NODE_PATH") && !strings.EqualFold(key, "NODE_OPTIONS") && !strings.EqualFold(key, "COREPACK_ENABLE_NETWORK") && !strings.EqualFold(key, "COREPACK_ENABLE_DOWNLOAD_PROMPT") {
			result = append(result, entry)
		}
	}
	// Prerequisite inspection must not let a package-manager shim install itself.
	return append(result, "NODE_PATH=", "NODE_OPTIONS=", "COREPACK_ENABLE_NETWORK=0", "COREPACK_ENABLE_DOWNLOAD_PROMPT=0")
}

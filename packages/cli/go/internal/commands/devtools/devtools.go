// `xplat devtools` launches the native macOS devtools app through the selected
// project's @octane-xplat/devtools desktop launcher — one AppKit window per
// live `xplat dev` server record. Go owns app selection, the worker process
// group and startup-evidence observation; the project's @octane-xplat/cli
// worker resolves the launcher and engine inside the app's installation.
package devtools

import (
	"context"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/service"
	"os"
	"runtime"
	"time"
)

// hostGOOS is a variable so tests can exercise the unsupported-host branch.
var hostGOOS = runtime.GOOS

// runWorker is a variable so tests can stub the service worker boundary.
var runWorker = service.RunWorker

func Command(ctx context.Context, values map[string]any) error {
	if hostGOOS != "darwin" {
		return &cli.Error{
			Code:    "unsupported_capability",
			Message: "xplat devtools launches the native macOS devtools app; only a macOS host can run it.",
		}
	}
	workspace, err := project.NewWorkspaceContext(values)
	if err != nil {
		return err
	}
	selection := workspace.Selection()
	if selection.State != "bound" {
		return errors.New("devtools requires a selected app; pass --app at an ambiguous workspace root")
	}
	projectPath, err := osfs.Canonical(selection.App.Root)
	if err != nil {
		return err
	}
	if _, err = project.Manifest(projectPath); err != nil {
		return err
	}
	worker, err := project.Worker(projectPath)
	if err != nil {
		return err
	}
	// No project-output lock: every write lands in native-owned per-run
	// directories (the worker's resource/service dir and a unique compiler
	// profile), so devtools must coexist with a live `xplat dev` in this app.
	_, err = runWorker(ctx, projectPath, worker, "devtools-desktop", "macos", map[string]any{"target": "macos"}, 5*time.Minute, proc.ForegroundInput(ctx), os.Stdout, os.Stderr)
	return err
}

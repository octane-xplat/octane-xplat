// Package devtools connects the released macOS app or a project-built panel
// host to the selected app’s development hub.
package devtools

import (
	"context"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/dev"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/service"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

// hostGOOS is a variable so tests can exercise the unsupported-host branch.
var hostGOOS = runtime.GOOS

func Command(ctx context.Context, values map[string]any) error {
	backend, host := values["host-backend"].(string)
	web, _ := values["web"].(bool)
	buildPanels, _ := values["build-panels"].(bool)
	if buildPanels && (web || host) {
		return errors.New("--build-panels cannot be used with --web or --host-backend")
	}
	if host && web {
		return errors.New("--web cannot be used with --host-backend")
	}
	if !host && !web && hostGOOS != "darwin" {
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
	if host {
		return hostBackend(ctx, projectPath, backend)
	}
	if web {
		url, err := dev.BuildDevtoolsWeb(ctx, projectPath)
		if err != nil {
			return err
		}
		_, err = fmt.Fprintln(os.Stdout, url)
		return err
	}
	if !buildPanels {
		return launchReleasedApp(ctx, projectPath)
	}
	worker, err := project.Worker(projectPath)
	if err != nil {
		return err
	}
	// No project-output lock: every write lands in native-owned per-run
	// directories (the worker's resource/service dir and a unique compiler
	// profile), so devtools must coexist with a live `xplat dev` in this app.
	_, err = service.RunWorker(ctx, projectPath, worker, "devtools-desktop", "macos", map[string]any{"target": "macos"}, 5*time.Minute, proc.ForegroundInput(ctx), os.Stdout, os.Stderr)
	return err
}

func hostBackend(parent context.Context, root, entry string) error {
	if entry == "" {
		return errors.New("A DevTools backend entry is required.")
	}
	if !filepath.IsAbs(entry) {
		entry = filepath.Join(root, entry)
	}
	if info, err := os.Stat(entry); err != nil || !info.Mode().IsRegular() {
		return errors.New("The DevTools backend entry must be an existing file.")
	}
	input := proc.ForegroundInput(parent)
	if input == nil {
		return errors.New("Hosting a DevTools backend requires a parent input pipe.")
	}
	info, err := input.Stat()
	if err != nil || info.Mode()&os.ModeNamedPipe == 0 {
		return errors.New("Hosting a DevTools backend requires a parent input pipe.")
	}
	ctx, stopOutput := proc.DevPipeContext(parent)
	defer stopOutput()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	defer input.Close()
	go func() {
		_, _ = io.Copy(io.Discard, input)
		cancel()
	}()
	return dev.RunExternalBackend(ctx, root, entry)
}

package lint

import (
	"context"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"os/exec"
	"strings"
)

// The installed lint engine owns its CLI grammar, configuration, fixes and
// source inventory. Forward argv unchanged, including the -- delimiter.
func HelpRequested(argv []string) bool {
	for _, arg := range argv {
		if arg == "--" {
			return false
		}
		if arg == "--help" || arg == "-h" {
			return true
		}
		if strings.HasPrefix(arg, "-") && arg != "--fix" {
			return false
		}
	}
	return false
}

func Command(ctx context.Context, values map[string]any) error {
	projectRoot, err := os.Getwd()
	if err != nil {
		return err
	}
	projectRoot, err = osfs.Canonical(projectRoot)
	if err != nil {
		return err
	}
	runner, err := project.InstalledProjectEntry(projectRoot, "@octane-xplat/lint", "exports", "./bin")
	if err != nil {
		return err
	}
	node, err := exec.LookPath("node")
	if err != nil {
		return errors.New("Node is required for the project's lint engine")
	}
	argv, _ := values["argv"].([]string)
	process, err := proc.RunForegroundProcessIO(ctx, append([]string{node, runner}, argv...), projectRoot, project.ToolEnvironment(), os.Stdout, os.Stderr)
	if err != nil {
		return err
	}
	if ctx.Err() != nil {
		return ctx.Err()
	}
	if process.ExitCode < 0 {
		return errors.New("lint engine stopped by a signal")
	}
	if process.ExitCode != 0 {
		return &project.ToolExit{Code: process.ExitCode}
	}
	return nil
}

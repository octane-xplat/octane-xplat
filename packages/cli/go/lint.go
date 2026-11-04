package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func init() { nativeLegacyCommands["lint"] = lintCommand }

// The installed lint engine owns its CLI grammar, configuration, fixes and
// source inventory. Forward argv unchanged, including the -- delimiter.
func lintHelpRequested(argv []string) bool {
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

type projectToolExit struct{ Code int }

func (err *projectToolExit) Error() string { return fmt.Sprintf("project tool exited %d", err.Code) }

func lintCommand(ctx context.Context, values map[string]any) error {
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	runner, err := installedProjectEntry(project, "@octane-xplat/lint", "exports", "./bin")
	if err != nil {
		return err
	}
	node, err := exec.LookPath("node")
	if err != nil {
		return errors.New("Node is required for the project's lint engine")
	}
	argv, _ := values["argv"].([]string)
	process, err := runForegroundProcessIO(ctx, append([]string{node, runner}, argv...), project, projectToolEnvironment(), os.Stdout, os.Stderr)
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
		return &projectToolExit{process.ExitCode}
	}
	return nil
}

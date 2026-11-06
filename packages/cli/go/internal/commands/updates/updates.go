package updates

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/artifact"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode"
)

func updatesDependencies(ctx context.Context, projectRoot string) error {
	entry, err := project.Worker(projectRoot)
	if err != nil {
		return err
	}
	child, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	result, err := project.RunWorkerEntry(child, projectRoot, entry, "updates-check", nil, nil, nil)
	fmt.Fprint(os.Stderr, result.Process.Stdout, result.Process.Stderr)
	for _, warning := range result.Warnings {
		fmt.Fprintln(os.Stderr, warning)
	}
	if err != nil {
		return err
	}
	var data struct {
		Version  int
		Project  string
		Resolved []struct{ Specifier, Entry string }
	}
	if err = json.Unmarshal(result.Data, &data); err != nil {
		return err
	}
	if data.Version != 1 || data.Project == "" || len(data.Resolved) != 2 {
		return errors.New("invalid updates dependency response")
	}
	expected, err := osfs.ProjectLockIdentity(projectRoot)
	if err != nil {
		return err
	}
	actual, err := osfs.ProjectLockIdentity(data.Project)
	if err != nil || actual != expected {
		return errors.New("updates worker project identity mismatch")
	}
	for i, name := range []string{"@octane-xplat/updates/prepare", "@octane-xplat/fingerprint"} {
		item := data.Resolved[i]
		if item.Specifier != name || !filepath.IsAbs(item.Entry) {
			return errors.New("invalid updates dependency entry")
		}
		info, err := os.Stat(item.Entry)
		if err != nil || !info.Mode().IsRegular() {
			return fmt.Errorf("updates dependency entry is unavailable: %s", name)
		}
	}
	return nil
}

func Command(ctx context.Context, values map[string]any) error {
	projectRoot := cli.StringValue(values["dir"])
	if projectRoot == "" {
		projectRoot = "."
	}
	projectRoot, err := filepath.Abs(projectRoot)
	if err != nil {
		return err
	}
	projectRoot, err = osfs.Canonical(projectRoot)
	if err != nil {
		return err
	}
	if _, err = project.Manifest(projectRoot); err != nil {
		return fmt.Errorf("run updates init inside an app with package.json: %w", err)
	}
	if err = updatesDependencies(ctx, projectRoot); err != nil {
		return err
	}
	release, err := project.LockProjectOutputs(projectRoot)
	if err != nil {
		return err
	}
	defer release()
	if cli.Metadata.UpdatesHook == "" {
		return errors.New("native build is missing the canonical updates hook")
	}
	scope, err := artifact.OutputScope(projectRoot, projectRoot)
	if err != nil {
		return err
	}
	hook := filepath.Join(projectRoot, "hooks", "after-prepare", "xplat-updates.cjs")
	paths := []string{hook, filepath.Join(projectRoot, ".gitignore")}
	artifacts := []artifact.PlannedArtifact{}
	for i, path := range paths {
		before, err := artifact.SnapshotArtifact(ctx, scope, path)
		if err != nil {
			return err
		}
		if before.Alias || before.Target != path {
			return fmt.Errorf("updates output contains aliases: %s", path)
		}
		bytes, err := artifact.ReadArtifactBytes(scope, before)
		if err != nil {
			return err
		}
		source := string(bytes)
		if i == 0 {
			if source != "" && source != cli.Metadata.UpdatesHook {
				return errors.New("Existing OTA hook differs; reconcile it before running updates init")
			}
			source = cli.Metadata.UpdatesHook
		} else {
			ignored := false
			for _, line := range strings.Split(source, "\n") {
				line = strings.TrimFunc(line, func(r rune) bool { return unicode.IsSpace(r) || r == '\ufeff' })
				if line == ".xplat/" || line == "/.xplat/" {
					ignored = true
					break
				}
			}
			if !ignored {
				if source != "" && !strings.HasSuffix(source, "\n") {
					source += "\n"
				}
				source += ".xplat/\n"
			}
		}
		artifacts = append(artifacts, artifact.PlannedArtifact{File: path, Source: source, Before: before})
	}
	if err = artifact.PublishArtifacts(ctx, scope, artifacts, func() error {
		for _, file := range artifacts {
			if err := artifact.UnchangedArtifact(ctx, scope, file.Before); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return &project.WorkspaceMutationError{Operation: "updates initialization", Root: projectRoot, Hint: "Inspect the hook and .gitignore before retrying", Err: err}
	}
	fmt.Printf("Created %s. Commit the hook and rebuild your iOS/Android binaries.\n", hook)
	return nil
}

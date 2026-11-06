package build

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/artifact"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"path/filepath"
)

func runStagedPackage(ctx context.Context, projectPath, worker, label, releaseKey, stagePrefix, operation string, publish func(context.Context, *os.Root, string, string, json.RawMessage) ([]string, error)) (failure error) {
	projectRoot, err := os.OpenRoot(projectPath)
	if err != nil {
		return err
	}
	defer projectRoot.Close()
	for _, path := range []string{filepath.Dir(releaseKey), releaseKey} {
		if info, err := projectRoot.Lstat(path); err == nil {
			if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
				return errors.New(label + " artifact directories must be ordinary directories")
			}
		} else if !os.IsNotExist(err) {
			return err
		}
		if err = projectRoot.MkdirAll(path, 0755); err != nil {
			return err
		}
	}
	root, err := projectRoot.OpenRoot(releaseKey)
	if err != nil {
		return err
	}
	defer root.Close()
	release, err := osfs.Canonical(filepath.Join(projectPath, releaseKey))
	if err != nil {
		return err
	}
	if info, err := root.Lstat(".xplat-build.lock"); err == nil {
		if !info.Mode().IsRegular() {
			return errors.New(label + " build lock must not be a symlink or special file")
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	lock, err := root.OpenFile(".xplat-build.lock", os.O_RDWR|os.O_CREATE, 0600)
	if err != nil {
		return err
	}
	defer lock.Close()
	info, err := lock.Stat()
	if err != nil || !info.Mode().IsRegular() {
		return errors.New(label + " build lock must be a regular file")
	}
	locked, err := osfs.TryCacheLock(lock)
	if err != nil {
		return err
	}
	if !locked {
		return errors.New("another " + label + " build owns this app's artifact directory")
	}
	defer osfs.ReleaseCacheLock(lock)
	stage := stagePrefix + osfs.Identity()
	if err = root.Mkdir(stage, 0700); err != nil {
		return err
	}
	stageInfo, err := root.Lstat(stage)
	if err != nil {
		return err
	}
	preserve := false
	published := []string{}
	defer func() {
		current, err := root.Lstat(stage)
		if os.IsNotExist(err) {
			return
		}
		if err != nil || !current.IsDir() || current.Mode()&os.ModeSymlink != 0 || !os.SameFile(stageInfo, current) {
			failure = &artifact.PublicationError{Published: published, Retained: []string{filepath.Join(release, stage)}, Err: errors.Join(failure, errors.New(label+" staging identity changed"))}
			return
		}
		if preserve {
			return
		}
		if err = root.RemoveAll(stage); err != nil {
			failure = &artifact.PublicationError{Published: published, Retained: []string{filepath.Join(release, stage)}, Err: errors.Join(failure, err)}
		}
	}()
	output, diagnostic := os.Stdout, os.Stderr
	if _, background := project.ExecutionFromContext(ctx); background {
		output, diagnostic = nil, nil
	}
	result, err := project.RunWorkerEntryStdio(ctx, projectPath, worker, operation, map[string]any{"stagingRoot": filepath.Join(release, stage)}, proc.ForegroundInput(ctx), output, diagnostic)
	if err != nil {
		preserve = cli.RequiresFailureEvidence(err)
		return err
	}
	if err = ctx.Err(); err != nil {
		return err
	}
	current, err := root.Lstat(stage)
	if err != nil || !os.SameFile(stageInfo, current) {
		preserve = true
		return errors.New(label + " staging ownership changed")
	}
	published, err = publish(ctx, root, release, stage, result.Data)
	preserve = cli.RequiresFailureEvidence(err)
	return err
}

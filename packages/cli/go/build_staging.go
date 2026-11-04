package main

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

func runStagedPackage(ctx context.Context, project, worker, label, releaseKey, stagePrefix, operation string, publish func(context.Context, *os.Root, string, string, json.RawMessage) ([]string, error)) (failure error) {
	projectRoot, err := os.OpenRoot(project)
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
	release, err := canonical(filepath.Join(project, releaseKey))
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
	locked, err := tryCacheLock(lock)
	if err != nil {
		return err
	}
	if !locked {
		return errors.New("another " + label + " build owns this app's artifact directory")
	}
	defer releaseCacheLock(lock)
	stage := stagePrefix + identity()
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
			failure = &artifactPublicationError{Published: published, Retained: []string{filepath.Join(release, stage)}, Err: errors.Join(failure, errors.New(label+" staging identity changed"))}
			return
		}
		if preserve {
			return
		}
		if err = root.RemoveAll(stage); err != nil {
			failure = &artifactPublicationError{Published: published, Retained: []string{filepath.Join(release, stage)}, Err: errors.Join(failure, err)}
		}
	}()
	result, err := runWorkerEntry(ctx, project, worker, operation, map[string]any{"stagingRoot": filepath.Join(release, stage)}, os.Stdout, os.Stderr)
	if err != nil {
		preserve = requiresFailureEvidence(err)
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
	preserve = requiresFailureEvidence(err)
	return err
}

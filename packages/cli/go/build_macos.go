package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
)

var packageExecutableName = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._ -]*$`)

type macOSPackagePlan struct {
	Version                          int
	ExecutableName, AppPath, DmgPath string
}

func publishMacOSPackage(ctx context.Context, root *os.Root, release, stage string, data json.RawMessage) error {
	return publishMacOSPackageUsing(ctx, root, release, stage, data, root.Rename)
}
func publishMacOSPackageUsing(ctx context.Context, root *os.Root, release, stage string, data json.RawMessage, renameFile func(string, string) error) (failure error) {
	var plan macOSPackagePlan
	if json.Unmarshal(data, &plan) != nil || plan.Version != 1 || !packageExecutableName.MatchString(plan.ExecutableName) {
		return errors.New("invalid macOS artifact plan")
	}
	name := plan.ExecutableName
	app := filepath.Join(stage, name+".app")
	dmg := filepath.Join(stage, name+"-macos-universal.dmg")
	if plan.AppPath != filepath.Join(release, app) || plan.DmgPath != filepath.Join(release, dmg) {
		return errors.New("macOS artifact paths do not match native-owned staging")
	}
	info, err := root.Lstat(app)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return errors.New("macOS app must be a staged ordinary directory")
	}
	for _, path := range []string{filepath.Join(app, "Contents/MacOS", name), filepath.Join(app, "Contents/Info.plist"), dmg} {
		info, err = root.Lstat(path)
		if err != nil || !info.Mode().IsRegular() || info.Size() == 0 {
			return errors.New("incomplete macOS package: executable, plist and DMG must be nonempty regular files")
		}
		actual, err := canonical(filepath.Join(release, path))
		if err != nil || actual != filepath.Join(release, path) {
			return errors.New("macOS package entry must not alias a different target")
		}
	}
	finalApp := name + ".app"
	finalDmg := name + "-macos-universal.dmg"
	exists := func(path string, directory bool) (bool, error) {
		info, err := root.Lstat(path)
		if os.IsNotExist(err) {
			return false, nil
		}
		if err != nil {
			return false, err
		}
		if info.Mode()&os.ModeSymlink != 0 || info.IsDir() != directory || (!directory && !info.Mode().IsRegular()) {
			return false, fmt.Errorf("incompatible macOS destination: %s", path)
		}
		return true, nil
	}
	appExists, err := exists(finalApp, true)
	if err != nil {
		return err
	}
	dmgExists, err := exists(finalDmg, false)
	if err != nil {
		return err
	}
	oldApp, oldDmg := filepath.Join(stage, ".previous-app"), filepath.Join(stage, ".previous-dmg")
	for _, backup := range []string{oldApp, oldDmg} {
		if _, err = root.Lstat(backup); !os.IsNotExist(err) {
			return errors.New("worker staging contains reserved backup entries")
		}
	}
	if err = ctx.Err(); err != nil {
		return err
	}
	type move struct{ from, to string }
	moved := []move{}
	defer func() {
		if failure == nil {
			return
		}
		var recovery error
		for i := len(moved) - 1; i >= 0; i-- {
			operation := moved[i]
			if err := renameFile(operation.to, operation.from); err != nil {
				recovery = errors.Join(recovery, err)
			}
		}
		if recovery != nil {
			failure = &artifactPublicationError{Retained: []string{filepath.Join(release, stage)}, Err: errors.Join(failure, recovery)}
		}
	}()
	rename := func(from, to string) error {
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := renameFile(from, to); err != nil {
			return err
		}
		moved = append(moved, move{from, to})
		return nil
	}
	if appExists {
		if err = rename(finalApp, oldApp); err != nil {
			return err
		}
	}
	if dmgExists {
		if err = rename(finalDmg, oldDmg); err != nil {
			return err
		}
	}
	if err = rename(app, finalApp); err != nil {
		return err
	}
	if err = rename(dmg, finalDmg); err != nil {
		return err
	}
	fmt.Printf("Published macOS app: %s\nPublished macOS DMG: %s\n", filepath.Join(release, finalApp), filepath.Join(release, finalDmg))
	return nil
}

func runMacOSPackage(ctx context.Context, project, worker string) (failure error) {
	projectRoot, err := os.OpenRoot(project)
	if err != nil {
		return err
	}
	defer projectRoot.Close()
	for _, path := range []string{"artifacts", "artifacts/macos-universal"} {
		if info, err := projectRoot.Lstat(path); err == nil {
			if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
				return errors.New("macOS artifact directories must be ordinary directories")
			}
		} else if !os.IsNotExist(err) {
			return err
		}
		if err = projectRoot.MkdirAll(path, 0755); err != nil {
			return err
		}
	}
	root, err := projectRoot.OpenRoot("artifacts/macos-universal")
	if err != nil {
		return err
	}
	defer root.Close()
	release, err := canonical(filepath.Join(project, "artifacts/macos-universal"))
	if err != nil {
		return err
	}
	if info, err := root.Lstat(".xplat-build.lock"); err == nil {
		if !info.Mode().IsRegular() {
			return errors.New("macOS build lock must not be a symlink or special file")
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
		return errors.New("macOS build lock must be a regular file")
	}
	locked, err := tryCacheLock(lock)
	if err != nil {
		return err
	}
	if !locked {
		return errors.New("another macOS build owns this app's artifact directory")
	}
	defer releaseCacheLock(lock)
	stage := ".xplat-macos-" + identity()
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
			failure = &artifactPublicationError{Published: published, Retained: []string{filepath.Join(release, stage)}, Err: errors.Join(failure, errors.New("macOS staging identity changed"))}
			return
		}
		if preserve {
			return
		}
		if err = root.RemoveAll(stage); err != nil {
			failure = &artifactPublicationError{Published: published, Retained: []string{filepath.Join(release, stage)}, Err: errors.Join(failure, err)}
		}
	}()
	result, err := runWorkerEntry(ctx, project, worker, "macos-package", map[string]any{"stagingRoot": filepath.Join(release, stage)}, os.Stdout, os.Stderr)
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
		return errors.New("macOS staging ownership changed")
	}
	err = publishMacOSPackage(ctx, root, release, stage, result.Data)
	preserve = requiresFailureEvidence(err)
	if err == nil {
		var plan macOSPackagePlan
		_ = json.Unmarshal(result.Data, &plan)
		published = []string{filepath.Join(release, plan.ExecutableName+".app"), filepath.Join(release, plan.ExecutableName+"-macos-universal.dmg")}
	}
	return err
}

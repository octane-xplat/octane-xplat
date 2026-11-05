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
	if err := publishPackagePair(ctx, root, release, stage, app, dmg, finalApp, finalDmg, renameFile); err != nil {
		return err
	}

	fmt.Printf("Published macOS app: %s\nPublished macOS DMG: %s\n", filepath.Join(release, finalApp), filepath.Join(release, finalDmg))
	return nil
}

func runMacOSPackage(ctx context.Context, project, worker string) error {
	return runStagedPackage(ctx, project, worker, "macOS", "artifacts/macos-universal", ".xplat-macos-", "macos-package", func(ctx context.Context, root *os.Root, release, stage string, data json.RawMessage) ([]string, error) {
		if err := publishMacOSPackage(ctx, root, release, stage, data); err != nil {
			return nil, err
		}
		var plan macOSPackagePlan
		_ = json.Unmarshal(data, &plan)
		return []string{filepath.Join(release, plan.ExecutableName+".app"), filepath.Join(release, plan.ExecutableName+"-macos-universal.dmg")}, nil
	})
}

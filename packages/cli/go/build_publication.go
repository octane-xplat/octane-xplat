package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// Publish a validated directory/archive pair, preserving both prior outputs.
// Rollback ignores root cancellation: recovery must finish before ownership ends.
func publishPackagePair(ctx context.Context, root *os.Root, release, stage, stagedDirectory, stagedArchive, finalDirectory, finalArchive string, renameFile func(string, string) error) (failure error) {
	exists := func(path string, directory bool) (bool, error) {
		info, err := root.Lstat(path)
		if os.IsNotExist(err) {
			return false, nil
		}
		if err != nil {
			return false, err
		}
		if info.Mode()&os.ModeSymlink != 0 || info.IsDir() != directory || (!directory && !info.Mode().IsRegular()) {
			return false, fmt.Errorf("incompatible package destination: %s", path)
		}
		return true, nil
	}
	directoryExists, err := exists(finalDirectory, true)
	if err != nil {
		return err
	}
	archiveExists, err := exists(finalArchive, false)
	if err != nil {
		return err
	}
	oldDirectory, oldArchive := filepath.Join(stage, ".previous-app"), filepath.Join(stage, ".previous-archive")
	for _, backup := range []string{oldDirectory, oldArchive} {
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
	if directoryExists {
		if err = rename(finalDirectory, oldDirectory); err != nil {
			return err
		}
	}
	if archiveExists {
		if err = rename(finalArchive, oldArchive); err != nil {
			return err
		}
	}
	if err = rename(stagedDirectory, finalDirectory); err != nil {
		return err
	}
	if err = rename(stagedArchive, finalArchive); err != nil {
		return err
	}
	return nil
}

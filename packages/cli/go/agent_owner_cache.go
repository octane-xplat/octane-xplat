package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Callers hold the bootstrap claim; collection also requires the global owner
// lifetime claim and each launch's nonblocking kernel claim. An unadopted stage
// can be reclaimed only without an owner descriptor or adoption marker. Adopted
// stages require an explicit cleanup checkpoint; unknown files remain untouched.
type ownerLaunch struct {
	Version          int    `json:"version"`
	Project          string `json:"project"`
	LaunchID         string `json:"launchId"`
	CLIVersion       string `json:"cliVersion"`
	Helper           string `json:"helper"`
	BinarySHA256     string `json:"binarySha256"`
	IdleMillis       int64  `json:"idleMillis"`
	ImageReady       bool   `json:"imageReady"`
	CleanupConfirmed bool   `json:"cleanupConfirmed"`
}

func writeOwnerLaunch(root *os.Root, request ownerLaunch) error {
	data, err := json.Marshal(request)
	if err != nil {
		return err
	}
	temporary := "write-" + identity() + ".tmp"
	file, err := root.OpenFile(temporary, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	defer root.Remove(temporary)
	n, writeErr := file.Write(data)
	closeErr := file.Close()
	if writeErr != nil || closeErr != nil {
		return errors.Join(writeErr, closeErr)
	}
	if n != len(data) {
		return io.ErrShortWrite
	}
	return root.Rename(temporary, "launch.json")
}

func readOwnerLaunch(root *os.Root, project, id string) (ownerLaunch, error) {
	var request ownerLaunch
	data, err := historyFile(root, "launch.json", 64<<10)
	if err != nil {
		return request, err
	}
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&request) != nil || decoder.Decode(new(any)) != io.EOF {
		return request, errors.New("invalid native owner launch manifest")
	}
	helperID := strings.TrimSuffix(strings.TrimPrefix(request.Helper, "native-helper-"), ".exe")
	if request.Version != 1 || request.Project != project || request.LaunchID != id || !ownerHex(id, 32) || request.CLIVersion == "" || request.Helper != "native-helper-"+helperID+".exe" || !ownerHex(helperID, 32) || !ownerHex(request.BinarySHA256, 64) || request.IdleMillis < 250 || request.IdleMillis > 86400000 {
		return request, errors.New("native owner launch identity is invalid")
	}
	return request, nil
}

func ownerRootEntries(root *os.Root, limit int) ([]os.DirEntry, error) {
	directory, err := root.Open(".")
	if err != nil {
		return nil, err
	}
	defer directory.Close()
	entries, err := directory.ReadDir(limit + 1)
	if err != nil && err != io.EOF {
		return nil, err
	}
	if len(entries) > limit {
		return nil, errors.New("native owner cache exceeds its bounded inventory")
	}
	return entries, nil
}

func ownerStageLease(root *os.Root) (func(), error) {
	file, err := root.OpenFile("started", os.O_RDWR|os.O_CREATE|os.O_EXCL, 0600)
	if os.IsExist(err) {
		info, inspectErr := root.Lstat("started")
		if inspectErr != nil {
			return nil, inspectErr
		}
		if !info.Mode().IsRegular() {
			return nil, errors.New("native owner launch claim must be regular")
		}
		file, err = root.OpenFile("started", os.O_RDWR, 0)
	}
	if err != nil {
		return nil, err
	}
	locked, err := tryCacheLock(file)
	if err != nil || !locked {
		file.Close()
		if err != nil {
			return nil, err
		}
		return nil, errors.New("native owner launch is still retiring; retry")
	}
	var once sync.Once
	return func() { once.Do(func() { releaseCacheLock(file); file.Close() }) }, nil
}

func pruneOwnerStages(ctx context.Context, root *os.Root, directory, project string) error {
	release, err := lockCache(ctx, root, "owner.lock")
	if err != nil {
		return err
	}
	defer release()
	if _, err = root.Lstat("owner.json"); err == nil {
		return errors.New("native owner evidence appeared during startup")
	} else if !os.IsNotExist(err) {
		return err
	}
	entries, err := ownerRootEntries(root, 128)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if !strings.HasPrefix(entry.Name(), "launch-") {
			continue
		}
		id := strings.TrimPrefix(entry.Name(), "launch-")
		info, err := root.Lstat(entry.Name())
		if err != nil {
			return err
		}
		if !ownerHex(id, 32) || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			return errors.New("invalid native owner staging directory")
		}
		stage, err := root.OpenRoot(entry.Name())
		if err != nil {
			return err
		}
		err = pruneOwnerStage(ctx, stage, filepath.Join(directory, entry.Name()), project, id)
		stage.Close()
		if err != nil {
			return fmt.Errorf("native owner stage retained at %s: %w", filepath.Join(directory, entry.Name()), err)
		}
		if err = root.Remove(entry.Name()); err != nil {
			return err
		}
	}
	return nil
}

func pruneOwnerStage(ctx context.Context, root *os.Root, path, project, id string) error {
	release, err := ownerStageLease(root)
	if err != nil {
		return err
	}
	defer release()
	request, err := readOwnerLaunch(root, project, id)
	if err != nil {
		return err
	}
	entries, err := ownerRootEntries(root, 8)
	if err != nil {
		return err
	}
	adopted := false
	for _, entry := range entries {
		info, err := root.Lstat(entry.Name())
		if err != nil {
			return err
		}
		if !info.Mode().IsRegular() || (entry.Name() != request.Helper && entry.Name() != "launch.json" && entry.Name() != "started" && entry.Name() != "adopted" && entry.Name() != "failure.json") {
			return errors.New("owner staging contains an unrecognized file; inspect it before cleanup")
		}
		if entry.Name() == "adopted" {
			adopted = true
		}
	}
	if !request.CleanupConfirmed {
		// The global lifetime and bootstrap leases are held by the caller. Without a
		// descriptor or a committed adoption marker, no resource could be admitted.
		if adopted {
			return errors.New("previous adopted owner has no cleanup-confirmed checkpoint")
		}
		request.CleanupConfirmed = true
		if err = writeOwnerLaunch(root, request); err != nil {
			return err
		}
	}
	if _, err = root.Lstat(request.Helper); err == nil {
		if request.ImageReady {
			digest, err := nativeExecutableSHA(filepath.Join(path, request.Helper))
			if err != nil {
				return err
			}
			if digest != request.BinarySHA256 {
				return errors.New("staged native owner executable changed")
			}
		}
		deadline := time.Now().Add(time.Second)
		for {
			err = root.Remove(request.Helper)
			if err == nil {
				break
			}
			if time.Now().After(deadline) {
				return err
			}
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(25 * time.Millisecond):
			}
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	for _, name := range []string{"adopted", "failure.json"} {
		if err = root.Remove(name); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	// With the executable gone and the global lease held, this claim cannot be
	// reused by a late child. Close before deletion for Windows mapped handles.
	release()
	for _, name := range []string{"started", "launch.json"} {
		if err = root.Remove(name); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	return nil
}

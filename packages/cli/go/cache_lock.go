package main

import (
	"context"
	"errors"
	"os"
	"time"
)

// Keep the lock file's identity stable: publishers never rename or remove it.
// Kernel locks disappear on process exit; stored PIDs are not ownership proof.
func lockCache(ctx context.Context, root *os.Root, path string) (func(), error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	file, err := root.OpenFile(path, os.O_RDWR|os.O_CREATE, 0600)
	if err != nil {
		return nil, err
	}
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() {
		file.Close()
		return nil, errors.New("cache lock must be a regular file")
	}
	for {
		if err := ctx.Err(); err != nil {
			file.Close()
			return nil, err
		}
		locked, err := tryCacheLock(file)
		if err != nil {
			file.Close()
			return nil, err
		}
		if locked {
			return func() { releaseCacheLock(file); file.Close() }, nil
		}
		select {
		case <-ctx.Done():
			file.Close()
			return nil, ctx.Err()
		case <-time.After(25 * time.Millisecond):
		}
	}
}

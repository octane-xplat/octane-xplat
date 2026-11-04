package main

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// The lock must outlive removal of dist and dependency caches. Never unlink it:
// another process may already have this same kernel lock identity open.
func lockProjectOutputs(project string) (func(), error) {
	project, err := canonical(project)
	if err != nil {
		return nil, err
	}
	key, err := projectLockIdentity(project)
	if err != nil {
		return nil, err
	}
	cache, err := os.UserCacheDir()
	if err != nil {
		return nil, err
	}
	cache = filepath.Join(cache, "octane-xplat", "cli-go", "project-locks")
	// An explicit OS cache override must not put the lease inside the tree
	// clean can remove. Fold case conservatively for case-insensitive hosts.
	inside := func(path string) bool {
		rel, err := filepath.Rel(strings.ToLower(project), strings.ToLower(path))
		return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
	}
	if inside(cache) {
		return nil, fmt.Errorf("native project-lock cache must be outside the selected project")
	}
	if err = preparePrivateCache(cache); err != nil {
		return nil, fmt.Errorf("cannot use native project-lock cache %s: %w", cache, err)
	}
	physicalCache, err := canonical(cache)
	if err != nil {
		return nil, err
	}
	if inside(physicalCache) {
		return nil, fmt.Errorf("native project-lock cache must not resolve inside the selected project")
	}
	root, err := os.OpenRoot(cache)
	if err != nil {
		return nil, err
	}
	name := fmt.Sprintf("%x.lock", sha256.Sum256([]byte(key)))
	if info, err := root.Lstat(name); err == nil && !info.Mode().IsRegular() {
		root.Close()
		return nil, fmt.Errorf("project operation lock must be an ordinary file")
	} else if err != nil && !os.IsNotExist(err) {
		root.Close()
		return nil, err
	}
	file, err := root.OpenFile(name, os.O_RDWR|os.O_CREATE|os.O_EXCL, 0600)
	if os.IsExist(err) {
		file, err = root.OpenFile(name, os.O_RDWR, 0)
	}
	if err != nil {
		root.Close()
		return nil, err
	}
	close := func() { file.Close(); root.Close() }
	info, err := file.Stat()
	current, checkErr := root.Lstat(name)
	if err != nil || checkErr != nil || !info.Mode().IsRegular() || !os.SameFile(info, current) {
		close()
		return nil, fmt.Errorf("project operation lock identity changed")
	}
	locked, err := tryCacheLock(file)
	if err != nil || !locked {
		close()
		if err != nil {
			return nil, err
		}
		return nil, fmt.Errorf("another Go project operation owns this project's outputs; retry after it finishes")
	}
	return func() { releaseCacheLock(file); close() }, nil
}

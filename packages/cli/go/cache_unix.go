//go:build darwin || linux

package main

import (
	"errors"
	"os"
	"syscall"

	"golang.org/x/sys/unix"
)

func preparePrivateCache(path string) error {
	if err := os.MkdirAll(path, 0700); err != nil {
		return err
	}
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	stat, ok := info.Sys().(*syscall.Stat_t)
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 || info.Mode().Perm()&0077 != 0 || !ok || stat.Uid != uint32(os.Getuid()) {
		return errors.New("cache namespace must be a private directory owned by the current user; choose a new XPLAT_MCP_CACHE directory")
	}
	return nil
}
func tryCacheLock(file *os.File) (bool, error) {
	err := unix.Flock(int(file.Fd()), unix.LOCK_EX|unix.LOCK_NB)
	if errors.Is(err, unix.EWOULDBLOCK) || errors.Is(err, unix.EAGAIN) {
		return false, nil
	}
	return err == nil, err
}
func releaseCacheLock(file *os.File) { _ = unix.Flock(int(file.Fd()), unix.LOCK_UN) }

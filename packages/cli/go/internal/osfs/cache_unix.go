//go:build darwin || linux

package osfs

import (
	"errors"
	"os"
	"syscall"

	"golang.org/x/sys/unix"
)

func PreparePrivateCache(path string) error {
	if err := os.MkdirAll(path, 0700); err != nil {
		return err
	}
	return ValidatePrivateCache(path)
}

// Validation is read-only; inspection must never create a missing namespace.
func ValidatePrivateCache(path string) error {
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
func TryCacheLock(file *os.File) (bool, error) {
	err := unix.Flock(int(file.Fd()), unix.LOCK_EX|unix.LOCK_NB)
	if errors.Is(err, unix.EWOULDBLOCK) || errors.Is(err, unix.EAGAIN) {
		return false, nil
	}
	return err == nil, err
}
func ReleaseCacheLock(file *os.File) { _ = unix.Flock(int(file.Fd()), unix.LOCK_UN) }

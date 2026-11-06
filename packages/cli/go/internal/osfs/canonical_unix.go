//go:build darwin || linux

package osfs

import (
	"fmt"
	"os"
	"path/filepath"
	"syscall"
)

func ProjectLockIdentity(path string) (string, error) {
	info, err := os.Stat(path)
	if err != nil {
		return "", err
	}
	stat, ok := info.Sys().(*syscall.Stat_t)
	if !ok || !info.IsDir() {
		return "", fmt.Errorf("project lock requires an ordinary directory identity")
	}
	return fmt.Sprintf("%x:%x", stat.Dev, stat.Ino), nil
}

func Canonical(path string) (string, error) {
	absolute, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	return filepath.EvalSymlinks(absolute)
}

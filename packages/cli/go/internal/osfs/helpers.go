package osfs

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

func Inside(root, path string) bool {
	rel, err := filepath.Rel(root, path)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)) && !filepath.IsAbs(rel)
}

func PathExists(path string) bool { _, err := os.Stat(path); return err == nil }

func DigestText(text string) string { return fmt.Sprintf("%x", sha256.Sum256([]byte(text))) }

func SafeSnapshotPath(path string) bool {
	if path == "" || strings.ContainsAny(path, "\\\x00:\r\n\t") || filepath.ToSlash(filepath.Clean(path)) != path || !filepath.IsLocal(filepath.FromSlash(path)) {
		return false
	}
	return len(strings.Split(path, "/")) <= 32
}

func FilesystemKey(path string) string {
	path = filepath.Clean(path)
	if runtime.GOOS == "windows" {
		return strings.ToLower(path)
	}

	return path
}
func CleanDirectory(root *os.Root, path string) (*os.Root, error) {
	current, err := root.OpenRoot(".")
	if err != nil {
		return nil, err
	}
	if path == "." {
		return current, nil
	}
	for _, part := range strings.Split(filepath.ToSlash(path), "/") {
		info, err := current.Lstat(part)
		if err != nil {
			current.Close()
			return nil, err
		}
		if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			current.Close()
			return nil, fmt.Errorf("clean refuses a linked or non-directory ancestor: %s", path)
		}
		next, err := current.OpenRoot(part)
		current.Close()
		if err != nil {
			return nil, err
		}
		opened, err := next.Stat(".")
		if err != nil || !os.SameFile(info, opened) {
			next.Close()
			return nil, fmt.Errorf("clean directory identity changed: %s", path)
		}
		current = next
	}
	return current, nil
}

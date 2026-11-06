//go:build darwin || linux

package osfs

import (
	"os"
	"syscall"
)

func OpenSourceFile(root *os.Root, key string) (*os.File, error) {
	// A raced-in FIFO must not block the CLI before the regular-file check.
	return root.OpenFile(key, os.O_RDONLY|syscall.O_NONBLOCK, 0)
}

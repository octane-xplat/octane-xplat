//go:build windows

package osfs

import "os"

func OpenSourceFile(root *os.Root, key string) (*os.File, error) { return root.Open(key) }

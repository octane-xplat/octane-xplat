//go:build darwin || linux

package main

import "os"

func privateDirectory(parent, prefix string) (string, error) { return os.MkdirTemp(parent, prefix) }
func privateFile(path string, bytes []byte) error            { return os.WriteFile(path, bytes, 0600) }
func privateOutput(path string) (*os.File, error) {
	return os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
}

//go:build darwin || linux

package osfs

import "os"

func PrivateDirectory(parent, prefix string) (string, error) { return os.MkdirTemp(parent, prefix) }
func PrivateFile(path string, bytes []byte) error            { return os.WriteFile(path, bytes, 0600) }
func PrivateOutput(path string) (*os.File, error) {
	return os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
}

// An existing private path is not proof that this invocation owns its contents.
func PrivateDirectoryAt(path string) error { return os.Mkdir(path, 0700) }

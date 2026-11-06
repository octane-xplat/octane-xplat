package osfs

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"os"
	"path/filepath"
)

const nativeExecutableLimit = 64 << 20

func StageNativeExecutable(exe, directory, name string) (string, string, error) {
	if directory == "" || name == "" || filepath.Base(name) != name {
		return "", "", errors.New("native executable requires private staging")
	}
	source, err := os.Open(exe)
	if err != nil {
		return "", "", err
	}
	defer source.Close()
	info, err := source.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() <= 0 || info.Size() > nativeExecutableLimit {
		return "", "", errors.New("invoked native helper must be an ordinary executable of at most 64 MiB")
	}
	path := filepath.Join(directory, name)
	output, err := PrivateOutput(path)
	if err != nil {
		return "", "", err
	}
	complete := false
	defer func() {
		if !complete {
			_ = os.Remove(path)
		}
	}()
	digest := sha256.New()
	n, copyErr := io.Copy(io.MultiWriter(output, digest), io.LimitReader(source, nativeExecutableLimit+1))
	closeErr := output.Close()
	if copyErr != nil || closeErr != nil {
		return "", "", errors.Join(copyErr, closeErr)
	}
	after, err := source.Stat()
	if err != nil || n != info.Size() || after.Size() != info.Size() || !after.ModTime().Equal(info.ModTime()) {
		return "", "", errors.New("native helper changed during staging")
	}
	copied, err := os.Open(path)
	if err != nil {
		return "", "", err
	}
	actual := sha256.New()
	verified, readErr := io.Copy(actual, io.LimitReader(copied, nativeExecutableLimit+1))
	closeErr = copied.Close()
	if readErr != nil || closeErr != nil {
		return "", "", errors.Join(readErr, closeErr)
	}
	if verified != n || !bytes.Equal(actual.Sum(nil), digest.Sum(nil)) {
		return "", "", errors.New("native helper checksum mismatch")
	}
	if err = os.Chmod(path, 0700); err != nil {
		return "", "", err
	}
	complete = true
	return path, hex.EncodeToString(digest.Sum(nil)), nil
}

package main

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

func stageNativeExecutable(exe, directory, name string) (string, string, error) {
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
	output, err := privateOutput(path)
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

func nativeExecutableSHA(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()
	before, err := file.Stat()
	if err != nil || !before.Mode().IsRegular() || before.Size() <= 0 || before.Size() > nativeExecutableLimit {
		return "", errors.New("native executable must be a regular file of at most 64 MiB")
	}
	digest := sha256.New()
	n, err := io.Copy(digest, io.LimitReader(file, (nativeExecutableLimit)+1))
	if err != nil {
		return "", err
	}
	after, err := file.Stat()
	if err != nil || n != before.Size() || after.Size() != before.Size() || !after.ModTime().Equal(before.ModTime()) {
		return "", errors.New("native executable changed while checking its identity")
	}
	return hex.EncodeToString(digest.Sum(nil)), nil
}

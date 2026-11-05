//go:build windows

package main

import (
	"errors"
	"syscall"
)

func fileSharingViolation(err error) bool {
	return errors.Is(err, syscall.Errno(32)) || errors.Is(err, syscall.Errno(33))
}

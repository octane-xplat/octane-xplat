//go:build windows

package main

import (
	"errors"
	"syscall"
)

func fileSharingViolation(err error) bool {
	return errors.Is(err, syscall.Errno(32)) || errors.Is(err, syscall.Errno(33))
}

// Windows can report access denied while a removed log segment is pending
// deletion. Retry only bounded log reads; persistent permission errors still fail.
func historyReadMayBeRotating(err error) bool {
	return fileSharingViolation(err) || errors.Is(err, syscall.Errno(5)) || errors.Is(err, syscall.Errno(303))
}

//go:build windows

package osfs

import (
	"errors"
	"syscall"
)

func FileSharingViolation(err error) bool {
	return errors.Is(err, syscall.Errno(32)) || errors.Is(err, syscall.Errno(33))
}

// Windows can report access denied while a removed log segment is pending
// deletion. Retry only bounded log reads; persistent permission errors still fail.
func HistoryReadMayBeRotating(err error) bool {
	return FileSharingViolation(err) || errors.Is(err, syscall.Errno(5)) || errors.Is(err, syscall.Errno(303))
}

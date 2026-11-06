//go:build !windows

package osfs

func FileSharingViolation(error) bool { return false }

func HistoryReadMayBeRotating(error) bool { return false }

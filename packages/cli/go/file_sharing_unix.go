//go:build !windows

package main

func fileSharingViolation(error) bool { return false }

//go:build windows

package main

import (
	"errors"
	"os"
	"path/filepath"
	"unsafe"

	"golang.org/x/sys/windows"
)

func preparePrivateCache(path string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	security, err := privateDirectorySecurity()
	if err != nil {
		return err
	}
	name, err := windows.UTF16PtrFromString(path)
	if err != nil {
		return err
	}
	if err = windows.CreateDirectory(name, security); err != nil && err != windows.ERROR_ALREADY_EXISTS {
		return err
	}
	attributes, err := windows.GetFileAttributes(name)
	if err != nil {
		return err
	}
	if attributes&windows.FILE_ATTRIBUTE_REPARSE_POINT != 0 || attributes&windows.FILE_ATTRIBUTE_DIRECTORY == 0 {
		return errors.New("cache namespace must be a directory without a reparse point")
	}
	sd, err := windows.GetNamedSecurityInfo(path, windows.SE_FILE_OBJECT, windows.OWNER_SECURITY_INFORMATION|windows.DACL_SECURITY_INFORMATION)
	if err != nil {
		return err
	}
	user, err := windows.GetCurrentProcessToken().GetTokenUser()
	if err != nil {
		return err
	}
	owner, _, err := sd.Owner()
	if err != nil {
		return err
	}
	dacl, _, err := sd.DACL()
	if err != nil {
		return err
	}
	control, _, err := sd.Control()
	if err != nil {
		return err
	}
	if owner == nil || !owner.Equals(user.User.Sid) || dacl == nil || dacl.AceCount != 1 || control&windows.SE_DACL_PROTECTED == 0 {
		return errors.New("cache namespace must have a current-user owner and protected user-only DACL")
	}
	var ace *windows.ACCESS_ALLOWED_ACE
	if err = windows.GetAce(dacl, 0, &ace); err != nil {
		return err
	}
	// FILE_ALL_ACCESS from the Windows SDK, as encoded by the FA SDDL right.
	const fileAllAccess windows.ACCESS_MASK = 0x001f01ff
	sid := (*windows.SID)(unsafe.Pointer(&ace.SidStart))
	if ace.Header.AceType != windows.ACCESS_ALLOWED_ACE_TYPE || ace.Header.AceFlags != windows.OBJECT_INHERIT_ACE|windows.CONTAINER_INHERIT_ACE || ace.Mask != fileAllAccess || !sid.Equals(user.User.Sid) {
		return errors.New("cache namespace must grant inheritable current-user-only full access; choose a fresh namespace if it was created without inheritance")
	}
	return nil
}
func tryCacheLock(file *os.File) (bool, error) {
	var overlap windows.Overlapped
	err := windows.LockFileEx(windows.Handle(file.Fd()), windows.LOCKFILE_EXCLUSIVE_LOCK|windows.LOCKFILE_FAIL_IMMEDIATELY, 0, 1, 0, &overlap)
	if errors.Is(err, windows.ERROR_LOCK_VIOLATION) {
		return false, nil
	}
	return err == nil, err
}
func releaseCacheLock(file *os.File) {
	var overlap windows.Overlapped
	_ = windows.UnlockFileEx(windows.Handle(file.Fd()), 0, 1, 0, &overlap)
}

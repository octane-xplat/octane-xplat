//go:build windows

package main

import (
	"golang.org/x/sys/windows"
	"os"
	"path/filepath"
	"unsafe"
)

func privateSecurity() (*windows.SecurityAttributes, error) {
	return userSecurity("")
}

func privateDirectorySecurity() (*windows.SecurityAttributes, error) {
	return userSecurity("OICI")
}

func userSecurity(inheritance string) (*windows.SecurityAttributes, error) {
	user, err := windows.GetCurrentProcessToken().GetTokenUser()
	if err != nil {
		return nil, err
	}
	sid := user.User.Sid.String()
	sd, err := windows.SecurityDescriptorFromString("O:" + sid + "D:P(A;" + inheritance + ";FA;;;" + sid + ")")
	if err != nil {
		return nil, err
	}
	return &windows.SecurityAttributes{Length: uint32(unsafe.Sizeof(windows.SecurityAttributes{})), SecurityDescriptor: sd}, nil
}
func privateDirectory(parent, prefix string) (string, error) {
	sa, err := privateDirectorySecurity()
	if err != nil {
		return "", err
	}
	for attempt := 0; attempt < 10; attempt++ {
		path := filepath.Join(parent, prefix+identity())
		p, err := windows.UTF16PtrFromString(path)
		if err != nil {
			return "", err
		}
		err = windows.CreateDirectory(p, sa)
		if err == windows.ERROR_ALREADY_EXISTS {
			continue
		}
		return path, err
	}
	return "", os.ErrExist
}
func privateFile(path string, bytes []byte) error {
	sa, err := privateSecurity()
	if err != nil {
		return err
	}
	p, err := windows.UTF16PtrFromString(path)
	if err != nil {
		return err
	}
	h, err := windows.CreateFile(p, windows.GENERIC_WRITE, 0, sa, windows.CREATE_NEW, windows.FILE_ATTRIBUTE_NORMAL, 0)
	if err != nil {
		return err
	}
	f := os.NewFile(uintptr(h), path)
	_, err = f.Write(bytes)
	closeErr := f.Close()
	if err != nil {
		return err
	}
	return closeErr
}

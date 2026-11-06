//go:build windows

package osfs

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/sys/windows"
)

func ProjectLockIdentity(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()
	var info windows.ByHandleFileInformation
	if err = windows.GetFileInformationByHandle(windows.Handle(file.Fd()), &info); err != nil {
		return "", err
	}
	if info.FileAttributes&windows.FILE_ATTRIBUTE_DIRECTORY == 0 {
		return "", errors.New("project lock requires an ordinary directory identity")
	}
	return fmt.Sprintf("%x:%x:%x", info.VolumeSerialNumber, info.FileIndexHigh, info.FileIndexLow), nil
}

// Go 1.23+ EvalSymlinks deliberately leaves mount points/junctions unresolved.
// Installed package identity and scope checks need the target actually opened.
func Canonical(path string) (string, error) {
	absolute, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	name, err := windows.UTF16PtrFromString(extendedWindowsPath(absolute))
	if err != nil {
		return "", err
	}
	handle, err := windows.CreateFile(name, windows.FILE_READ_ATTRIBUTES, windows.FILE_SHARE_READ|windows.FILE_SHARE_WRITE|windows.FILE_SHARE_DELETE, nil, windows.OPEN_EXISTING, windows.FILE_FLAG_BACKUP_SEMANTICS, 0)
	if err != nil {
		return "", err
	}
	defer windows.CloseHandle(handle)
	for size := uint32(512); size <= 32768; {
		buffer := make([]uint16, size)
		n, err := windows.GetFinalPathNameByHandle(handle, &buffer[0], size, 0)
		if err != nil {
			return "", err
		}
		if n >= size {
			size = n + 1
			continue
		}
		result := windows.UTF16ToString(buffer[:n])
		if strings.HasPrefix(result, `\\?\UNC\`) {
			result = `\\` + strings.TrimPrefix(result, `\\?\UNC\`)
		} else if strings.HasPrefix(result, `\\?\`) && len(result) >= 6 && result[5] == ':' {
			result = strings.TrimPrefix(result, `\\?\`)
		}
		return filepath.Clean(result), nil
	}
	return "", errors.New("canonical Windows path exceeds 32768 UTF-16 units")
}
func extendedWindowsPath(path string) string {
	if strings.HasPrefix(path, `\\?\`) || strings.HasPrefix(path, `\\.\`) {
		return path
	}
	if strings.HasPrefix(path, `\\`) {
		return `\\?\UNC\` + strings.TrimPrefix(path, `\\`)
	}
	return `\\?\` + path
}

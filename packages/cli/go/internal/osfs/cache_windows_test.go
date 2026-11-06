//go:build windows

package osfs

import (
	"os"
	"path/filepath"
	"testing"
	"unsafe"

	"golang.org/x/sys/windows"
)

func TestPrivateDirectoryInheritance(t *testing.T) {
	for _, temporary := range []bool{false, true} {
		root := filepath.Join(t.TempDir(), "cache")
		if temporary {
			var err error
			root, err = PrivateDirectory(filepath.Dir(root), "operation-")
			if err != nil {
				t.Fatal(err)
			}
		} else if err := PreparePrivateCache(root); err != nil {
			t.Fatal(err)
		}
		nested := filepath.Join(root, "nested", "deeper")
		if err := os.MkdirAll(nested, 0700); err != nil {
			t.Fatal(err)
		}
		file := filepath.Join(nested, "inherited.txt")
		if err := os.WriteFile(file, []byte("private"), 0600); err != nil {
			t.Fatal(err)
		}
		user, err := windows.GetCurrentProcessToken().GetTokenUser()
		if err != nil {
			t.Fatal(err)
		}
		for _, path := range []string{nested, file} {
			sd, err := windows.GetNamedSecurityInfo(path, windows.SE_FILE_OBJECT, windows.DACL_SECURITY_INFORMATION)
			if err != nil {
				t.Fatal(err)
			}
			dacl, _, err := sd.DACL()
			if err != nil || dacl == nil || dacl.AceCount != 1 {
				t.Fatalf("private inherited DACL missing: %s: %v", path, err)
			}
			var ace *windows.ACCESS_ALLOWED_ACE
			if err := windows.GetAce(dacl, 0, &ace); err != nil {
				t.Fatal(err)
			}
			sid := (*windows.SID)(unsafe.Pointer(&ace.SidStart))
			if ace.Header.AceType != windows.ACCESS_ALLOWED_ACE_TYPE || ace.Header.AceFlags&windows.INHERITED_ACE == 0 || ace.Mask != 0x001f01ff || !sid.Equals(user.User.Sid) {
				t.Fatalf("child did not inherit user-only full access: %s", path)
			}
		}
	}
}

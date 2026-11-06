//go:build windows

package proc

import (
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"os"
	"path/filepath"
	"testing"
	"time"

	"golang.org/x/sys/windows"
)

func TestWindowsJobJoinsObservedMembersAndRejectsForeignProcess(t *testing.T) {
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	input, writer, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	defer writer.Close()
	dir := t.TempDir()
	command, containment, err := containedCommand([]string{exe, "-test.run=^TestForegroundInputHelper$"}, nil, "")
	if err != nil {
		t.Fatal(err)
	}
	defer containment.close()
	command.Stdin = input
	command.Env = append(os.Environ(), "XPLAT_GO_INPUT_HELPER=echo", "XPLAT_GO_INPUT_DIRECTORY="+dir)
	if err := command.Start(); err != nil {
		t.Fatal(err)
	}
	done := make(chan struct{})
	go func() { _ = command.Wait(); close(done) }()
	defer func() { containment.kill(); <-done; _ = containment.wait() }()
	if err := containment.attach(command); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(5 * time.Second)
	for !osfs.PathExists(filepath.Join(dir, "input.ready")) && time.Now().Before(deadline) {
		time.Sleep(5 * time.Millisecond)
	}
	if !osfs.PathExists(filepath.Join(dir, "input.ready")) {
		t.Fatal("owned child did not initialize")
	}
	if retained, err := containment.retainMember(windows.GetCurrentProcessId()); err != nil || retained {
		t.Fatal("foreign process was admitted as an owned job member", retained, err)
	}
	containment.kill()
	if len(containment.members) < 2 {
		t.Fatal("only the launcher was retained; actual child was omitted", len(containment.members))
	}
	if err := containment.wait(); err != nil {
		t.Fatal(err)
	}
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("launcher did not join")
	}
	for _, handle := range containment.members {
		state, err := windows.WaitForSingleObject(handle, 0)
		if err != nil || state != windows.WAIT_OBJECT_0 {
			t.Fatal("cleanup returned with an unjoined member", state, err)
		}
	}
}

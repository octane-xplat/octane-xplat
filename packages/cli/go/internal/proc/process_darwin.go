//go:build darwin

package proc

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"golang.org/x/sys/unix"
)

func observeUnixExit(pid int) error {
	// SZOMB from Darwin's sys/proc.h. x/sys supplies the typed kernel record;
	// observing it does not reap the child or release its PID/group identity.
	const zombie = 5
	changed := make(chan os.Signal, 1)
	signal.Notify(changed, syscall.SIGCHLD)
	defer signal.Stop(changed)
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()
	for {
		info, err := unix.SysctlKinfoProc("kern.proc.pid", pid)
		if err != nil {
			return err
		}
		if info == nil || info.Proc.P_pid != int32(pid) {
			return fmt.Errorf("child disappeared before reaping")
		}
		if info.Proc.P_stat == zombie {
			return nil
		}
		select {
		case <-changed:
		case <-ticker.C:
		}
	}
}
func groupHasOthers(pid int) (bool, error) {
	processes, err := unix.SysctlKinfoProcSlice("kern.proc.all")
	if err != nil {
		return false, err
	}
	for _, process := range processes {
		if process.Eproc.Pgid == int32(pid) && process.Proc.P_pid != int32(pid) {
			return true, nil
		}
	}
	return false, nil
}

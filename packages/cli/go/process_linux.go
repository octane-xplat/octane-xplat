//go:build linux

package main

import (
	"errors"
	"os"
	"strconv"

	"golang.org/x/sys/unix"
)

func observeUnixExit(pid int) error {
	var info unix.Siginfo
	for {
		err := unix.Waitid(unix.P_PID, pid, &info, unix.WEXITED|unix.WNOWAIT, nil)
		if errors.Is(err, unix.EINTR) {
			continue
		}
		return err
	}
}
func groupHasOthers(pid int) (bool, error) {
	processes, err := os.ReadDir("/proc")
	if err != nil {
		return false, err
	}
	for _, process := range processes {
		candidate, err := strconv.Atoi(process.Name())
		if err != nil || candidate == pid {
			continue
		}
		group, err := unix.Getpgid(candidate)
		if errors.Is(err, unix.ESRCH) {
			continue
		}
		if err != nil {
			return false, err
		}
		if group == pid {
			return true, nil
		}
	}
	return false, nil
}

//go:build darwin || linux

package main

import (
	"errors"
	"os/exec"
	"syscall"
	"time"
)

type processContainment struct{ pid int }

func containedCommand(argv []string) (*exec.Cmd, *processContainment, error) {
	cmd := exec.Command(argv[0], argv[1:]...)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	return cmd, &processContainment{}, nil
}
func (c *processContainment) attach(cmd *exec.Cmd) error { c.pid = cmd.Process.Pid; return nil }
func (c *processContainment) terminate() {
	if c.pid > 0 {
		_ = syscall.Kill(-c.pid, syscall.SIGTERM)
	}
}
func (c *processContainment) kill() {
	if c.pid > 0 {
		_ = syscall.Kill(-c.pid, syscall.SIGKILL)
	}
}
func (c *processContainment) wait() error {
	// Reaping grandchildren is the OS reaper's job. Require disappearance of the
	// group, with a bounded grace for reaping; never report cleanup early.
	deadline := time.Now().Add(4 * time.Second)
	for time.Now().Before(deadline) {
		if errors.Is(syscall.Kill(-c.pid, 0), syscall.ESRCH) {
			return nil
		}
		time.Sleep(10 * time.Millisecond)
	}
	return errors.New("owned process group did not disappear after termination")
}
func (c *processContainment) close() {}
func ownerCommand(exe string, argv []string) *exec.Cmd {
	cmd := exec.Command(exe, argv...)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
	return cmd
}

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
	// The unreaped leader intentionally remains in the group. Require every
	// other kernel identity to disappear before releasing that reservation.
	deadline := time.Now().Add(4 * time.Second)
	for time.Now().Before(deadline) {
		others, err := groupHasOthers(c.pid)
		if err != nil {
			return err
		}
		if !others {
			return nil
		}
		time.Sleep(10 * time.Millisecond)
	}
	return errors.New("owned process group did not disappear after termination")
}
func (c *processContainment) observeExit(*exec.Cmd) error      { return observeUnixExit(c.pid) }
func (c *processContainment) observationFailed(err error) bool { return err != nil }
func (c *processContainment) reap(cmd *exec.Cmd) error         { return cmd.Wait() }
func (c *processContainment) close()                           {}
func ownerCommand(exe string, argv []string) *exec.Cmd {
	cmd := exec.Command(exe, argv...)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
	return cmd
}

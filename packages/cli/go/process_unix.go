//go:build darwin || linux

package main

import (
	"errors"
	"golang.org/x/sys/unix"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"
)

type processContainment struct {
	pid                                   int
	terminal                              *os.File
	terminalSettings                      *unix.Termios
	previousGroup                         int
	gate, gateReader, events, eventWriter *os.File
	interrupted                           chan struct{}
}

func containedCommand(argv []string, input *os.File) (*exec.Cmd, *processContainment, error) {
	c := &processContainment{}
	cmd := exec.Command(argv[0], argv[1:]...)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	if input == nil {
		return cmd, c, nil
	}
	settings, err := terminalState(input)
	if err != nil {
		return cmd, c, nil
	}
	c.terminal, c.terminalSettings = input, settings
	previous, err := unix.IoctlGetInt(int(input.Fd()), unix.TIOCGPGRP)
	// A supplied PTY may be a terminal without being this process's controlling
	// terminal. It needs no foreground job-control handoff.
	if errors.Is(err, syscall.ENOTTY) {
		return cmd, c, nil
	}
	if err != nil {
		return nil, nil, err
	}
	if previous != syscall.Getpgrp() {
		return nil, nil, errors.New("CLI does not own foreground terminal input")
	}
	c.terminal, c.previousGroup = input, previous
	c.gateReader, c.gate, err = os.Pipe()
	if err != nil {
		return nil, nil, err
	}
	c.events, c.eventWriter, err = os.Pipe()
	if err != nil {
		c.close()
		return nil, nil, err
	}
	exe, err := os.Executable()
	if err != nil {
		c.close()
		return nil, nil, err
	}
	cmd = exec.Command(exe, append([]string{"_gate", "3", "4"}, argv...)...)
	cmd.ExtraFiles = []*os.File{c.gateReader, c.eventWriter}
	cmd.SysProcAttr = &syscall.SysProcAttr{Foreground: true, Ctty: int(input.Fd())}
	c.interrupted = make(chan struct{}, 1)
	return cmd, c, nil
}
func (c *processContainment) attach(cmd *exec.Cmd) error {
	c.pid = cmd.Process.Pid
	if c.gate == nil {
		return nil
	}
	_ = c.gateReader.Close()
	_ = c.eventWriter.Close()
	go func() {
		var event [1]byte
		if n, _ := c.events.Read(event[:]); n == 1 && event[0] == 1 {
			c.interrupted <- struct{}{}
		}
	}()
	_, err := c.gate.Write([]byte{1})
	_ = c.gate.Close()
	return err
}
func (c *processContainment) interrupts() <-chan struct{} { return c.interrupted }
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
func (c *processContainment) close() error {
	var restoreErr error
	if c.terminal != nil {
		// One-shot CLI dispatch owns this terminal. A caught SIGTTOU still
		// permits EIO for orphaned background groups; restoration must ignore
		// it, then restore the inherited default/ignored state. Hosts never
		// receive a foreground input capability.
		wasIgnored := signal.Ignored(syscall.SIGTTOU)
		signal.Ignore(syscall.SIGTTOU)
		if c.previousGroup != 0 {
			restoreErr = unix.IoctlSetPointerInt(int(c.terminal.Fd()), unix.TIOCSPGRP, c.previousGroup)
		}
		restoreErr = errors.Join(restoreErr, restoreTerminalState(c.terminal, c.terminalSettings))
		if !wasIgnored {
			signal.Reset(syscall.SIGTTOU)
		}
	}
	for _, file := range []*os.File{c.gate, c.gateReader, c.events, c.eventWriter} {
		if file != nil {
			_ = file.Close()
		}
	}
	return restoreErr
}
func ownerCommand(exe string, argv []string) *exec.Cmd {
	cmd := exec.Command(exe, argv...)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
	return cmd
}

func privateInterruptFile(file *os.File) error { syscall.CloseOnExec(int(file.Fd())); return nil }

func containedChildExitCode(err *exec.ExitError) int {
	if status, ok := err.Sys().(syscall.WaitStatus); ok && status.Signaled() {
		return 128 + int(status.Signal())
	}
	return err.ExitCode()
}

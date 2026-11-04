//go:build windows

package main

import (
	"errors"
	"golang.org/x/sys/windows"
	"os"
	"os/exec"
	"strconv"
	"syscall"
	"time"
	"unsafe"
)

type processContainment struct {
	job    windows.Handle
	gate   *os.File
	reader *os.File
}

func containedCommand(argv []string, _ *os.File) (*exec.Cmd, *processContainment, error) {
	exe, err := os.Executable()
	if err != nil {
		return nil, nil, err
	}
	job, err := windows.CreateJobObject(nil, nil)
	if err != nil {
		return nil, nil, err
	}
	limits := windows.JOBOBJECT_EXTENDED_LIMIT_INFORMATION{}
	limits.BasicLimitInformation.LimitFlags = windows.JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
	if _, err = windows.SetInformationJobObject(job, windows.JobObjectExtendedLimitInformation, uintptr(unsafe.Pointer(&limits)), uint32(unsafe.Sizeof(limits))); err != nil {
		windows.CloseHandle(job)
		return nil, nil, err
	}
	reader, gate, err := os.Pipe()
	if err != nil {
		windows.CloseHandle(job)
		return nil, nil, err
	}
	if err = windows.SetHandleInformation(windows.Handle(reader.Fd()), windows.HANDLE_FLAG_INHERIT, windows.HANDLE_FLAG_INHERIT); err != nil {
		reader.Close()
		gate.Close()
		windows.CloseHandle(job)
		return nil, nil, err
	}
	cmd := exec.Command(exe, append([]string{"_gate", strconv.FormatUint(uint64(reader.Fd()), 10), "0"}, argv...)...)
	cmd.SysProcAttr = &syscall.SysProcAttr{CreationFlags: windows.CREATE_NEW_PROCESS_GROUP, AdditionalInheritedHandles: []syscall.Handle{syscall.Handle(reader.Fd())}}
	return cmd, &processContainment{job: job, gate: gate, reader: reader}, nil
}
func (c *processContainment) attach(cmd *exec.Cmd) error {
	_ = c.reader.Close()
	h, err := windows.OpenProcess(windows.PROCESS_SET_QUOTA|windows.PROCESS_TERMINATE, false, uint32(cmd.Process.Pid))
	if err != nil {
		return err
	}
	defer windows.CloseHandle(h)
	if err = windows.AssignProcessToJobObject(c.job, h); err != nil {
		return err
	}
	_, err = c.gate.Write([]byte{1})
	_ = c.gate.Close()
	return err
}
func (c *processContainment) terminate()                      { c.kill() }
func (c *processContainment) observeExit(cmd *exec.Cmd) error { return cmd.Wait() }
func (c *processContainment) observationFailed(error) bool    { return false }
func (c *processContainment) reap(*exec.Cmd) error            { return nil }
func (c *processContainment) kill()                           { _ = windows.TerminateJobObject(c.job, 1) }
func (c *processContainment) wait() error {
	var accounting struct {
		User, Kernel, PeriodUser, PeriodKernel int64
		PageFaults, Total, Active, Terminated  uint32
	}
	deadline := time.Now().Add(4 * time.Second)
	for time.Now().Before(deadline) {
		if err := windows.QueryInformationJobObject(c.job, windows.JobObjectBasicAccountingInformation, uintptr(unsafe.Pointer(&accounting)), uint32(unsafe.Sizeof(accounting)), nil); err != nil {
			return err
		}
		if accounting.Active == 0 {
			return nil
		}
		time.Sleep(10 * time.Millisecond)
	}
	return errors.New("owned Windows job still has active descendants")
}
func (c *processContainment) close() error {
	if c.reader != nil {
		_ = c.reader.Close()
	}
	if c.gate != nil {
		_ = c.gate.Close()
	}
	return windows.CloseHandle(c.job)
}
func ownerCommand(exe string, argv []string) *exec.Cmd {
	cmd := exec.Command(exe, argv...)
	cmd.SysProcAttr = &syscall.SysProcAttr{CreationFlags: windows.DETACHED_PROCESS | windows.CREATE_NEW_PROCESS_GROUP}
	return cmd
}

func (c *processContainment) interrupts() <-chan struct{} { return nil }

func privateInterruptFile(file *os.File) error {
	return windows.SetHandleInformation(windows.Handle(file.Fd()), windows.HANDLE_FLAG_INHERIT, 0)
}

func containedChildExitCode(err *exec.ExitError) int { return err.ExitCode() }

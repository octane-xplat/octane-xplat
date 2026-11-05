//go:build windows

package main

import (
	"errors"
	"fmt"
	"golang.org/x/sys/windows"
	"os"
	"os/exec"
	"strconv"
	"syscall"
	"time"
	"unsafe"
)

type processContainment struct {
	job        windows.Handle
	gate       *os.File
	reader     *os.File
	members    []windows.Handle
	captured   bool
	cleanupErr error
}

func containedCommand(argv []string, _ *os.File, helper string) (*exec.Cmd, *processContainment, error) {
	exe, err := helperExecutable(helper)
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
func (c *processContainment) kill() {
	if !c.captured {
		c.captured = true
		c.cleanupErr = errors.Join(c.cleanupErr, c.captureMembers())
	}
	if err := windows.TerminateJobObject(c.job, 1); err != nil {
		c.cleanupErr = errors.Join(c.cleanupErr, fmt.Errorf("terminate owned Windows job: %w", err))
	}
}

var processIsInJob = windows.NewLazySystemDLL("kernel32.dll").NewProc("IsProcessInJob")

// These handles grant observation/waiting, never signal authority from a PID.
// Revalidate membership after opening: a process may exit while enumerating.
func (c *processContainment) retainMember(pid uint32) (bool, error) {
	handle, err := windows.OpenProcess(windows.SYNCHRONIZE|windows.PROCESS_QUERY_LIMITED_INFORMATION, false, pid)
	if errors.Is(err, windows.ERROR_INVALID_PARAMETER) {
		return false, nil // Already exited.
	}
	if err != nil {
		return false, err
	}
	var member int32
	ok, _, callErr := processIsInJob.Call(uintptr(handle), uintptr(c.job), uintptr(unsafe.Pointer(&member)))
	if ok == 0 || member == 0 {
		_ = windows.CloseHandle(handle)
		if ok == 0 {
			return false, fmt.Errorf("validate owned job membership: %w", callErr)
		}
		return false, nil
	}
	c.members = append(c.members, handle)
	return true, nil
}

func (c *processContainment) captureMembers() error {
	var list struct {
		assigned, count uint32
		ids             [4096]uintptr
	}
	if err := windows.QueryInformationJobObject(c.job, windows.JobObjectBasicProcessIdList, uintptr(unsafe.Pointer(&list)), uint32(unsafe.Sizeof(list)), nil); err != nil {
		return fmt.Errorf("enumerate owned Windows job: %w", err)
	}
	if list.count > uint32(len(list.ids)) {
		return errors.New("owned Windows job exceeds process observation bound")
	}
	var failure error
	for _, pid := range list.ids[:list.count] {
		if _, err := c.retainMember(uint32(pid)); err != nil {
			failure = errors.Join(failure, err)
		}
	}
	return failure
}
func (c *processContainment) wait() error {
	var accounting struct {
		User, Kernel, PeriodUser, PeriodKernel int64
		PageFaults, Total, Active, Terminated  uint32
	}
	deadline := time.Now().Add(4 * time.Second)
	failure := c.cleanupErr
	for {
		if err := windows.QueryInformationJobObject(c.job, windows.JobObjectBasicAccountingInformation, uintptr(unsafe.Pointer(&accounting)), uint32(unsafe.Sizeof(accounting)), nil); err != nil {
			failure = errors.Join(failure, err)
			break
		}
		if accounting.Active == 0 {
			break
		}
		if !time.Now().Before(deadline) {
			failure = errors.Join(failure, errors.New("owned Windows job still has active descendants"))
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	// Job accounting and launcher exit alone do not join the actual engine.
	// Keep its observed kernel handles until their termination is signaled.
	for _, handle := range c.members {
		remaining := time.Until(deadline).Milliseconds()
		if remaining < 0 {
			remaining = 0
		}
		state, err := windows.WaitForSingleObject(handle, uint32(remaining))
		if err != nil {
			failure = errors.Join(failure, err)
		} else if state != windows.WAIT_OBJECT_0 {
			pid, _ := windows.GetProcessId(handle)
			var exitCode uint32
			_ = windows.GetExitCodeProcess(handle, &exitCode)
			failure = errors.Join(failure, fmt.Errorf("owned Windows job member %d did not finish cleanup before deadline (exit code %d)", pid, exitCode))
			break
		}
	}
	return failure
}
func (c *processContainment) close() error {
	if c.reader != nil {
		_ = c.reader.Close()
	}
	if c.gate != nil {
		_ = c.gate.Close()
	}
	var failure error
	for _, handle := range c.members {
		failure = errors.Join(failure, windows.CloseHandle(handle))
	}
	c.members = nil
	return errors.Join(failure, windows.CloseHandle(c.job))
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

func processExitSignal(*os.ProcessState) int { return 0 }

func (c *processContainment) interrupt() { c.terminate() }

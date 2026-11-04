package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/signal"
	"strconv"
	"sync"
	"time"
)

const captureLimit = 4 << 20

type limitedCapture struct {
	sync.Mutex
	buffer    bytes.Buffer
	Truncated bool
}

func (b *limitedCapture) Write(p []byte) (int, error) {
	b.Lock()
	defer b.Unlock()
	n := len(p)
	remaining := captureLimit - b.buffer.Len()
	if len(p) > remaining {
		p = p[:remaining]
		b.Truncated = true
	}
	_, _ = b.buffer.Write(p)
	return n, nil
}

func (b *limitedCapture) String() string {
	b.Lock()
	defer b.Unlock()
	return b.buffer.String()
}

type processResult struct {
	ExitCode  int    `json:"exitCode"`
	Stdout    string `json:"stdout"`
	Stderr    string `json:"stderr"`
	Truncated bool   `json:"truncated"`
	Cancelled bool   `json:"cancelled"`
}

type processCleanupError struct{ Err error }

func (err *processCleanupError) Error() string {
	return "process cleanup not confirmed: " + err.Err.Error()
}
func (err *processCleanupError) Unwrap() error { return err.Err }

// Every started operation owns a process group/job until cleanup completes.
// WaitDelay bounds pipes inherited by a descendant after its parent exits.
func runProcess(ctx context.Context, argv []string, cwd string, env []string) (processResult, error) {
	return runProcessIO(ctx, argv, cwd, env, nil, nil)
}

// Inherited OS streams keep compiler output live without a Go forwarding
// goroutine blocked on a downstream reader. Group/job ownership is identical
// to captured workers; final diagnostics are printed only after cleanup.
// Only one-shot CLI dispatch supplies this capability. Owner/service contexts
// have no terminal input, even when they call the same command handlers.
type foregroundInputKey struct{}
type processHelperKey struct{}

func foregroundCommandContext(ctx context.Context, input *os.File) context.Context {
	return context.WithValue(ctx, foregroundInputKey{}, input)
}
func foregroundInput(ctx context.Context) *os.File {
	input, _ := ctx.Value(foregroundInputKey{}).(*os.File)
	return input
}
func runForegroundProcessIO(ctx context.Context, argv []string, cwd string, env []string, output, diagnostic *os.File) (processResult, error) {
	return runProcessStdio(ctx, argv, cwd, env, foregroundInput(ctx), output, diagnostic)
}

func runProcessIO(ctx context.Context, argv []string, cwd string, env []string, output, diagnostic *os.File) (processResult, error) {
	return runProcessStdio(ctx, argv, cwd, env, nil, output, diagnostic)
}

func runProcessStdio(ctx context.Context, argv []string, cwd string, env []string, input, output, diagnostic *os.File) (result processResult, returnErr error) {
	if err := ctx.Err(); err != nil {
		return processResult{}, err
	}
	helper, _ := ctx.Value(processHelperKey{}).(string)
	cmd, containment, err := containedCommand(argv, input, helper)
	if err != nil {
		return processResult{}, err
	}
	defer func() {
		if err := containment.close(); err != nil {
			returnErr = &processCleanupError{errors.Join(returnErr, err)}
		}
	}()
	cmd.Dir = cwd
	cmd.Env = env
	cmd.WaitDelay = 500 * time.Millisecond
	if input != nil {
		cmd.Stdin = input
	}
	var stdout, stderr limitedCapture
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if output != nil {
		cmd.Stdout = output
	}
	if diagnostic != nil {
		cmd.Stderr = diagnostic
	}
	if err = cmd.Start(); err != nil {
		return processResult{}, err
	}
	if err = containment.attach(cmd); err != nil {
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
		return processResult{}, err
	}
	done := make(chan error, 1)
	go func() { done <- containment.observeExit(cmd) }()
	cancelled, interrupted := false, false
	select {
	case err = <-done:
	case <-ctx.Done():
		cancelled = true
	case <-containment.interrupts():
		cancelled, interrupted = true, true
	}
	if cancelled {
		containment.terminate()
		select {
		case err = <-done:
		case <-time.After(500 * time.Millisecond):
			containment.kill()
			err = <-done
		}
	}
	// Unix observes termination without reaping: its leader reserves the group
	// identity until all group signals and descendant checks have finished.
	// Windows retains a job handle independently of the leader's process handle.
	if containment.observationFailed(err) {
		_ = containment.reap(cmd)
		return processResult{}, &processCleanupError{fmt.Errorf("could not reserve child identity: %w", err)}
	}
	// Successful workers must not leave ordinary group/job descendants behind.
	containment.kill()
	cleanupErr := containment.wait()
	if reapErr := containment.reap(cmd); reapErr != nil {
		err = reapErr
	}
	if cleanupErr != nil {
		return processResult{}, &processCleanupError{cleanupErr}
	}
	result = processResult{ExitCode: cmd.ProcessState.ExitCode(), Stdout: stdout.String(), Stderr: stderr.String(), Truncated: stdout.Truncated || stderr.Truncated || err == exec.ErrWaitDelay, Cancelled: cancelled}
	if err != nil {
		if _, ok := err.(*exec.ExitError); !ok && err != exec.ErrWaitDelay {
			return result, fmt.Errorf("process wait: %w", err)
		}
	}
	if interrupted || (input != nil && buildTerminal(input) && result.ExitCode == 130) {
		result.Cancelled = true
		return result, context.Canceled
	}
	return result, nil
}

// The Windows job gate does not launch project code until assignment succeeds.
func childGate(argv []string) {
	var release [1]byte
	if len(argv) < 3 {
		os.Exit(125)
	}
	handle, err := strconv.ParseUint(argv[0], 10, 64)
	if err != nil {
		os.Exit(125)
	}
	gate := os.NewFile(uintptr(handle), "job-release")
	if gate == nil {
		os.Exit(125)
	}
	_, err = io.ReadFull(gate, release[:])
	_ = gate.Close()
	if err != nil || release[0] != 1 {
		os.Exit(125)
	}
	if argv[1] != "0" {
		eventHandle, err := strconv.ParseUint(argv[1], 10, 64)
		if err != nil {
			os.Exit(125)
		}
		events := os.NewFile(uintptr(eventHandle), "terminal-interrupt")
		if events == nil {
			os.Exit(125)
		}
		if err := privateInterruptFile(events); err != nil {
			os.Exit(125)
		}
		interrupts := make(chan os.Signal, 1)
		signal.Notify(interrupts, os.Interrupt)
		go func() { <-interrupts; _, _ = events.Write([]byte{1}) }()
	}
	cmd := exec.Command(argv[2], argv[3:]...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		if e, ok := err.(*exec.ExitError); ok {
			os.Exit(containedChildExitCode(e))
		}
		fmt.Fprintln(os.Stderr, err)
		os.Exit(127)
	}
}

func helperExecutable(path string) (string, error) {
	if path != "" {
		return path, nil
	}
	return os.Executable()
}

package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
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
func runProcessIO(ctx context.Context, argv []string, cwd string, env []string, output, diagnostic *os.File) (processResult, error) {
	if err := ctx.Err(); err != nil {
		return processResult{}, err
	}
	cmd, containment, err := containedCommand(argv)
	if err != nil {
		return processResult{}, err
	}
	defer containment.close()
	cmd.Dir = cwd
	cmd.Env = env
	cmd.WaitDelay = 500 * time.Millisecond
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
	cancelled := false
	select {
	case err = <-done:
	case <-ctx.Done():
		cancelled = true
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
	result := processResult{ExitCode: cmd.ProcessState.ExitCode(), Stdout: stdout.String(), Stderr: stderr.String(), Truncated: stdout.Truncated || stderr.Truncated || err == exec.ErrWaitDelay, Cancelled: cancelled}
	if err != nil {
		if _, ok := err.(*exec.ExitError); !ok && err != exec.ErrWaitDelay {
			return result, fmt.Errorf("process wait: %w", err)
		}
	}
	return result, nil
}

// The Windows job gate does not launch project code until assignment succeeds.
func childGate(argv []string) {
	var release [1]byte
	if len(argv) == 0 {
		os.Exit(125)
	}
	if _, err := io.ReadFull(os.Stdin, release[:]); err != nil || release[0] != 1 {
		os.Exit(125)
	}
	cmd := exec.Command(argv[0], argv[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		if e, ok := err.(*exec.ExitError); ok {
			os.Exit(e.ExitCode())
		}
		fmt.Fprintln(os.Stderr, err)
		os.Exit(127)
	}
}

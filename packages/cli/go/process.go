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
	bytes.Buffer
	Truncated bool
}

func (b *limitedCapture) Write(p []byte) (int, error) {
	b.Lock()
	defer b.Unlock()
	n := len(p)
	remaining := captureLimit - b.Len()
	if len(p) > remaining {
		p = p[:remaining]
		b.Truncated = true
	}
	_, _ = b.Buffer.Write(p)
	return n, nil
}

type processResult struct {
	ExitCode  int    `json:"exitCode"`
	Stdout    string `json:"stdout"`
	Stderr    string `json:"stderr"`
	Truncated bool   `json:"truncated"`
	Cancelled bool   `json:"cancelled"`
}

// Every started operation owns a process group/job until cleanup completes.
// WaitDelay bounds pipes inherited by a descendant after its parent exits.
func runProcess(ctx context.Context, argv []string, cwd string, env []string) (processResult, error) {
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
	if err = cmd.Start(); err != nil {
		return processResult{}, err
	}
	if err = containment.attach(cmd); err != nil {
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
		return processResult{}, err
	}
	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()
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
	// Successful workers must not leave daemonized descendants behind either.
	containment.kill()
	if cleanupErr := containment.wait(); cleanupErr != nil {
		return processResult{}, cleanupErr
	}
	result := processResult{ExitCode: cmd.ProcessState.ExitCode(), Stdout: stdout.String(), Stderr: stderr.String(), Truncated: stdout.Truncated || stderr.Truncated, Cancelled: cancelled}
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

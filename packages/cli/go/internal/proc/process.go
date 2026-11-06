package proc

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

const CaptureLimit = 4 << 20

type LimitedCapture struct {
	sync.Mutex
	buffer    bytes.Buffer
	Truncated bool
}

func (b *LimitedCapture) Write(p []byte) (int, error) {
	b.Lock()
	defer b.Unlock()
	n := len(p)
	remaining := CaptureLimit - b.buffer.Len()
	if len(p) > remaining {
		p = p[:remaining]
		b.Truncated = true
	}
	_, _ = b.buffer.Write(p)
	return n, nil
}

func (b *LimitedCapture) String() string {
	b.Lock()
	defer b.Unlock()
	return b.buffer.String()
}

type processObserverKey struct{}

func withProcessObserver(ctx context.Context, observe func(Result)) context.Context {
	return context.WithValue(ctx, processObserverKey{}, observe)
}

func processObserver(ctx context.Context) func(Result) {
	observe, _ := ctx.Value(processObserverKey{}).(func(Result))
	return observe
}

type Result struct {
	Signal    int    `json:"signal,omitempty"`
	ExitCode  int    `json:"exitCode"`
	Stdout    string `json:"stdout"`
	Stderr    string `json:"stderr"`
	Truncated bool   `json:"truncated"`
	Cancelled bool   `json:"cancelled"`
}

type CleanupError struct{ Err error }

func (e *CleanupError) RequiresFailureEvidence() bool { return true }

func (err *CleanupError) Error() string {
	return "process cleanup not confirmed: " + err.Err.Error()
}
func (err *CleanupError) Unwrap() error { return err.Err }

// Every started operation owns a process group/job until cleanup completes.
// WaitDelay bounds pipes inherited by a descendant after its parent exits.
func RunProcess(ctx context.Context, argv []string, cwd string, env []string) (Result, error) {
	return RunProcessIO(ctx, argv, cwd, env, nil, nil)
}

// Inherited OS streams keep compiler output live without a Go forwarding
// goroutine blocked on a downstream reader. Group/job ownership is identical
// to captured workers; final diagnostics are printed only after cleanup.
// Only one-shot CLI dispatch supplies this capability. Owner/service contexts
// have no terminal input, even when they call the same command handlers.
type foregroundInputKey struct{}
type ProcessHelperKey struct{}
type ProcessGraceKey struct{}

func ForegroundCommandContext(ctx context.Context, input *os.File) context.Context {
	return context.WithValue(ctx, foregroundInputKey{}, input)
}
func ForegroundInput(ctx context.Context) *os.File {
	input, _ := ctx.Value(foregroundInputKey{}).(*os.File)
	return input
}
func RunForegroundProcessIO(ctx context.Context, argv []string, cwd string, env []string, output, diagnostic *os.File) (Result, error) {
	return RunProcessStdio(ctx, argv, cwd, env, ForegroundInput(ctx), output, diagnostic)
}

func RunProcessIO(ctx context.Context, argv []string, cwd string, env []string, output, diagnostic *os.File) (Result, error) {
	return RunProcessStdio(ctx, argv, cwd, env, nil, output, diagnostic)
}

func RunProcessStdio(ctx context.Context, argv []string, cwd string, env []string, input, output, diagnostic *os.File) (result Result, returnErr error) {
	if observe := processObserver(ctx); observe != nil {
		defer func() { observe(result) }()
	}
	if err := ctx.Err(); err != nil {
		return Result{}, err
	}
	helper, _ := ctx.Value(ProcessHelperKey{}).(string)
	cmd, containment, err := containedCommand(argv, input, helper)
	if err != nil {
		return Result{}, err
	}
	defer func() {
		if err := containment.close(); err != nil {
			returnErr = &CleanupError{errors.Join(returnErr, err)}
		}
	}()
	cmd.Dir = cwd
	cmd.Env = env
	cmd.WaitDelay = 500 * time.Millisecond
	if input != nil {
		cmd.Stdin = input
	}
	var stdout, stderr LimitedCapture
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if output != nil {
		cmd.Stdout = output
	}
	if diagnostic != nil {
		cmd.Stderr = diagnostic
	}
	if err = cmd.Start(); err != nil {
		return Result{}, err
	}
	if err = containment.attach(cmd); err != nil {
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
		return Result{}, err
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
		if state, ok := ctx.Value(cliSignalKey{}).(*cliSignalState); ok && state.number.Load() == 2 {
			containment.interrupt()
		} else {
			containment.terminate()
		}
		grace := 500 * time.Millisecond
		if requested, ok := ctx.Value(ProcessGraceKey{}).(time.Duration); ok && requested > 0 && requested <= 5*time.Second {
			grace = requested
		}
		select {
		case err = <-done:
		case <-time.After(grace):
			containment.kill()
			err = <-done
		}
	}
	// Unix observes termination without reaping: its leader reserves the group
	// identity until all group signals and descendant checks have finished.
	// Windows retains a job handle independently of the leader's process handle.
	if containment.observationFailed(err) {
		_ = containment.reap(cmd)
		return Result{}, &CleanupError{fmt.Errorf("could not reserve child identity: %w", err)}
	}
	// Successful workers must not leave ordinary group/job descendants behind.
	containment.kill()
	cleanupErr := containment.wait()
	if reapErr := containment.reap(cmd); reapErr != nil {
		err = reapErr
	}
	if cleanupErr != nil {
		return Result{}, &CleanupError{cleanupErr}
	}
	result = Result{Signal: processExitSignal(cmd.ProcessState), ExitCode: cmd.ProcessState.ExitCode(), Stdout: stdout.String(), Stderr: stderr.String(), Truncated: stdout.Truncated || stderr.Truncated || err == exec.ErrWaitDelay, Cancelled: cancelled}
	if err != nil {
		if _, ok := err.(*exec.ExitError); !ok && err != exec.ErrWaitDelay {
			return result, fmt.Errorf("process wait: %w", err)
		}
	}
	if interrupted || (input != nil && BuildTerminal(input) && result.ExitCode == 130) {
		result.Cancelled = true
		return result, context.Canceled
	}
	return result, nil
}

// The Windows job gate does not launch project code until assignment succeeds.
func ChildGate(argv []string) {
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

package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"sync/atomic"
	"time"
)

type serviceStart struct {
	Protocol  string `json:"protocol"`
	Version   int    `json:"version"`
	ID        string `json:"id"`
	Project   string `json:"project"`
	Operation string `json:"operation"`
	Target    string `json:"target"`
	Kind      string `json:"kind"`
	PID       int64  `json:"pid,omitempty"`
	URL       string `json:"url,omitempty"`
}

func readServiceStart(path, id, project, operation, target string) (bool, error) {
	info, err := os.Lstat(path)
	if os.IsNotExist(err) || fileSharingViolation(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if !info.Mode().IsRegular() || info.Size() > 64<<10 {
		return false, errors.New("invalid service startup file type/size")
	}
	file, err := os.Open(path)
	if fileSharingViolation(err) {
		return false, nil // The bounded startup observer retries publication locks.
	}
	if err != nil {
		return false, err
	}
	defer file.Close()
	actual, err := file.Stat()
	if err != nil || !os.SameFile(info, actual) {
		return false, errors.New("service startup file changed while opening")
	}
	bytes, err := io.ReadAll(io.LimitReader(file, (64<<10)+1))
	if err != nil {
		return false, err
	}
	var frame serviceStart
	if len(bytes) > 64<<10 || json.Unmarshal(bytes, &frame) != nil {
		return false, errors.New("invalid service startup JSON")
	}
	if frame.Protocol != "octane-project-service" || frame.Version != 1 || frame.ID != id || frame.Project != project || frame.Operation != operation || frame.Target != target {
		return false, errors.New("service startup identity mismatch")
	}
	switch target {
	case "web":
		address, e := url.Parse(frame.URL)
		if e != nil || frame.Kind != "web-listening" || frame.PID != 0 || address.Scheme != "http" || address.User != nil || (address.Hostname() != "localhost" && address.Hostname() != "127.0.0.1" && address.Hostname() != "::1") || address.Path != "/" || address.RawQuery != "" || address.Fragment != "" {
			return false, errors.New("invalid local web service startup evidence")
		}
		port, e := strconv.Atoi(address.Port())
		if e != nil || port < 1 || port > 65535 {
			return false, errors.New("invalid web service port")
		}
	case "macos", "linux", "ios", "android":
		kind := "native-host-spawned"
		if target == "ios" || target == "android" {
			kind = "mobile-tool-spawned"
		}
		if frame.Kind != kind || frame.PID < 1 || frame.PID > 1<<32-1 || frame.URL != "" {
			return false, errors.New("invalid native service launch evidence")
		}
	default:
		return false, errors.New("unsupported service startup target")
	}
	// Evidence is descriptive; PID metadata never grants signal ownership.
	return true, nil
}

func serviceObserver(ctx context.Context, path, id, project, operation, target string, budget time.Duration, started *atomic.Bool, cancel context.CancelCauseFunc) func() {
	stop := make(chan struct{})
	done := make(chan struct{})
	var once sync.Once
	go func() {
		defer close(done)
		timer := time.NewTimer(budget)
		defer timer.Stop()
		tick := time.NewTicker(25 * time.Millisecond)
		defer tick.Stop()
		read := func() bool {
			ok, err := readServiceStart(path, id, project, operation, target)
			if err != nil {
				cancel(err)
				return true
			}
			if ok {
				started.Store(true)
			}
			return ok
		}
		for {
			select {
			case <-ctx.Done():
				return
			case <-stop:
				read()
				return
			case <-tick.C:
				if read() {
					return
				}
			case <-timer.C:
				if !read() {
					cancel(fmt.Errorf("%w: development engine did not publish startup evidence within %s", context.DeadlineExceeded, budget))
				}
				return
			}
		}
	}()
	return func() { once.Do(func() { close(stop) }); <-done }
}

func runServiceWorker(ctx context.Context, project, worker, operation, target string, payload map[string]any, startupBudget time.Duration, input, output, diagnostics *os.File) (workerResult, error) {
	child, cancel := context.WithCancelCause(ctx)
	defer cancel(nil)
	var started atomic.Bool
	profile := ""
	// Compiler config paths must remain in the app, where project module resolution
	// and the canonical config validator permit them. Never put them in node_modules.
	if target == "macos" || target == "linux" {
		var err error
		profile, err = privateDirectory(project, ".xplat-go-profile-")
		if err != nil {
			return workerResult{}, err
		}
	}
	prepare := func(directory, id string, request map[string]any) (func(), error) {
		directory, err := canonical(directory)
		if err != nil {
			return nil, err
		}
		resources := filepath.Join(directory, "resources")
		if err := os.Mkdir(resources, 0700); err != nil {
			return nil, err
		}
		state := filepath.Join(directory, "service.json")
		request["serviceStateFile"] = state
		request["resourceRoot"] = resources
		request["profileRoot"] = profile
		return serviceObserver(child, state, id, project, operation, target, startupBudget, &started, cancel), nil
	}
	result, err := runPreparedWorker(child, project, worker, operation, payload, input, output, diagnostics, prepare)
	var cleanup *processCleanupError
	if errors.As(err, &cleanup) {
		if profile != "" {
			err = fmt.Errorf("%w; owned compiler profile retained at %s", err, profile)
		}
		return result, err
	}
	if profile != "" {
		if removeErr := os.RemoveAll(profile); removeErr != nil {
			return result, fmt.Errorf("compiler profile cleanup failed at %s: %w", profile, removeErr)
		}
	}
	if cause := context.Cause(child); cause != nil && ctx.Err() == nil {
		return result, cause
	}
	var exited *workerExitError
	if errors.As(err, &exited) {
		return result, &projectToolExit{Code: exited.Code}
	}
	if err != nil {
		return result, err
	}
	var receipt struct {
		Version                           int
		Project, Operation, Target, State string
	}
	if json.Unmarshal(result.Data, &receipt) != nil || receipt.Version != 1 || receipt.Project != project || receipt.Operation != operation || receipt.Target != target || receipt.State != "accepted" {
		return result, errors.New("invalid development service receipt")
	}
	if !started.Load() {
		return result, errors.New("development engine exited before startup evidence")
	}
	return result, nil
}

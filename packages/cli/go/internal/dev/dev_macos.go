package dev

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/history"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"path/filepath"
	"time"
)

func readMacDevFrame(path, id, resources, appID string) (*history.MacDevFrame, error) {
	root, err := os.OpenRoot(filepath.Dir(path))
	if err != nil {
		return nil, err
	}
	defer root.Close()
	data, err := history.File(root, filepath.Base(path), 64<<10)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var frame history.MacDevFrame
	if json.Unmarshal(data, &frame) != nil || frame.Protocol != "octane-dev-worker" || frame.Version != 2 || frame.ID != id || frame.OK == nil {
		return nil, errors.New("invalid macOS development worker identity")
	}
	if !*frame.OK {
		return nil, fmt.Errorf("macOS development engine: %s", frame.Error.Message)
	}
	if frame.Data.AppID != appID || appID == "" || frame.Data.PID < 1 || frame.Data.PID > 1<<32-1 || len(frame.Data.Processes) == 0 || len(frame.Data.Processes) > 64 || frame.Data.DroppedProcesses < 0 {
		return nil, errors.New("invalid native launch evidence")
	}
	for _, process := range frame.Data.Processes {
		if process.PID < 1 || process.PID > 1<<32-1 || !filepath.IsAbs(process.Executable) || !osfs.Inside(resources, filepath.Clean(process.Executable)) {
			return nil, errors.New("native executable observation escapes owned resources")
		}
		if _, err = time.Parse(time.RFC3339Nano, process.ObservedAt); err != nil {
			return nil, errors.New("invalid native launch time")
		}
	}
	latest := frame.Data.Processes[len(frame.Data.Processes)-1]
	if frame.Data.PID != latest.PID || frame.Data.Executable != latest.Executable || frame.Data.ObservedAt != latest.ObservedAt {
		return nil, errors.New("native launch history disagrees with latest host")
	}
	return &frame, nil
}
func runMacDevWorker(ctx context.Context, projectPath, entry string, input, out, diagnostics *os.File, capture *history.Capture) (proc.Result, error) {
	manifest, err := project.Manifest(projectPath)
	if err != nil {
		return proc.Result{}, err
	}
	appID := cli.StringValue(cli.ValueAt(manifest, "xplat", "targets", "macos", "package", "bundleIdentifier"))
	if appID == "" {
		appID = "org.octane.dev." + fmt.Sprintf("%x", sha256.Sum256([]byte(projectPath)))[:16]
	}
	directory, err := osfs.PrivateDirectory("", "xplat-go-dev-")
	if err != nil {
		return proc.Result{}, err
	}
	safe := true
	defer func() {
		if safe {
			os.RemoveAll(directory)
		}
	}()
	directory, err = osfs.Canonical(directory)
	if err != nil {
		return proc.Result{}, err
	}
	resources := filepath.Join(directory, "resources")
	if err = os.Mkdir(resources, 0700); err != nil {
		return proc.Result{}, err
	}
	id := osfs.Identity()
	request := filepath.Join(directory, "request.json")
	state := filepath.Join(directory, "ready.json")
	bytes, _ := json.Marshal(map[string]any{"protocol": "octane-dev-worker", "version": 2, "id": id, "operation": "macos-dev", "project": projectPath, "resourceRoot": resources})
	if err = osfs.PrivateFile(request, bytes); err != nil {
		return proc.Result{}, err
	}
	child, cancel := context.WithCancelCause(ctx)
	defer cancel(nil)
	stop, done := make(chan struct{}), make(chan struct{})
	go func() {
		defer close(done)
		ticker := time.NewTicker(25 * time.Millisecond)
		defer ticker.Stop()
		timer := time.NewTimer(5 * time.Minute)
		defer timer.Stop()
		var deadline <-chan time.Time = timer.C
		previous := ""
		read := func() {
			frame, err := readMacDevFrame(state, id, resources, appID)
			if errors.Is(err, history.ErrHistoryChanged) {
				return
			}
			if err != nil {
				cancel(err)
				return
			}
			if frame == nil {
				return
			}
			deadline = nil
			encoded, _ := json.Marshal(frame)
			if string(encoded) == previous {
				return
			}
			previous = string(encoded)
			if capture != nil {
				if err := capture.ObserveMacDev(*frame); err != nil {
					capture.RecordRetentionError(err)
				}
			}
			if sinks, ok := devSinksFromContext(ctx); ok && sinks.Native != nil {
				sinks.Native(*frame)
			}
		}
		for {
			select {
			case <-stop:
				read()
				return
			case <-child.Done():
				return
			case <-deadline:
				cancel(errors.New("macOS development startup exceeded five minutes"))
				return
			case <-ticker.C:
				read()
			}
		}
	}()
	node, err := project.NodeExecutable(child)
	if err != nil {
		close(stop)
		<-done
		return proc.Result{}, err
	}
	result, err := proc.RunProcessStdio(child, []string{node, entry, request, state}, projectPath, project.ExecutionEnvironment(child), input, out, diagnostics)
	close(stop)
	<-done
	if frame, finalErr := readMacDevFrame(state, id, resources, appID); finalErr == nil && frame != nil && capture != nil {
		if e := capture.ObserveMacDev(*frame); e != nil {
			capture.RecordRetentionError(e)
		}
	}
	var cleanup *proc.CleanupError
	if errors.As(err, &cleanup) {
		safe = false
		return result, fmt.Errorf("%w; development resources retained at %s", err, directory)
	}
	if cause := context.Cause(child); cause != nil && ctx.Err() == nil {
		return result, cause
	}
	if err == nil && result.ExitCode == 0 {
		frame, e := readMacDevFrame(state, id, resources, appID)
		if e != nil {
			return result, e
		}
		if frame == nil {
			return result, errors.New("macOS engine exited before native launch evidence")
		}
	}
	return result, err
}

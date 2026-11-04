package main

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type devNativeProcess struct {
	PID        int64  `json:"pid"`
	Executable string `json:"executable"`
	ObservedAt string `json:"observedAt"`
}
type devNativeIdentity struct {
	AppID            string             `json:"appId"`
	Processes        []devNativeProcess `json:"processes"`
	DroppedProcesses int                `json:"droppedProcesses,omitempty"`
}
type macDevFrame struct {
	Protocol string `json:"protocol"`
	Version  int    `json:"version"`
	ID       string `json:"id"`
	OK       *bool  `json:"ok"`
	Data     struct {
		PID        int64  `json:"pid"`
		Executable string `json:"executable"`
		ObservedAt string `json:"observedAt"`
		devNativeIdentity
	} `json:"data"`
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (capture *historyCapture) observeMacDev(frame macDevFrame) error {
	capture.Lock()
	defer capture.Unlock()
	if capture.closed {
		return errors.New("capture retired before native observation")
	}
	identity := frame.Data.devNativeIdentity
	identity.Processes = append([]devNativeProcess{}, identity.Processes...)
	capture.session.NativeIdentity = &identity
	// Host spawn is not an application-readiness handshake.
	capture.session.Detail = "macOS host spawned; application initialization is not inferred."
	// Keep launch history bounded independently of rotating human log records.
	for {
		data, err := json.Marshal(capture.session)
		if err != nil {
			return err
		}
		if len(data) <= 64<<10 {
			break
		}
		if len(identity.Processes) <= 1 {
			return errors.New("native launch metadata exceeds 64 KiB")
		}
		identity.Processes = identity.Processes[1:]
		identity.DroppedProcesses++
	}
	return historyMetadata(capture.root, capture.session)
}
func readMacDevFrame(path, id, resources, appID string) (*macDevFrame, error) {
	root, err := os.OpenRoot(filepath.Dir(path))
	if err != nil {
		return nil, err
	}
	defer root.Close()
	data, err := historyFile(root, filepath.Base(path), 64<<10)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var frame macDevFrame
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
		if process.PID < 1 || process.PID > 1<<32-1 || !filepath.IsAbs(process.Executable) || !inside(resources, filepath.Clean(process.Executable)) {
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
func runMacDevWorker(ctx context.Context, project, entry string, input, out, diagnostics *os.File, capture *historyCapture) (processResult, error) {
	manifest, err := projectManifest(project)
	if err != nil {
		return processResult{}, err
	}
	appID := stringValue(valueAt(manifest, "xplat", "targets", "macos", "package", "bundleIdentifier"))
	if appID == "" {
		appID = "org.octane.dev." + fmt.Sprintf("%x", sha256.Sum256([]byte(project)))[:16]
	}
	directory, err := privateDirectory("", "xplat-go-dev-")
	if err != nil {
		return processResult{}, err
	}
	safe := true
	defer func() {
		if safe {
			os.RemoveAll(directory)
		}
	}()
	directory, err = canonical(directory)
	if err != nil {
		return processResult{}, err
	}
	resources := filepath.Join(directory, "resources")
	if err = os.Mkdir(resources, 0700); err != nil {
		return processResult{}, err
	}
	id := identity()
	request := filepath.Join(directory, "request.json")
	state := filepath.Join(directory, "ready.json")
	bytes, _ := json.Marshal(map[string]any{"protocol": "octane-dev-worker", "version": 2, "id": id, "operation": "macos-dev", "project": project, "resourceRoot": resources})
	if err = privateFile(request, bytes); err != nil {
		return processResult{}, err
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
			if errors.Is(err, errHistoryChanged) {
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
				if err := capture.observeMacDev(*frame); err != nil {
					capture.recordRetentionError(err)
				}
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
	result, err := runProcessStdio(child, []string{"node", entry, request, state}, project, projectToolEnvironment(), input, out, diagnostics)
	close(stop)
	<-done
	if frame, finalErr := readMacDevFrame(state, id, resources, appID); finalErr == nil && frame != nil && capture != nil {
		if e := capture.observeMacDev(*frame); e != nil {
			capture.recordRetentionError(e)
		}
	}
	var cleanup *processCleanupError
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

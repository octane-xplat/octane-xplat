package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
)

// A job belongs to one selected app. The registry owns its runner until awaited
// cleanup finishes; neither a request context nor a cancelling state releases it.
type runtimeJob struct {
	JobID      string          `json:"jobId"`
	Kind       string          `json:"kind"`
	SessionID  string          `json:"sessionId,omitempty"`
	RequestKey string          `json:"requestKey,omitempty"`
	State      string          `json:"state"`
	CreatedAt  string          `json:"createdAt"`
	FinishedAt string          `json:"finishedAt,omitempty"`
	Progress   json.RawMessage `json:"progress,omitempty"`
	Result     json.RawMessage `json:"result,omitempty"`
	Error      json.RawMessage `json:"error,omitempty"`
}

type runtimeJobInput struct {
	AppID, AppRoot, Platform, Kind, SessionID, RequestKey string
}

type runtimeJobRun func(context.Context, func(map[string]any) error) (any, error)
type runtimeJobEntry struct {
	input  runtimeJobInput
	job    runtimeJob
	cancel context.CancelFunc
	done   chan struct{}
}

type runtimeJobs struct {
	mu                      sync.Mutex
	owner                   *agentOwner
	jobs                    map[string]*runtimeJobEntry
	completed               []string
	live                    int
	liveLimit, historyLimit int
}

func newRuntimeJobs(owner *agentOwner) *runtimeJobs {
	return &runtimeJobs{owner: owner, jobs: map[string]*runtimeJobEntry{}, liveLimit: 64, historyLimit: 200}
}

func runtimeJobLive(state string) bool {
	return state == "queued" || state == "running" || state == "cancelling"
}

func snapshotRuntimeJob(job runtimeJob) runtimeJob {
	job.Progress = append(json.RawMessage(nil), job.Progress...)
	job.Result = append(json.RawMessage(nil), job.Result...)
	job.Error = append(json.RawMessage(nil), job.Error...)
	return job
}

// The caller validates project selection and per-request policy before admission.
// Dedupe includes app/platform as well as operation/session; keys are not global.
func (registry *runtimeJobs) start(input runtimeJobInput, run runtimeJobRun) (runtimeJob, bool, *cliError) {
	if input.AppID == "" || input.AppRoot == "" || input.Kind == "" || run == nil || len(input.RequestKey) > 4096 {
		return runtimeJob{}, false, invalid("Invalid native job binding or runner.")
	}
	registry.mu.Lock()
	defer registry.mu.Unlock()
	if input.RequestKey != "" {
		for _, entry := range registry.jobs {
			if runtimeJobLive(entry.job.State) && entry.input == input {
				return snapshotRuntimeJob(entry.job), true, nil
			}
		}
	}
	if registry.live >= registry.liveLimit {
		return runtimeJob{}, false, &cliError{Code: "unavailable", Message: "Native owner has reached its live job limit; wait for existing work or cancel a job."}
	}
	parent, release, err := registry.owner.admit()
	if err != nil {
		return runtimeJob{}, false, ownerDisconnected("Native owner is retiring; no job was started.")
	}
	ctx, cancel := context.WithCancel(parent)
	entry := &runtimeJobEntry{input: input, cancel: cancel, done: make(chan struct{}), job: runtimeJob{
		JobID: "job_" + strings.TrimPrefix(requestUUID(), "req-"), Kind: input.Kind,
		SessionID: input.SessionID, RequestKey: input.RequestKey, State: "queued", CreatedAt: time.Now().UTC().Format(time.RFC3339Nano),
	}}
	registry.jobs[entry.job.JobID] = entry
	registry.live++
	go registry.run(ctx, entry, run, release)
	return snapshotRuntimeJob(entry.job), false, nil
}

func (registry *runtimeJobs) run(ctx context.Context, entry *runtimeJobEntry, run runtimeJobRun, release func(error)) {
	var result any
	var failure error
	panicked := false
	defer func() {
		if recovered := recover(); recovered != nil {
			// A provider panic cannot prove cleanup. Preserve the owner descriptor.
			panicked = true
			failure = fmt.Errorf("native job runner panicked: %v", recovered)
		}
		var encoded json.RawMessage
		if failure == nil {
			var err error
			encoded, err = json.Marshal(result)
			if err != nil || len(encoded) > 256<<10 {
				failure = errors.New("native job result is invalid or exceeds 256 KiB; retain large output as an artifact")
			}
		}
		registry.mu.Lock()
		var processCleanup *processCleanupError
		var startupCleanup *ownerStartupCleanupError
		var sessionCleanup *runtimeSessionCleanupError
		cleanupUnknown := panicked || errors.As(failure, &processCleanup) || errors.As(failure, &startupCleanup) || errors.As(failure, &sessionCleanup)
		switch {
		case panicked || requiresFailureEvidence(failure):
			entry.job.State = "failed"
		case entry.job.State == "cancelling" || ctx.Err() != nil:
			entry.job.State = "cancelled"
		case failure != nil:
			entry.job.State = "failed"
		default:
			entry.job.State = "succeeded"
		}
		if entry.job.State == "failed" {
			var contract *cliError
			if !errors.As(failure, &contract) {
				contract = executionFailure(failure)
			}
			entry.job.Error, _ = json.Marshal(contract)
			if len(entry.job.Error) == 0 || len(entry.job.Error) > 64<<10 {
				entry.job.Error, _ = json.Marshal(&cliError{Code: "execution_failure", Message: "Native job failed; error detail is invalid or exceeds the retained limit."})
			}
		} else if failure == nil {
			// Cancellation may race a successfully completed runner. Preserve its
			// returned facts while retaining the cancelled terminal state.
			entry.job.Result = encoded
		}
		entry.job.FinishedAt = time.Now().UTC().Format(time.RFC3339Nano)
		registry.live--
		registry.completed = append(registry.completed, entry.job.JobID)
		for len(registry.completed) > registry.historyLimit {
			delete(registry.jobs, registry.completed[0])
			registry.completed = registry.completed[1:]
		}
		registry.mu.Unlock()
		entry.cancel()
		if cleanupUnknown {
			release(failure)
		} else {
			release(nil)
		}
		close(entry.done)
	}()
	registry.mu.Lock()
	if entry.job.State == "queued" {
		entry.job.State = "running"
	}
	registry.mu.Unlock()
	if ctx.Err() != nil {
		failure = ctx.Err()
		return
	}
	result, failure = run(ctx, func(progress map[string]any) error {
		registry.mu.Lock()
		defer registry.mu.Unlock()
		if !runtimeJobLive(entry.job.State) {
			return errors.New("native job progress arrived after completion")
		}
		combined := map[string]any{}
		if len(entry.job.Progress) > 0 {
			_ = json.Unmarshal(entry.job.Progress, &combined)
		}
		for key, value := range progress {
			combined[key] = value
		}
		encoded, err := json.Marshal(combined)
		if err != nil || len(encoded) > 16<<10 {
			return errors.New("native job progress is invalid or exceeds 16 KiB")
		}
		entry.job.Progress = encoded
		return nil
	})
}

// App identity is checked even for reads; unknown and foreign jobs look alike.
func (registry *runtimeJobs) status(appID, appRoot, id string) (runtimeJob, *cliError) {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	entry, failure := registry.selected(appID, appRoot, id)
	if failure != nil {
		return runtimeJob{}, failure
	}
	return snapshotRuntimeJob(entry.job), nil
}

func (registry *runtimeJobs) cancel(appID, appRoot, id string) (runtimeJob, *cliError) {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	entry, failure := registry.selected(appID, appRoot, id)
	if failure != nil {
		return runtimeJob{}, failure
	}
	if runtimeJobLive(entry.job.State) {
		entry.job.State = "cancelling"
		entry.cancel()
	}
	return snapshotRuntimeJob(entry.job), nil
}

// selected requires the registry mutex.
func (registry *runtimeJobs) selected(appID, appRoot, id string) (*runtimeJobEntry, *cliError) {
	entry := registry.jobs[id]
	if entry == nil || entry.input.AppID != appID || entry.input.AppRoot != appRoot {
		return nil, &cliError{Code: "not_found", Message: fmt.Sprintf("No job %q for the selected app.", id)}
	}
	return entry, nil
}

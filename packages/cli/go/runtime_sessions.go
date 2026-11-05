package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"path/filepath"
	"slices"
	"strings"
	"sync"
)

type runtimeLaunch struct {
	Phase     string         `json:"phase"`
	Readiness string         `json:"readiness,omitempty"`
	Message   string         `json:"message,omitempty"`
	Error     *cliError      `json:"error,omitempty"`
	Browser   map[string]any `json:"browser,omitempty"`
}

type runtimeSessionEntry struct {
	app        appIdentity
	record     historySession
	requestKey string
	ctx        context.Context
	cancel     context.CancelCauseFunc
	done       chan struct{}
	ending     bool
	capture    *historyCapture
	store      *historyStore
	cleanup    error
}

type runtimeSessionProject struct {
	refs    int
	release func(bool) error
	blocked bool
}
type runtimeSessions struct {
	mu                      sync.Mutex
	owner                   *agentOwner
	entries                 map[string]*runtimeSessionEntry
	projects                map[string]*runtimeSessionProject
	completed               []string
	liveLimit, historyLimit int
}

type runtimeSessionRun func(context.Context, *runtimeSessionEntry, func(runtimeLaunch, string)) error

type runtimeSessionCleanupError struct{ Err error }

func (e *runtimeSessionCleanupError) Error() string {
	return "session resource cleanup unconfirmed: " + e.Err.Error()
}
func (e *runtimeSessionCleanupError) Unwrap() error { return e.Err }

func newRuntimeSessions(owner *agentOwner) *runtimeSessions {
	return &runtimeSessions{owner: owner, entries: map[string]*runtimeSessionEntry{}, projects: map[string]*runtimeSessionProject{}, liveLimit: 64, historyLimit: 64}
}

func (registry *runtimeSessions) snapshot(entry *runtimeSessionEntry) map[string]any {
	return observedHistorySession(entry.record, registry.owner.descriptor.Generation)
}

// Starting/ready/failed are observable states, not proof that a claim is free.
// Only awaited cleanup releases the project lease and its selected target.
func (registry *runtimeSessions) start(app appIdentity, target devTarget, requestKey string, run runtimeSessionRun) (any, *cliError) {
	if run == nil || app.ID == "" || app.Root == "" || target.ID == "" || target.Kind == "" || len(requestKey) > 4096 {
		return nil, invalid("Invalid native session identity or provider.")
	}
	registry.mu.Lock()
	defer registry.mu.Unlock()
	live := 0
	for _, entry := range registry.entries {
		if entry.record.CleanupConfirmed {
			continue
		}
		live++
		if entry.app.Root == app.Root && entry.record.Platform == target.Kind && entry.record.TargetID == target.ID {
			if entry.record.State == "starting" && !entry.ending && (requestKey == "" || entry.requestKey == "" || requestKey == entry.requestKey) {
				return map[string]any{"session": registry.snapshot(entry), "deduplicated": true}, nil
			}
			return nil, &cliError{Code: "target_busy", Message: "A live or cleanup-unconfirmed session already owns this target.", Context: map[string]any{"session": registry.snapshot(entry)}}
		}
	}
	if live >= registry.liveLimit {
		return nil, &cliError{Code: "unavailable", Message: "Native owner has reached its live session limit."}
	}
	parent, finish, err := registry.owner.admit()
	if err != nil {
		return nil, ownerDisconnected("Native owner is retiring; no session was started.")
	}
	project := registry.projects[app.Root]
	if project != nil && project.blocked {
		finish(nil)
		return nil, ownerDisconnected("Project resource cleanup is unconfirmed; no replacement session was started.")
	}
	if project == nil {
		release, err := lockOwnedProjectOutputs(app.Root, registry.owner.descriptor.Generation)
		if err != nil {
			finish(nil)
			var busy *projectOutputsBusyError
			if errors.As(err, &busy) {
				return nil, &cliError{Code: "target_busy", Message: err.Error()}
			}
			return nil, executionFailure(err)
		}
		project = &runtimeSessionProject{release: release}
		registry.projects[app.Root] = project
	}
	project.refs++
	rollback := func() error {
		var cleanup error
		project.refs--
		if project.refs == 0 {
			if err := project.release(true); err != nil {
				cleanup = &runtimeSessionCleanupError{Err: err}
			}
			delete(registry.projects, app.Root)
		}
		finish(cleanup)
		return cleanup
	}
	store, err := openHistoryStore(registry.owner.cacheParent, app.Root)
	if err != nil {
		return nil, executionFailure(errors.Join(err, rollback()))
	}
	capture, err := store.Capture(historySession{AppID: app.ID, OwnerID: registry.owner.descriptor.Generation, Platform: target.Kind, TargetID: target.ID, Ownership: "owned", Origin: "agent"})
	if err != nil {
		store.Close()
		return nil, executionFailure(errors.Join(err, rollback()))
	}
	ctx, cancel := context.WithCancelCause(parent)
	entry := &runtimeSessionEntry{app: app, record: capture.session, requestKey: requestKey, ctx: ctx, cancel: cancel, done: make(chan struct{}), capture: capture, store: store}
	entry.record.Launch = &runtimeLaunch{Phase: "starting"}
	entry.record.Detail = "launch on " + target.Name
	registry.entries[entry.record.SessionID] = entry
	registry.publish(entry)
	go registry.run(entry, run, finish)
	return map[string]any{"session": registry.snapshot(entry), "deduplicated": false}, nil
}

// publish holds the registry mutex; capture never calls back while holding its
// own mutex. Metadata failure is disclosed without losing live cleanup authority.
func (registry *runtimeSessions) publish(entry *runtimeSessionEntry) {
	entry.capture.Lock()
	entry.capture.session.State = entry.record.State
	entry.capture.session.Detail = entry.record.Detail
	entry.capture.session.Launch = entry.record.Launch
	entry.capture.session.ProcessKind = entry.record.ProcessKind
	entry.capture.session.BuildIdentity = entry.record.BuildIdentity
	if err := historyMetadata(entry.capture.root, entry.capture.session); err != nil {
		entry.capture.failure = errors.Join(entry.capture.failure, err)
		entry.record.RetentionError = err.Error()
	}
	entry.capture.Unlock()
}

func (registry *runtimeSessions) run(entry *runtimeSessionEntry, run runtimeSessionRun, finish func(error)) {
	var failure error
	panicked := false
	defer func() {
		if value := recover(); value != nil {
			panicked = true
			failure = fmt.Errorf("native session provider panicked: %v", value)
		}
		var processCleanup *processCleanupError
		var startupCleanup *ownerStartupCleanupError
		var sessionCleanup *runtimeSessionCleanupError
		unknown := panicked || errors.As(failure, &processCleanup) || errors.As(failure, &startupCleanup) || errors.As(failure, &sessionCleanup)
		registry.mu.Lock()
		project := registry.projects[entry.app.Root]
		if !unknown {
			project.refs--
			if project.refs == 0 {
				if err := project.release(true); err != nil {
					unknown = true
					failure = errors.Join(failure, &runtimeSessionCleanupError{Err: err})
				} else {
					delete(registry.projects, entry.app.Root)
				}
			}
		}
		if unknown {
			project.blocked = true
		}
		switch {
		case panicked || requiresFailureEvidence(failure):
			entry.record.State = "failed"
		case entry.ending || entry.ctx.Err() != nil:
			entry.record.State = "stopped"
		case failure != nil:
			entry.record.State = "failed"
		case entry.record.State == "ready":
			entry.record.State = "disconnected"
		default:
			entry.record.State = "failed"
		}
		if entry.record.State == "failed" {
			if failure == nil {
				failure = errors.New("Development engine exited before readiness.")
			}
			var contract *cliError
			if !errors.As(failure, &contract) {
				contract = executionFailure(failure)
			}
			copy := *contract
			if len(copy.Message) > 8192 {
				copy.Message = strings.ToValidUTF8(copy.Message[:8192], "�") + " [truncated]"
			}
			if data, err := json.Marshal(copy); err != nil || len(data) > 32<<10 {
				copy.Context = nil
				copy.Recovery = nil
			}
			entry.record.Detail = copy.Message
			entry.record.Launch = &runtimeLaunch{Phase: "failed", Error: &copy}
		} else if entry.record.State == "stopped" {
			entry.record.Detail = "Owned session resources released."
		} else if entry.record.State == "disconnected" {
			entry.record.Detail = "Development engine exited; retained data is historical."
		} else {
			entry.record.Detail = "Development engine exited before readiness."
		}
		registry.publish(entry)
		state, detail := entry.record.State, entry.record.Detail
		registry.mu.Unlock()
		retention := entry.capture.Finish(state, detail, !unknown)
		closeErr := entry.store.Close()
		registry.mu.Lock()
		entry.capture.Lock()
		entry.record = entry.capture.session
		entry.capture.Unlock()
		if err := errors.Join(retention, closeErr); err != nil {
			entry.record.RetentionError = err.Error()
		}
		entry.cleanup = nil
		if unknown {
			entry.cleanup = failure
		} else {
			registry.completed = append(registry.completed, entry.record.SessionID)
			for len(registry.completed) > registry.historyLimit {
				delete(registry.entries, registry.completed[0])
				registry.completed = registry.completed[1:]
			}
		}
		registry.mu.Unlock()
		entry.cancel(nil)
		if unknown {
			finish(failure)
		} else {
			finish(nil)
		}
		close(entry.done)
	}()
	failure = run(entry.ctx, entry, func(launch runtimeLaunch, detail string) {
		registry.mu.Lock()
		defer registry.mu.Unlock()
		if entry.ending || entry.ctx.Err() != nil || entry.record.CleanupConfirmed {
			return
		}
		entry.record.Launch = &launch
		if launch.Phase == "ready" {
			entry.record.State = "ready"
			kind := "fresh"
			entry.record.ProcessKind = &kind
		}
		if detail != "" {
			entry.record.Detail = detail
		}
		registry.publish(entry)
	})
}

func (registry *runtimeSessions) selected(app appIdentity, id string) (*runtimeSessionEntry, *cliError) {
	entry := registry.entries[id]
	if entry == nil || entry.app.ID != app.ID || entry.app.Root != app.Root {
		return nil, &cliError{Code: "not_found", Message: "No live session with this id for the selected app."}
	}
	return entry, nil
}
func (registry *runtimeSessions) status(app appIdentity, id string) (any, *cliError) {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	entry, failure := registry.selected(app, id)
	if failure != nil {
		return nil, failure
	}
	return map[string]any{"session": registry.snapshot(entry)}, nil
}
func (registry *runtimeSessions) list(app appIdentity) []any {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	result := []any{}
	for _, entry := range registry.entries {
		if entry.app.ID == app.ID && entry.app.Root == app.Root {
			result = append(result, registry.snapshot(entry))
		}
	}
	slices.SortFunc(result, func(a, b any) int {
		return -strings.Compare(stringValue(a.(map[string]any)["createdAt"]), stringValue(b.(map[string]any)["createdAt"]))
	})
	return result
}
func (registry *runtimeSessions) claims(app appIdentity) []any {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	result := []any{}
	for _, entry := range registry.entries {
		if entry.app.ID == app.ID && entry.app.Root == app.Root && !entry.record.CleanupConfirmed {
			result = append(result, map[string]any{"platform": entry.record.Platform, "targetId": entry.record.TargetID, "session": registry.snapshot(entry)})
		}
	}
	return result
}
func (registry *runtimeSessions) end(ctx context.Context, app appIdentity, id string) (any, *cliError) {
	registry.mu.Lock()
	entry, failure := registry.selected(app, id)
	if failure != nil {
		registry.mu.Unlock()
		return nil, failure
	}
	entry.ending = true
	entry.cancel(context.Canceled)
	registry.mu.Unlock()
	select {
	case <-entry.done:
	case <-ctx.Done():
		return nil, executionFailure(ctx.Err())
	}
	registry.mu.Lock()
	defer registry.mu.Unlock()
	if entry.cleanup != nil {
		failure := executionFailure(entry.cleanup)
		var provider *cliError
		if errors.As(entry.cleanup, &provider) {
			failure.Context, failure.Recovery = provider.Context, provider.Recovery
		}
		return nil, failure
	}
	return map[string]any{"result": map[string]any{"sessionId": id, "ended": true, "released": []string{"owned engine and native process resources"}}}, nil
}

func sessionHistoryParent(directory string) string { return filepath.Dir(filepath.Dir(directory)) }

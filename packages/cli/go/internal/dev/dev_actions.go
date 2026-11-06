package dev

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"math"
	"slices"
	"sync"
	"time"
)

type devActionPolicy struct {
	Allowed         bool    `json:"allowed"`
	Reason          string  `json:"reason"`
	ExternalEffects bool    `json:"externalEffects"`
	Serialized      bool    `json:"serialized"`
	Cancellable     bool    `json:"cancellable"`
	TimeoutMs       float64 `json:"timeoutMs"`
}
type devActionOutcome struct {
	RequestID      string          `json:"requestId"`
	Status         string          `json:"status"`
	Result         json.RawMessage `json:"result,omitempty"`
	Error          json.RawMessage `json:"error,omitempty"`
	PartialEffects []string        `json:"partialEffects,omitempty"`
	CompletedAt    string          `json:"completedAt"`
}
type devActionValidation func(context.Context, string, json.RawMessage, json.RawMessage, string) (json.RawMessage, devActionPolicy, *cli.Error)
type devActionEntry struct {
	peer                       *devAppPeer
	requestID, jobID, actionID string
	instance, platform         string
	revision                   int64
	action, input              json.RawMessage
	policy                     devActionPolicy
	outcome                    chan devActionOutcome
	resolve                    sync.Once
}
type devActionKey struct {
	fingerprint, jobID, requestID, actionID, instance string
	revision                                          int64
}
type devActions struct {
	mu       sync.Mutex
	server   *devServer
	jobs     *runtimeJobs
	entries  map[string]*devActionEntry
	keys     map[string]devActionKey
	validate devActionValidation
}

func newDevActions(server *devServer) *devActions {
	service := &devActions{server: server, jobs: newRuntimeJobs(server), entries: map[string]*devActionEntry{}, keys: map[string]devActionKey{}}
	service.validate = service.validateWorker
	return service
}

func (service *devActions) validateWorker(ctx context.Context, phase string, action, value json.RawMessage, platform string) (json.RawMessage, devActionPolicy, *cli.Error) {
	child, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	result, err := project.RunWorker(child, service.server.record.AppRoot, "action-validate", map[string]any{"phase": phase, "action": action, "value": value, "platform": platform, "includePolicy": phase == "input"})
	if err != nil {
		if cli.RequiresFailureEvidence(err) {
			service.server.mu.Lock()
			service.server.operationError = errors.Join(service.server.operationError, err)
			service.server.mu.Unlock()
		}
		return nil, devActionPolicy{}, cli.ExecutionFailure(err)
	}
	return decodeActionValidation(result.Data, phase)
}

func decodeActionValidation(response json.RawMessage, phase string) (json.RawMessage, devActionPolicy, *cli.Error) {
	if len(response) > 512<<10 {
		return nil, devActionPolicy{}, cli.ExecutionFailure(errors.New("action validation response exceeds bound"))
	}
	var data struct {
		Declaration []string `json:"declaration"`
		Checked     struct {
			OK     *bool           `json:"ok"`
			Value  json.RawMessage `json:"value"`
			Errors []string        `json:"errors"`
		} `json:"checked"`
		Policy json.RawMessage `json:"policy"`
	}
	if json.Unmarshal(response, &data) != nil || data.Declaration == nil {
		return nil, devActionPolicy{}, cli.ExecutionFailure(errors.New("invalid action validator response"))
	}
	if len(data.Declaration) > 0 {
		return nil, devActionPolicy{}, &cli.Error{Code: "unavailable", Message: "The app announced an invalid action declaration.", Context: map[string]any{"errors": data.Declaration}}
	}
	if data.Checked.OK == nil {
		return nil, devActionPolicy{}, cli.ExecutionFailure(errors.New("action validator omitted checked result"))
	}
	if !*data.Checked.OK {
		if data.Checked.Errors == nil {
			return nil, devActionPolicy{}, cli.ExecutionFailure(errors.New("action validator omitted diagnostics"))
		}
		return nil, devActionPolicy{}, &cli.Error{Code: "invalid_selection", Message: "Action " + phase + " failed its declared contract.", Context: map[string]any{"errors": data.Checked.Errors}}
	}
	var checked map[string]any
	if json.Unmarshal(data.Checked.Value, &checked) != nil || checked == nil {
		return nil, devActionPolicy{}, cli.ExecutionFailure(errors.New("action validator omitted checked object"))
	}
	policy := devActionPolicy{}
	if phase == "input" {
		var raw map[string]json.RawMessage
		if json.Unmarshal(data.Policy, &raw) != nil {
			return nil, policy, cli.ExecutionFailure(errors.New("action validator omitted policy; install the matching CLI worker"))
		}
		for _, key := range []string{"allowed", "externalEffects", "serialized", "cancellable"} {
			var value any
			if raw[key] == nil || json.Unmarshal(raw[key], &value) != nil {
				return nil, policy, cli.ExecutionFailure(errors.New("invalid action validation policy"))
			}
			if _, ok := value.(bool); !ok {
				return nil, policy, cli.ExecutionFailure(errors.New("action policy fields must be explicit booleans"))
			}
		}
		if json.Unmarshal(data.Policy, &policy) != nil || policy.TimeoutMs <= 0 || policy.TimeoutMs > 300000 || math.IsNaN(policy.TimeoutMs) {
			return nil, policy, cli.ExecutionFailure(errors.New("invalid action validation deadline"))
		}
	}
	return data.Checked.Value, policy, nil
}

func actionPermission(values map[string]any, scope string) *cli.Error {
	grants, ok := values["_grants"].([]any)
	if ok {
		for _, value := range grants {
			if value == scope {
				return nil
			}
		}
	}
	// Direct callers within the native process use the same immutable string list.
	if grants, ok := values["_grants"].([]string); ok && slices.Contains(grants, scope) {
		return nil
	}
	return &cli.Error{Code: "permission_denied", Message: "Permission \"" + scope + "\" has not been granted for this request."}
}

func (service *devActions) invoke(ctx context.Context, values map[string]any) (any, *cli.Error) {
	for key, value := range values {
		switch key {
		case "actionId", "appInstanceId", "requestKey":
			text, ok := value.(string)
			if !ok || text == "" {
				return nil, cli.Invalid("Action identity and request-key options must be nonempty strings.")
			}
		case "input", "registryRevision", "_grants":
		default:
			return nil, cli.Invalid("Unknown action invocation option: " + key)
		}
	}
	if ctx.Err() != nil {
		return nil, cli.ExecutionFailure(ctx.Err())
	}
	service.server.mu.Lock()
	uncertain := service.server.operationError != nil
	service.server.mu.Unlock()
	if uncertain {
		return nil, &cli.Error{Code: "unavailable", Message: "A previous worker's cleanup is unconfirmed. Inspect retained diagnostics before starting another action.", Context: map[string]any{"outcome": "not-run", "cleanup": "unknown"}}
	}

	if failure := actionPermission(values, "runtime-actions"); failure != nil {
		return nil, failure
	}
	actionID := cli.StringValue(values["actionId"])
	if actionID == "" {
		return nil, cli.Invalid("An action id is required.")
	}
	var input json.RawMessage = []byte(`{}`)
	if raw, exists := values["input"]; exists {
		text, ok := raw.(string)
		if !ok {
			return nil, cli.Invalid("--input must be a JSON object.")
		}
		var value map[string]any
		if json.Unmarshal([]byte(text), &value) != nil || value == nil {
			return nil, cli.Invalid("--input must be a JSON object.")
		}
		input = []byte(text)
	}
	key := cli.StringValue(values["requestKey"])
	if len(key) > 4096 {
		return nil, cli.Invalid("Request key exceeds its bound.")
	}
	hub := service.server.apps
	hub.mu.Lock()
	var selected *devAppPeer
	for _, peer := range hub.peers {
		if !peer.ready || peer.disconnectedAt != "" {
			continue
		}
		if instance := cli.StringValue(values["appInstanceId"]); instance != "" && instance != peer.registry.AppInstanceID {
			continue
		}
		if selected != nil {
			hub.mu.Unlock()
			return nil, &cli.Error{Code: "ambiguous_selection", Message: "Several apps are connected; pass --instance."}
		}
		selected = peer
	}
	if selected == nil {
		hub.mu.Unlock()
		return nil, devServerUnavailable("No matching connected app announced an action registry.")
	}
	revision := selected.registry.Revision
	if value, exists := values["registryRevision"]; exists {
		number, ok := value.(float64)
		if !ok || number != float64(revision) {
			hub.mu.Unlock()
			return nil, &cli.Error{Code: "stale_identity", Message: "Registry revision is stale; relist actions before invoking."}
		}
	}
	var action json.RawMessage
	for _, raw := range selected.registry.Actions {
		var value struct {
			ID string `json:"id"`
		}
		_ = json.Unmarshal(raw, &value)
		if value.ID == actionID {
			action = append(json.RawMessage(nil), raw...)
			break
		}
	}
	platform, instance := selected.registry.Platform, selected.registry.AppInstanceID
	hub.mu.Unlock()
	if action == nil {
		return nil, cli.Invalid("No matching action in the connected app registry.")
	}
	checked, policy, failure := service.validate(ctx, "input", action, input, platform)
	if failure != nil {
		return nil, failure
	}
	if !policy.Allowed {
		return nil, &cli.Error{Code: "unavailable", Message: "The action is unavailable: " + policy.Reason}
	}
	if policy.ExternalEffects {
		if failure := actionPermission(values, "external-effects"); failure != nil {
			return nil, failure
		}
	}
	// Recheck connection and the exact declaration after the worker has executed.
	hub.mu.Lock()
	current := hub.peers[instance]
	valid := current == selected && current.disconnectedAt == "" && current.ready && current.registry.Revision == revision
	if valid {
		valid = false
		for _, raw := range current.registry.Actions {
			if bytes.Equal(raw, action) {
				valid = true
				break
			}
		}
	}
	hub.mu.Unlock()
	if !valid {
		return nil, &cli.Error{Code: "stale_identity", Message: "The app connection or declaration changed during validation; no action was dispatched."}
	}
	fingerprintBytes, _ := json.Marshal([]any{instance, selected.target, actionID, revision, json.RawMessage(checked)})
	fingerprint := fmt.Sprintf("%x", sha256.Sum256(fingerprintBytes))
	scopedKey := key
	service.mu.Lock()
	defer service.mu.Unlock()
	if ctx.Err() != nil {
		return nil, cli.ExecutionFailure(ctx.Err())
	}
	if key != "" {
		if prior, exists := service.keys[scopedKey]; exists {
			if prior.fingerprint != fingerprint {
				return nil, &cli.Error{Code: "stale_identity", Message: "This request key already identifies a different invocation; no action was dispatched."}
			}
			job, failure := service.jobs.status(service.server.record.AppRoot, service.server.record.AppRoot, prior.jobID)
			if failure != nil {
				return nil, &cli.Error{Code: "stale_identity", Message: "This request key's result expired; the action was not repeated. Inspect app state before choosing a new key."}
			}
			return actionAccepted(job, &devActionEntry{requestID: prior.requestID, actionID: prior.actionID, revision: prior.revision, instance: prior.instance}, true), nil
		}
		if len(service.keys) >= 1024 {
			return nil, &cli.Error{Code: "target_busy", Message: "The retained action request-key limit is reached; no action was dispatched."}
		}
	}
	live := 0
	for _, entry := range service.entries {
		if entry.instance == instance {
			live++
		}
	}
	limit := 16
	if policy.Serialized {
		limit = 8
	}
	if live >= limit {
		return nil, &cli.Error{Code: "target_busy", Message: "The app action queue is full; wait for an invocation to finish."}
	}
	entry := &devActionEntry{peer: selected, instance: instance, platform: platform, requestID: "req_" + osfs.Identity(), actionID: actionID, revision: revision, action: action, input: checked, policy: policy, outcome: make(chan devActionOutcome, 1)}
	job, _, failure := service.jobs.start(runtimeJobInput{AppID: service.server.record.AppRoot, AppRoot: service.server.record.AppRoot, Platform: platform, Kind: "dev-action", SessionID: selected.session}, func(ctx context.Context, report func(map[string]any) error) (any, error) {
		return service.run(ctx, entry, report)
	})
	if failure != nil {
		return nil, failure
	}
	entry.jobID = job.JobID
	service.entries[entry.requestID] = entry
	if key != "" {
		service.keys[scopedKey] = devActionKey{fingerprint: fingerprint, jobID: entry.jobID, requestID: entry.requestID, actionID: entry.actionID, instance: instance, revision: revision}
	}
	return actionAccepted(job, entry, false), nil
}
func actionAccepted(job runtimeJob, entry *devActionEntry, deduplicated bool) any {
	return map[string]any{"job": job, "requestId": entry.requestID, "action": map[string]any{"id": entry.actionID}, "registryRevision": entry.revision, "appInstanceId": entry.instance, "deduplicated": deduplicated}
}

func actionUnknown(entry *devActionEntry, code, message string) error {
	return &operationOutcomeFailure{&cli.Error{Code: code, Message: message, Context: map[string]any{"requestId": entry.requestID, "outcome": "unknown", "partialEffects": []string{"The app may have completed effects; the action was not retried."}}}}
}

func (service *devActions) run(parent context.Context, entry *devActionEntry, report func(map[string]any) error) (any, error) {
	// Admission publishes the entry under this lock before its runner can dispatch.
	service.mu.Lock()
	service.mu.Unlock()
	defer func() { service.mu.Lock(); delete(service.entries, entry.requestID); service.mu.Unlock() }()
	ctx, cancel := context.WithTimeout(parent, time.Duration(entry.policy.TimeoutMs*float64(time.Millisecond)))
	defer cancel()
	_ = report(map[string]any{"phase": "queued", "requestId": entry.requestID, "appInstanceId": entry.instance, "actionId": entry.actionID, "registryRevision": entry.revision})
	service.server.apps.mu.Lock()
	live := service.server.apps.peers[entry.instance] == entry.peer && entry.peer.ready && entry.peer.disconnectedAt == ""
	service.server.apps.mu.Unlock()
	if !live {
		return nil, &cli.Error{Code: "disconnected_runtime", Message: "The app disconnected before dispatch; the action was not run.", Context: map[string]any{"outcome": "not-run"}}
	}
	data, _ := json.Marshal(map[string]any{"type": "work", "invocations": []any{map[string]any{"requestId": entry.requestID, "appInstanceId": entry.instance, "actionId": entry.actionID, "registryRevision": entry.revision, "input": entry.input}}})
	if err := writeDevApp(service.server.ctx, entry.peer, data); err != nil {
		return nil, actionUnknown(entry, "disconnected_runtime", "The action could not be confirmed delivered; its outcome is unknown.")
	}
	_ = report(map[string]any{"phase": "dispatched", "requestId": entry.requestID})
	var outcome devActionOutcome
	select {
	case outcome = <-entry.outcome:
	case <-ctx.Done():
		if entry.policy.Cancellable && parent.Err() == nil {
			grace, cancel := context.WithTimeout(parent, 5*time.Second)
			data, _ := json.Marshal(map[string]any{"type": "work", "cancel": []string{entry.requestID}})
			_ = writeDevApp(service.server.ctx, entry.peer, data)
			select {
			case outcome = <-entry.outcome:
			case <-grace.Done():
			}
			cancel()
		}
		if outcome.Status == "" {
			return nil, actionUnknown(entry, "execution_failure", "The action deadline or dev-server shutdown ended observation; completion is unknown.")
		}
	}
	if outcome.Status == "unknown" {
		return nil, actionUnknown(entry, "disconnected_runtime", "The app connection was lost in flight; the action was not retried.")
	}
	if outcome.Status == "failed" {
		var appError struct {
			Code, Message string
			Failures      json.RawMessage
		}
		_ = json.Unmarshal(outcome.Error, &appError)
		failures, truncated, total := boundedActionFailures(appError.Failures)
		failures, stackResolution := service.resolveFailureStacks(parent, entry.peer, failures)
		return nil, &operationOutcomeFailure{&cli.Error{Code: "execution_failure", Message: appError.Message, Context: map[string]any{"appCode": appError.Code, "failures": failures, "failuresTruncated": truncated, "failureCount": total, "partialEffects": outcome.PartialEffects, "requestId": entry.requestID, "stackResolution": stackResolution}}}
	}
	if outcome.Status == "succeeded" {
		checked, _, failure := service.validate(parent, "output", entry.action, outcome.Result, entry.platform)
		if failure != nil {
			return nil, &operationOutcomeFailure{&cli.Error{Code: "execution_failure", Cause: failure, Message: "The action ran but its result could not be validated; its effects were not undone.", Context: map[string]any{"validation": failure, "partialEffects": outcome.PartialEffects, "requestId": entry.requestID, "outcome": "unvalidated"}}}
		}
		outcome.Result = checked
	}
	result := map[string]any{"outcome": outcome, "stackResolution": "runtime-raw"}
	state := "succeeded"
	if outcome.Status == "cancelled" {
		state = "cancelled"
	}
	return &confirmedOperationResult{Result: result, State: state}, nil
}
func (service *devActions) receive(peer *devAppPeer, raw json.RawMessage) bool {
	var outcome devActionOutcome
	if len(raw) > 256<<10 || json.Unmarshal(raw, &outcome) != nil || outcome.RequestID == "" || !slices.Contains([]string{"succeeded", "failed", "cancelled", "unknown"}, outcome.Status) || len(outcome.PartialEffects) > 32 || outcome.CompletedAt == "" {
		return false
	}
	if outcome.Status == "failed" {
		var detail struct{ Code, Message string }
		if json.Unmarshal(outcome.Error, &detail) != nil || detail.Code == "" || detail.Message == "" {
			return false
		}
	}
	service.mu.Lock()
	entry := service.entries[outcome.RequestID]
	service.mu.Unlock()
	if entry == nil {
		return true
	} // Late results never rerun or overwrite an outcome.
	if entry.peer != peer {
		return false
	}
	entry.resolve.Do(func() { entry.outcome <- outcome })
	return true
}
func (service *devActions) disconnected(peer *devAppPeer) {
	service.mu.Lock()
	defer service.mu.Unlock()
	for _, entry := range service.entries {
		if entry.peer == peer {
			entry.resolve.Do(func() {
				entry.outcome <- devActionOutcome{RequestID: entry.requestID, Status: "unknown", CompletedAt: cli.IsoNow()}
			})
		}
	}
}
func (service *devActions) status(id string) (any, *cli.Error) {
	job, failure := service.jobs.status(service.server.record.AppRoot, service.server.record.AppRoot, id)
	if failure != nil {
		return nil, failure
	}
	var meta map[string]any
	_ = json.Unmarshal(job.Progress, &meta)
	result := map[string]any{"job": job}
	for _, key := range []string{"requestId", "appInstanceId", "actionId", "registryRevision"} {
		if value, ok := meta[key]; ok {
			result[key] = value
		}
	}
	return result, nil
}

// Preserve partial-effect facts even when a multi-handler stack exceeds the
// generic job error limit. Retain complete leading records and disclose omission.
func boundedActionFailures(raw json.RawMessage) ([]json.RawMessage, bool, int) {
	var failures []json.RawMessage
	if len(raw) == 0 {
		return nil, false, 0
	}
	if json.Unmarshal(raw, &failures) != nil {
		return nil, true, 0
	}
	total := len(failures)
	if len(failures) > 20 {
		failures = failures[:20]
	}
	for len(failures) > 0 {
		data, _ := json.Marshal(failures)
		if len(data) <= 24<<10 {
			break
		}
		failures = failures[:len(failures)-1]
	}
	return failures, len(failures) != total, total
}

package dev

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
)

const defaultActionWait = 30 * time.Second
const actionPollInterval = 200 * time.Millisecond

type actionRunInstance struct {
	ID       string `json:"appInstanceId"`
	Target   string `json:"targetId"`
	Platform string `json:"platform"`
	State    string `json:"state"`
	Revision *int64 `json:"revision"`
}

func selectActionRunInstance(instances []actionRunInstance, target, instance string) (actionRunInstance, *cli.Error) {
	var matches []actionRunInstance
	for _, entry := range instances {
		if entry.State != "ready" || entry.ID == "" {
			continue
		}
		if target != "" && target != entry.Target && target != entry.Platform {
			continue
		}
		if instance != "" && instance != entry.ID {
			continue
		}
		matches = append(matches, entry)
	}
	switch len(matches) {
	case 0:
		return actionRunInstance{}, &cli.Error{
			Code:     "unavailable",
			Message:  fmt.Sprintf("No ready app instance matches the action selection (target %q, instance %q).", target, instance),
			Recovery: map[string]string{"action": "Check connected instances with xplat actions list."},
		}
	case 1:
		return matches[0], nil
	default:
		candidates := make([]string, 0, len(matches))
		for _, match := range matches {
			candidates = append(candidates, fmt.Sprintf("%s (%s, target %s)", match.ID, match.Platform, match.Target))
		}
		return actionRunInstance{}, &cli.Error{
			Code:    "ambiguous_selection",
			Message: "Several ready app instances match: " + strings.Join(candidates, ", ") + ". Pass --instance to select one.",
			Context: map[string]any{"candidates": matches},
		}
	}
}

func RunAction(ctx context.Context, workspace *project.WorkspaceContext, values map[string]any) (any, *cli.Error) {
	action := cli.StringValue(values["actionId"])
	if action == "" {
		return nil, cli.Invalid("--action is required.")
	}
	target := cli.StringValue(values["targetId"])
	instance := cli.StringValue(values["appInstanceId"])
	if (values["targetId"] != nil && target == "") || (values["appInstanceId"] != nil && instance == "") {
		return nil, cli.Invalid("--target and --instance must be nonempty when provided.")
	}
	wait := defaultActionWait
	if millis, ok := values["timeoutMs"].(float64); ok {
		wait = time.Duration(millis) * time.Millisecond
	}

	client, failure := devAppClient(ctx, workspace)
	if failure != nil {
		return nil, cli.ContextualFailure(ctx, failure)
	}
	listed, failure := client.call(ctx, "actions list", nil)
	if failure != nil {
		return nil, cli.ContextualFailure(ctx, failure)
	}
	var registry struct {
		Instances []actionRunInstance `json:"instances"`
	}
	if err := json.Unmarshal(listed, &registry); err != nil || registry.Instances == nil {
		return nil, cli.ExecutionFailure(errors.New("Invalid action registry response from the dev server."))
	}
	selected, failure := selectActionRunInstance(registry.Instances, target, instance)
	if failure != nil {
		return nil, failure
	}
	if selected.Revision == nil {
		return nil, cli.ExecutionFailure(errors.New("The selected app registry has no revision."))
	}
	invocation := map[string]any{
		"actionId":         action,
		"appInstanceId":    selected.ID,
		"registryRevision": *selected.Revision,
	}
	for _, key := range []string{"input", "requestKey"} {
		if value, exists := values[key]; exists {
			invocation[key] = value
		}
	}
	if ctx.Err() != nil {
		return nil, cli.ExecutionFailure(ctx.Err())
	}
	// Once submitted, collect the bounded admission reply even on interruption.
	// A job may already exist by the time the server acknowledges it.
	reply, failure := client.appRequest(context.WithoutCancel(ctx), "actions invoke", invocation)
	if failure != nil {
		return nil, failure
	}
	var accepted struct {
		Job runtimeJob `json:"job"`
	}
	if err := json.Unmarshal(reply, &accepted); err != nil || accepted.Job.JobID == "" {
		return nil, cli.ExecutionFailure(errors.New("The dev server returned no job ID for the submitted action."))
	}
	waitCtx, cancel := context.WithTimeout(ctx, wait)
	defer cancel()
	return client.waitForAction(waitCtx, accepted.Job)
}

func (client *devServerClient) waitForAction(ctx context.Context, lastJob runtimeJob) (any, *cli.Error) {
	id := lastJob.JobID
	ticker := time.NewTicker(actionPollInterval)
	defer ticker.Stop()
	for {
		if ctx.Err() != nil {
			return nil, actionWaitStopped(ctx, lastJob, nil)
		}
		reply, failure := client.call(ctx, "actions status", map[string]any{"jobId": id})
		if failure != nil {
			return nil, actionWaitStopped(ctx, lastJob, failure)
		}
		var status struct {
			Job runtimeJob `json:"job"`
		}
		if err := json.Unmarshal(reply, &status); err != nil || status.Job.JobID != id {
			return nil, actionWaitStopped(ctx, lastJob, cli.ExecutionFailure(errors.New("Invalid action status response.")))
		}
		lastJob = status.Job
		switch lastJob.State {
		case "succeeded":
			return reply, nil
		case "cancelled":
			return nil, &cli.Error{Code: "cancelled", Message: fmt.Sprintf("Action job %s was cancelled.", id), Context: actionRunJobContext(lastJob)}
		case "failed":
			detail := cli.Error{Code: "execution_failure", Message: "Action execution failed."}
			if len(lastJob.Error) > 0 {
				_ = json.Unmarshal(lastJob.Error, &detail)
			}
			return nil, &cli.Error{Code: detail.Code, Message: fmt.Sprintf("Action job %s failed: %s", id, detail.Message), Context: actionRunJobContext(lastJob)}
		case "queued", "running", "cancelling":
		default:
			return nil, actionWaitStopped(ctx, lastJob, cli.ExecutionFailure(errors.New("Invalid action job state.")))
		}
		select {
		case <-ticker.C:
		case <-ctx.Done():
			return nil, actionWaitStopped(ctx, lastJob, nil)
		}
	}
}

func actionRunJobContext(job runtimeJob) map[string]any {
	return map[string]any{"jobId": job.JobID, "job": job}
}

func actionWaitStopped(ctx context.Context, job runtimeJob, failure *cli.Error) *cli.Error {
	var code, message string
	switch ctx.Err() {
	case context.DeadlineExceeded:
		code, message = "timeout", "Timed out waiting for action job "+job.JobID+"."
	case context.Canceled:
		code, message = "cancelled", "Interrupted while waiting for action job "+job.JobID+"."
	default:
		code, message = failure.Code, fmt.Sprintf("Could not read the outcome of action job %s: %s", job.JobID, failure.Message)
	}
	return &cli.Error{
		Code:     code,
		Message:  message,
		Context:  actionRunJobContext(job),
		Recovery: map[string]string{"action": "Check the same app with xplat actions status " + job.JobID + " --json before retrying."},
	}
}

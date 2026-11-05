package main

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/coder/websocket"
)

func devActionsFixture(t *testing.T, policy devActionPolicy) (*devServer, *devServerClient, *websocket.Conn, string) {
	return devActionsFixtureValidator(t, policy, nil)
}
func devActionsFixtureValidator(t *testing.T, policy devActionPolicy, validate devActionValidation) (*devServer, *devServerClient, *websocket.Conn, string) {
	t.Helper()
	ready := make(chan struct{})
	var service *devActions
	server, cache, app := devServerFixture(t, func(ctx context.Context, command string, values map[string]any) (any, *cliError) {
		<-ready
		switch command {
		case "actions invoke":
			return service.invoke(ctx, values)
		case "actions status":
			return service.status(stringValue(values["jobId"]))
		}
		return nil, invalid("unknown action test command")
	})
	service = server.actions
	service.validate = func(_ context.Context, _ string, _ json.RawMessage, value json.RawMessage, _ string) (json.RawMessage, devActionPolicy, *cliError) {
		return value, policy, nil
	}
	if validate != nil {
		service.validate = validate
	}
	close(ready)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	conn := appSocketDial(t, grant, "", grant.Token, "action-app")
	_ = appSocketRead(t, conn)
	waitActionPeerReady(t, server, "action-app")
	client, failure := lookupDevServer(context.Background(), cache, app)
	if failure != nil {
		t.Fatal(failure)
	}
	return server, client, conn, "action-app"
}
func waitActionPeerReady(t *testing.T, server *devServer, instance string) {
	t.Helper()
	deadline := time.Now().Add(time.Second)
	for {
		server.apps.mu.Lock()
		peer := server.apps.peers[instance]
		live := peer != nil && peer.ready && peer.disconnectedAt == ""
		server.apps.mu.Unlock()
		if live {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("peer did not finish registration")
		}
		time.Sleep(time.Millisecond)
	}
}
func callAction(t *testing.T, client *devServerClient, instance, key string) (map[string]any, *cliError) {
	t.Helper()
	raw, failure := client.call(context.Background(), "actions invoke", map[string]any{"actionId": "fixture.read", "appInstanceId": instance, "requestKey": key, "_grants": []string{"runtime-actions"}})
	var value map[string]any
	if failure == nil && json.Unmarshal(raw, &value) != nil {
		t.Fatal("invalid accepted action")
	}
	return value, failure
}
func actionTerminal(t *testing.T, client *devServerClient, id string) runtimeJob {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for {
		raw, failure := client.call(context.Background(), "actions status", map[string]any{"jobId": id})
		if failure != nil {
			t.Fatal(failure)
		}
		var value struct {
			Job runtimeJob `json:"job"`
		}
		if json.Unmarshal(raw, &value) != nil {
			t.Fatal("invalid job response")
		}
		if !runtimeJobLive(value.Job.State) {
			return value.Job
		}
		if time.Now().After(deadline) {
			t.Fatal("action did not finish")
		}
		time.Sleep(time.Millisecond)
	}
}
func TestDevAppActionAdmissionDedupeAndConfirmedResult(t *testing.T) {
	_, client, conn, instance := devActionsFixture(t, devActionPolicy{Allowed: true, Serialized: true, TimeoutMs: 30000})
	for _, bad := range []map[string]any{
		{"actionId": "fixture.read", "appInstanceId": 42, "_grants": []string{"runtime-actions"}},
		{"actionId": "fixture.read", "requestKey": false, "_grants": []string{"runtime-actions"}},
		{"actionId": "fixture.read", "requestKey": "", "_grants": []string{"runtime-actions"}},
	} {
		if _, failure := client.call(context.Background(), "actions invoke", bad); failure == nil || failure.Code != "invalid_selection" {
			t.Fatal("malformed identity silently defaulted", failure)
		}
	}
	accepted, failure := callAction(t, client, instance, "once")
	if failure != nil {
		t.Fatal(failure)
	}
	jobID := accepted["job"].(map[string]any)["jobId"].(string)
	duplicate, failure := callAction(t, client, instance, "once")
	if failure != nil || duplicate["requestId"] != accepted["requestId"] || duplicate["deduplicated"] != true {
		t.Fatal("retry was not deduplicated", failure)
	}
	work := appSocketRead(t, conn)
	invocation := work["invocations"].([]any)[0].(map[string]any)
	if invocation["requestId"] != accepted["requestId"] {
		t.Fatal("wrong delivery identity")
	}
	outcome := devActionOutcome{RequestID: invocation["requestId"].(string), Status: "succeeded", Result: json.RawMessage(`{"value":7}`), CompletedAt: isoNow()}
	if err := conn.Write(context.Background(), websocket.MessageText, mustJSON(map[string]any{"type": "outcome", "outcome": outcome})); err != nil {
		t.Fatal(err)
	}
	terminal := actionTerminal(t, client, jobID)
	if terminal.State != "succeeded" || !strings.Contains(string(terminal.Result), `"value":7`) {
		t.Fatal("confirmed result lost", terminal.State)
	}
	duplicate, failure = callAction(t, client, instance, "once")
	if failure != nil || duplicate["job"].(map[string]any)["jobId"] != jobID {
		t.Fatal("completed retry reran action", failure)
	}
	_, failure = client.call(context.Background(), "actions invoke", map[string]any{"actionId": "fixture.read", "appInstanceId": instance, "requestKey": "once", "input": `{"different":true}`, "_grants": []string{"runtime-actions"}})
	if failure == nil || failure.Code != "stale_identity" {
		t.Fatal("conflicting request key accepted", failure)
	}
}
func TestDevAppActionDisconnectIsUnknownAndNeverReplayed(t *testing.T) {
	server, client, conn, instance := devActionsFixture(t, devActionPolicy{Allowed: true, TimeoutMs: 30000})
	accepted, failure := callAction(t, client, instance, "unknown-once")
	if failure != nil {
		t.Fatal(failure)
	}
	_ = appSocketRead(t, conn)
	_ = conn.CloseNow()
	jobID := accepted["job"].(map[string]any)["jobId"].(string)
	terminal := actionTerminal(t, client, jobID)
	if terminal.State != "failed" || !strings.Contains(string(terminal.Error), `"outcome":"unknown"`) {
		t.Fatal("disconnect fabricated a terminal result", terminal.State)
	}
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	replacement := appSocketDial(t, grant, "", grant.Token, instance)
	_ = appSocketRead(t, replacement)
	waitActionPeerReady(t, server, instance)
	duplicate, failure := callAction(t, client, instance, "unknown-once")
	if failure != nil || duplicate["job"].(map[string]any)["jobId"] != jobID {
		t.Fatal("unknown action was replayed", failure)
	}
}
func TestDevAppActionExternalPermissionAndCooperativeDeadline(t *testing.T) {
	_, client, conn, instance := devActionsFixture(t, devActionPolicy{Allowed: true, ExternalEffects: true, TimeoutMs: 30000})
	if _, failure := callAction(t, client, instance, "external"); failure == nil || failure.Code != "permission_denied" {
		t.Fatal("external effects ran without grant", failure)
	}
	_ = conn.CloseNow()
	_, client, conn, instance = devActionsFixture(t, devActionPolicy{Allowed: true, Cancellable: true, TimeoutMs: 100})
	accepted, failure := callAction(t, client, instance, "cancel-once")
	if failure != nil {
		t.Fatal(failure)
	}
	_ = appSocketRead(t, conn)
	cancellation := appSocketRead(t, conn)
	if cancellation["cancel"].([]any)[0] != accepted["requestId"] {
		t.Fatal("wrong cancellation identity")
	}
	outcome := devActionOutcome{RequestID: accepted["requestId"].(string), Status: "cancelled", PartialEffects: []string{"fixture cancellation observed"}, CompletedAt: isoNow()}
	if err := conn.Write(context.Background(), websocket.MessageText, mustJSON(map[string]any{"type": "outcome", "outcome": outcome})); err != nil {
		t.Fatal(err)
	}
	terminal := actionTerminal(t, client, accepted["job"].(map[string]any)["jobId"].(string))
	if terminal.State != "cancelled" || !strings.Contains(string(terminal.Result), "fixture cancellation observed") {
		t.Fatal("confirmed cancellation lost", terminal.State)
	}
}

func TestDevAppActionWorkerPolicyRejectsMissingAndNullDecisions(t *testing.T) {
	policy := map[string]any{"allowed": true, "externalEffects": false, "serialized": true, "cancellable": false, "timeoutMs": 30000}
	data := map[string]any{"declaration": []string{}, "checked": map[string]any{"ok": true, "value": map[string]any{}}, "policy": policy}
	if _, _, failure := decodeActionValidation(mustJSON(data), "input"); failure != nil {
		t.Fatal("valid explicit-false policy rejected", failure)
	}
	for _, key := range []string{"allowed", "externalEffects", "serialized", "cancellable"} {
		prior := policy[key]
		policy[key] = nil
		if _, _, failure := decodeActionValidation(mustJSON(data), "input"); failure == nil {
			t.Fatalf("null %s became a default permission decision", key)
		}
		delete(policy, key)
		if _, _, failure := decodeActionValidation(mustJSON(data), "input"); failure == nil {
			t.Fatalf("missing %s became a default permission decision", key)
		}
		policy[key] = prior
	}
}

func TestDevAppActionShutdownPreservesUnknownEffects(t *testing.T) {
	server, client, conn, instance := devActionsFixture(t, devActionPolicy{Allowed: true, TimeoutMs: 30000})
	accepted, failure := callAction(t, client, instance, "shutdown-once")
	if failure != nil {
		t.Fatal(failure)
	}
	_ = appSocketRead(t, conn)
	if err := server.close(); err != nil {
		t.Fatal(err)
	}
	result, failure := server.actions.status(accepted["job"].(map[string]any)["jobId"].(string))
	if failure != nil {
		t.Fatal(failure)
	}
	job := result.(map[string]any)["job"].(runtimeJob)
	if job.State != "failed" || !strings.Contains(string(job.Error), `"outcome":"unknown"`) {
		t.Fatal("shutdown invented success/cancellation", job.State)
	}
}

func TestDevAppActionLargeStacksKeepPartialEffectFacts(t *testing.T) {
	_, client, conn, instance := devActionsFixture(t, devActionPolicy{Allowed: true, TimeoutMs: 30000})
	accepted, failure := callAction(t, client, instance, "many-failures")
	if failure != nil {
		t.Fatal(failure)
	}
	_ = appSocketRead(t, conn)
	failures := []any{}
	for n := 0; n < 20; n++ {
		failures = append(failures, map[string]any{"handler": n, "message": "fixture failure", "stack": strings.Repeat("s", 4096)})
	}
	outcome := devActionOutcome{RequestID: accepted["requestId"].(string), Status: "failed", Error: mustJSON(map[string]any{"code": "execution_failure", "message": "many handlers failed", "failures": failures}), PartialEffects: []string{"local effect already completed"}, CompletedAt: isoNow()}
	if err := conn.Write(context.Background(), websocket.MessageText, mustJSON(map[string]any{"type": "outcome", "outcome": outcome})); err != nil {
		t.Fatal(err)
	}
	job := actionTerminal(t, client, accepted["job"].(map[string]any)["jobId"].(string))
	if job.State != "failed" || !strings.Contains(string(job.Error), "local effect already completed") || !strings.Contains(string(job.Error), `"failuresTruncated":true`) || len(job.Error) > 64<<10 {
		t.Fatal("large stacks erased partial-effect evidence", job.State, len(job.Error))
	}
}

func TestDevAppActionConfirmedFactsSurviveShutdownDuringValidation(t *testing.T) {
	for _, reject := range []bool{false, true} {
		t.Run(map[bool]string{false: "confirmed-success", true: "unvalidated-result"}[reject], func(t *testing.T) {
			shutdown := make(chan context.CancelFunc, 1)
			policy := devActionPolicy{Allowed: true, TimeoutMs: 30000}
			validate := func(_ context.Context, phase string, _ json.RawMessage, value json.RawMessage, _ string) (json.RawMessage, devActionPolicy, *cliError) {
				if phase == "output" {
					(<-shutdown)()
					if reject {
						return nil, policy, invalid("fixture output rejected")
					}
				}
				return value, policy, nil
			}
			server, client, conn, instance := devActionsFixtureValidator(t, policy, validate)
			shutdown <- server.cancel
			accepted, failure := callAction(t, client, instance, "shutdown-validation")
			if failure != nil {
				t.Fatal(failure)
			}
			_ = appSocketRead(t, conn)
			outcome := devActionOutcome{RequestID: accepted["requestId"].(string), Status: "succeeded", Result: json.RawMessage(`{"value":1}`), CompletedAt: isoNow()}
			_ = conn.Write(context.Background(), websocket.MessageText, mustJSON(map[string]any{"type": "outcome", "outcome": outcome}))
			id := accepted["job"].(map[string]any)["jobId"].(string)
			deadline := time.Now().Add(2 * time.Second)
			for {
				job, failure := server.actions.jobs.status(server.record.AppRoot, server.record.AppRoot, id)
				if failure != nil {
					t.Fatal(failure)
				}
				if !runtimeJobLive(job.State) {
					expected := "succeeded"
					if reject {
						expected = "failed"
					}
					if job.State != expected {
						t.Fatal("shutdown erased provider facts", job.State, expected)
					}
					if reject && !strings.Contains(string(job.Error), `"outcome":"unvalidated"`) {
						t.Fatal("output validation failure facts lost")
					}
					break
				}
				if time.Now().After(deadline) {
					t.Fatal("shutdown validation did not finish")
				}
				time.Sleep(time.Millisecond)
			}
		})
	}
}

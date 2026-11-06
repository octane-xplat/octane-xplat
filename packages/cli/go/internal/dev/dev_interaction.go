package dev

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"slices"
	"time"
)

type devInteractionReceipt struct {
	fingerprint string
	done        chan struct{}
	reply       json.RawMessage
}
type devInteractionReply struct {
	Data  json.RawMessage `json:"data,omitempty"`
	Error *cli.Error      `json:"error,omitempty"`
}

// An accepted mutation outlives its HTTP client. Keep request-key bindings for
// this startup even when observation ends without a confirmed outcome.
func (service *devInspection) interact(parent context.Context, values map[string]any) (any, *cli.Error) {
	if failure := actionPermission(values, "runtime-actions"); failure != nil {
		return nil, failure
	}
	for name, value := range values {
		if name == "_grants" {
			continue
		}
		if !slices.Contains([]string{"sessionId", "documentId", "id", "testID", "mechanism", "requestKey"}, name) {
			return nil, cli.Invalid("Unknown interaction option: " + name)
		}
		text, ok := value.(string)
		if !ok || text == "" || len(text) > 256 {
			return nil, cli.Invalid("Interaction identities and selectors require1–256 bytes.")
		}
	}
	key, document, session, mechanism := cli.StringValue(values["requestKey"]), cli.StringValue(values["documentId"]), cli.StringValue(values["sessionId"]), cli.StringValue(values["mechanism"])
	if key == "" || document == "" || session == "" || mechanism == "" {
		return nil, cli.Invalid("Interaction requires a session, --document, --mechanism and --request-key.")
	}
	if mechanism != "handler-dispatch" {
		return nil, &cli.Error{Code: "unsupported_capability", Message: "The app-socket adapter supports explicit handler-dispatch only; no CDP or OS input was sent."}
	}
	var control map[string]string
	for _, name := range []string{"id", "testID"} {
		if value := cli.StringValue(values[name]); value != "" {
			if control != nil {
				return nil, cli.Invalid("Pass either --id or --testid.")
			}
			control = map[string]string{"kind": name, "name": value}
		}
	}
	if control == nil {
		return nil, cli.Invalid("Interaction requires --id or --testid from inspect.")
	}
	binding, _ := json.Marshal(map[string]any{"session": session, "document": document, "control": control, "mechanism": "handler-dispatch"})
	fingerprint := fmt.Sprintf("%x", sha256.Sum256(binding))
	service.mu.Lock()
	if previous := service.receipts[key]; previous != nil {
		if previous.fingerprint != fingerprint {
			service.mu.Unlock()
			return nil, &cli.Error{Code: "stale_identity", Message: "This interaction request key is bound to different input; no request was replayed."}
		}
		service.mu.Unlock()
		select {
		case <-previous.done:
			return interactionReceiptReply(previous.reply)
		case <-parent.Done():
			return nil, &cli.Error{Code: "unavailable", Message: "The original interaction is still being observed. Reuse this key to read its receipt; do not repeat with a new key.", Context: map[string]any{"outcome": "unknown", "requestKey": key}}
		}
	}
	if parent.Err() != nil || service.server.ctx.Err() != nil {
		service.mu.Unlock()
		return nil, &cli.Error{Code: "unavailable", Message: "Interaction admission was cancelled; no request was sent.", Context: map[string]any{"outcome": "not-run"}}
	}
	if len(service.receipts) >= 256 {
		service.mu.Unlock()
		return nil, &cli.Error{Code: "unavailable", Message: "This dev-server startup reached its256 interaction-key limit; no request was sent."}
	}
	receipt := &devInteractionReceipt{fingerprint: fingerprint, done: make(chan struct{})}
	service.receipts[key] = receipt
	service.mu.Unlock()
	// This HTTP handler remains registered until the bounded operation ends, even
	// if the client disconnects. Foreground shutdown cancels and joins the handler.
	result, failure := service.runInteraction(key, document, values, control)
	data, _ := json.Marshal(result)
	serialized, _ := json.Marshal(devInteractionReply{Data: data, Error: failure})
	service.mu.Lock()
	receipt.reply = serialized
	close(receipt.done)
	service.mu.Unlock()
	return interactionReceiptReply(serialized)
}
func interactionReceiptReply(raw json.RawMessage) (any, *cli.Error) {
	var reply devInteractionReply
	if json.Unmarshal(raw, &reply) != nil {
		return nil, &cli.Error{Code: "execution_failure", Message: "Invalid interaction receipt; no request was replayed."}
	}
	return reply.Data, reply.Error
}
func (service *devInspection) runInteraction(key, document string, values map[string]any, control map[string]string) (any, *cli.Error) {
	peer, current, failure := service.selectedPeer(values)
	if failure != nil {
		return nil, interactionFailure(failure, key, "not-run")
	}
	if current != document {
		return nil, interactionFailure(&cli.Error{Code: "stale_identity", Message: "The document changed since inspection; no input was sent."}, key, "not-run")
	}
	service.server.apps.mu.Lock()
	supported := peer.registry.Inspection != nil && slices.Contains(peer.registry.Inspection.Mechanisms, "handler-dispatch")
	service.server.apps.mu.Unlock()
	if !supported {
		return nil, interactionFailure(&cli.Error{Code: "unsupported_capability", Message: "This app did not announce handler dispatch; install the matching development plugin."}, key, "not-run")
	}
	args := map[string]any{"documentId": document, "control": control, "mechanism": "handler-dispatch", "expiresAt": time.Now().Add(3 * time.Second).UnixMilli()}
	raw, failure := service.exchange(service.server.ctx, peer, document, "interact", args)
	if failure != nil {
		outcome := "not-run"
		if interactionOutcome(failure) == "unknown" {
			outcome = "unknown"
		}
		return nil, interactionFailure(failure, key, outcome)
	}
	var result struct {
		DocumentID   string            `json:"documentId"`
		Controls     []json.RawMessage `json:"controls"`
		InputSent    *bool             `json:"inputSent"`
		Mechanism    string            `json:"mechanism"`
		EventTrusted *bool             `json:"eventTrusted"`
		Error        *cli.Error        `json:"error"`
		Outcome      string            `json:"outcome"`
	}
	if json.Unmarshal(raw, &result) != nil {
		return nil, interactionFailure(&cli.Error{Code: "execution_failure", Message: "Invalid interaction response; effects are unknown."}, key, "unknown")
	}
	if result.Error != nil {
		outcome := "unknown"
		if result.Outcome == "not-run" {
			outcome = "not-run"
		}
		if !slices.Contains([]string{"invalid_selection", "not_found", "ambiguous_selection", "unavailable", "stale_identity", "unsupported_capability", "execution_failure"}, result.Error.Code) {
			result.Error = &cli.Error{Code: "execution_failure", Message: "App interaction failed; effects are unknown."}
			outcome = "unknown"
		}
		return nil, interactionFailure(result.Error, key, outcome)
	}
	if result.DocumentID != document || result.InputSent == nil || !*result.InputSent || result.EventTrusted == nil || *result.EventTrusted || result.Mechanism != "handler-dispatch" || len(result.Controls) != 1 {
		return nil, interactionFailure(&cli.Error{Code: "execution_failure", Message: "The app did not confirm the requested dispatch; effects are unknown."}, key, "unknown")
	}
	confirmed := map[string]any{"requestKey": key, "documentId": document, "control": control, "inputSent": true, "mechanism": "handler-dispatch", "eventTrusted": false, "assertion": "Programmatic click dispatch only; inspect the intended app state separately.", "coverage": namedHostCoverage}
	observation := map[string]any{}
	for name, value := range confirmed {
		observation[name] = value
	}
	observation["controls"] = result.Controls
	record := service.recordEvidence(peer, document, "interaction", "handler-dispatch", observation)
	var reference struct {
		ID         string          `json:"id"`
		Kind       string          `json:"kind"`
		Provenance json.RawMessage `json:"provenance"`
	}
	_ = json.Unmarshal(record, &reference)
	// Receipts retain delivery facts, not a second copy of the evidence data.
	// Deleting/evicting evidence must actually release its recorded UI text.
	confirmed["evidence"] = map[string]any{"id": reference.ID, "kind": reference.Kind, "provenance": reference.Provenance, "referenceOnly": true}

	return confirmed, nil
}
func interactionFailure(failure *cli.Error, key, outcome string) *cli.Error {
	// Preserve known provider outcome separately from transport/process ownership.
	return &cli.Error{Code: failure.Code, Message: failure.Message, Context: map[string]any{"outcome": outcome, "requestKey": key, "requestedMechanism": "handler-dispatch"}}
}

func interactionOutcome(failure *cli.Error) string {
	if failure == nil {
		return ""
	}
	data, _ := failure.Context.(map[string]any)
	return cli.StringValue(data["outcome"])
}

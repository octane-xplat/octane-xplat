package main

import (
	"context"
	"encoding/json"
	"slices"
	"sync"
	"time"
)

const namedHostCoverage = "Named DOM hosts in the main document; excludes shadow roots, frames, component ownership and signals."

type devInspectionCapability struct {
	Version    int      `json:"version"`
	DocumentID string   `json:"documentId"`
	Mechanisms []string `json:"mechanisms,omitempty"`
}
type devInspectionPending struct {
	peer   *devAppPeer
	result chan json.RawMessage
}
type devInspection struct {
	mu            sync.Mutex
	server        *devServer
	pending       map[string]*devInspectionPending
	busy          map[*devAppPeer]bool
	evidence      []json.RawMessage
	evidenceBytes int
	receipts      map[string]*devInteractionReceipt
}

func newDevInspection(server *devServer) *devInspection {
	return &devInspection{server: server, pending: map[string]*devInspectionPending{}, busy: map[*devAppPeer]bool{}, receipts: map[string]*devInteractionReceipt{}}
}
func (service *devInspection) receive(peer *devAppPeer, request string, result json.RawMessage) bool {
	if request == "" || len(request) > 128 || len(result) > 256<<10 || len(result) == 0 {
		return false
	}
	service.mu.Lock()
	defer service.mu.Unlock()
	pending := service.pending[request]
	if pending == nil {
		return true
	} // Cancelled/late reads cannot mutate another request.
	if pending.peer != peer {
		return false
	}
	select {
	case pending.result <- slices.Clone(result):
	default:
	}
	return true
}
func (service *devInspection) disconnected(peer *devAppPeer) {
	service.mu.Lock()
	defer service.mu.Unlock()
	for _, pending := range service.pending {
		if pending.peer == peer {
			select {
			case pending.result <- nil:
			default:
			}
		}
	}
}
func (service *devInspection) inspect(parent context.Context, values map[string]any) (any, *cliError) {
	if failure := actionPermission(values, "runtime-actions"); failure != nil {
		return nil, failure
	}
	args := map[string]any{"offset": 0, "limit": 20}
	for key, value := range values {
		switch key {
		case "sessionId", "_grants":
		case "offset", "limit":
			number, ok := value.(float64)
			if !ok || number != float64(int(number)) || number < 0 || (key == "limit" && (number < 1 || number > 100)) || number > 9007199254740991 {
				return nil, invalid("Invalid bounded inspection page.")
			}
			args[key] = int(number)
		case "id", "testID":
			text, ok := value.(string)
			if !ok || text == "" || len(text) > 256 {
				return nil, invalid("Stable control names must contain 1–256 bytes.")
			}
			if args["control"] != nil {
				return nil, invalid("Pass either --id or --testid.")
			}
			args["control"] = map[string]string{"kind": key, "name": text}
		default:
			return nil, invalid("Unknown inspection option: " + key)
		}
	}
	peer, document, failure := service.selectedPeer(values)
	if failure != nil {
		return nil, failure
	}
	raw, failure := service.exchange(parent, peer, document, "inspect", args)
	if failure != nil {
		return nil, failure
	}
	var page struct {
		DocumentID string            `json:"documentId"`
		Controls   []json.RawMessage `json:"controls"`
		Total      *int              `json:"total"`
		NextOffset *int              `json:"nextOffset"`
		Error      *cliError         `json:"error"`
	}
	if json.Unmarshal(raw, &page) != nil {
		return nil, &cliError{Code: "execution_failure", Message: "Invalid app inspection response."}
	}
	if page.Error != nil {
		if !slices.Contains([]string{"not_found", "ambiguous_selection", "invalid_selection", "unavailable", "unsupported_capability"}, page.Error.Code) {
			return nil, &cliError{Code: "execution_failure", Message: "App inspection failed."}
		}
		return nil, &cliError{Code: page.Error.Code, Message: page.Error.Message}
	}
	offset, limit := args["offset"].(int), args["limit"].(int)
	if page.DocumentID != document {
		return nil, &cliError{Code: "stale_identity", Message: "The app returned a different document identity; inspect again."}
	}
	if page.Controls == nil || len(page.Controls) > limit || page.Total == nil || *page.Total < 0 || *page.Total < len(page.Controls) || (offset <= *page.Total && len(page.Controls) > *page.Total-offset) || (offset > *page.Total && len(page.Controls) != 0) || (page.NextOffset != nil && (*page.NextOffset != offset+len(page.Controls) || *page.NextOffset >= *page.Total)) {
		return nil, &cliError{Code: "execution_failure", Message: "Invalid app inspection page bounds."}
	}
	result := map[string]any{"documentId": document, "controls": page.Controls, "total": *page.Total, "nextOffset": page.NextOffset, "coverage": namedHostCoverage, "limitations": []string{"App-reported main-document state only; no OS input, component tree, screenshot or build revision assertion."}}
	result["evidence"] = service.recordEvidence(peer, document, "inspection", "none", result)
	return result, nil
}
func (service *devInspection) evidenceOperation(ctx context.Context, command string, values map[string]any) (any, *cliError) {
	for key := range values {
		if !slices.Contains([]string{"kind", "id", "expiresAt", "_grants"}, key) {
			return nil, invalid("Unknown evidence option: " + key)
		}
	}
	if command == "evidence retain" {
		if failure := actionPermission(values, "evidence-retain"); failure != nil {
			return nil, failure
		}
	}
	parent, err := diagnosticsHistoryParent()
	if err != nil {
		return nil, executionFailure(err)
	}
	service.mu.Lock()
	defer service.mu.Unlock()
	id := stringValue(values["id"])
	var source json.RawMessage
	index := -1
	for i, raw := range service.evidence {
		var header evidenceRecordHeader
		_ = json.Unmarshal(raw, &header)
		if header.ID == id {
			source = raw
			index = i
			break
		}
	}
	durable, failure := evidenceDiskCommand(ctx, parent, service.server.record.AppRoot, command, values, source)
	if command == "evidence list" {
		if failure != nil {
			return nil, failure
		}
		records := durable.([]json.RawMessage)
		seen := map[string]bool{}
		for _, raw := range records {
			var header evidenceRecordHeader
			_ = json.Unmarshal(raw, &header)
			seen[header.ID] = true
		}
		for _, raw := range service.evidence {
			var header evidenceRecordHeader
			_ = json.Unmarshal(raw, &header)
			if !seen[header.ID] && (stringValue(values["kind"]) == "" || stringValue(values["kind"]) == header.Kind) {
				records = append(records, slices.Clone(raw))
			}
		}
		return map[string]any{"evidence": records, "retention": "Session records expire with this server; explicitly retained records survive restart. Expired disk records are filtered; mutations collect them."}, nil
	}
	if command == "evidence delete" && index >= 0 && failure != nil && failure.Code == "not_found" {
		failure = nil
		durable = map[string]any{"deleted": true, "id": id, "note": "Deleting a server record cannot erase client transcripts or delivery receipts."}
	}
	if failure != nil {
		return nil, failure
	}
	if index >= 0 {
		service.evidenceBytes -= len(service.evidence[index])
		service.evidence = slices.Delete(service.evidence, index, index+1)
	}
	return durable, nil
}

func (service *devInspection) selectedPeer(values map[string]any) (*devAppPeer, string, *cliError) {
	hub := service.server.apps
	hub.mu.Lock()
	var peer *devAppPeer
	for _, candidate := range hub.peers {
		if candidate.session == stringValue(values["sessionId"]) {
			peer = candidate
			break
		}
	}
	if peer == nil {
		hub.mu.Unlock()
		return nil, "", &cliError{Code: "not_found", Message: "No app session with this identity in the current dev server."}
	}
	if !peer.ready || peer.disconnectedAt != "" {
		hub.mu.Unlock()
		return nil, "", &cliError{Code: "disconnected_runtime", Message: "The selected app is disconnected; no server or app was started."}
	}
	capability := peer.registry.Inspection
	if peer.platform != "web" || capability == nil || capability.Version != 1 || capability.DocumentID == "" || len(capability.DocumentID) > 128 {
		hub.mu.Unlock()
		return nil, "", &cliError{Code: "unsupported_capability", Message: "This app did not announce the named-host browser inspector."}
	}
	document := capability.DocumentID
	hub.mu.Unlock()
	return peer, document, nil
}

func (service *devInspection) exchange(parent context.Context, peer *devAppPeer, document, operation string, args map[string]any) (json.RawMessage, *cliError) {
	request := identity()
	pending := &devInspectionPending{peer: peer, result: make(chan json.RawMessage, 1)}
	service.mu.Lock()
	if service.busy[peer] || len(service.pending) >= 32 {
		service.mu.Unlock()
		return nil, &cliError{Code: "target_busy", Message: "Another app observation or interaction is pending; no request was sent."}
	}
	service.pending[request] = pending
	service.busy[peer] = true
	service.mu.Unlock()
	defer func() {
		service.mu.Lock()
		delete(service.pending, request)
		delete(service.busy, peer)
		service.mu.Unlock()
	}()
	ctx, cancel := context.WithTimeout(parent, 3*time.Second)
	defer cancel()

	service.server.apps.mu.Lock()
	current := service.server.apps.peers[peer.instance] == peer && peer.ready && peer.disconnectedAt == "" && peer.registry.Inspection != nil && peer.registry.Inspection.DocumentID == document
	service.server.apps.mu.Unlock()
	if !current {
		return nil, &cliError{Code: "stale_identity", Message: "The app or document changed before dispatch; no request was sent."}
	}
	data, _ := json.Marshal(map[string]any{"type": operation, "requestId": request, "args": args})
	if err := writeDevApp(service.server.ctx, peer, data); err != nil {
		return nil, appExchangeFailure(operation, "disconnected_runtime", "App delivery could not be confirmed.")
	}
	var raw json.RawMessage
	var ended *cliError
	select {
	case raw = <-pending.result:
	default:
		select {
		case raw = <-pending.result:
		case <-ctx.Done():
			ended = appExchangeFailure(operation, "unavailable", "App observation timed out or was cancelled.")
		case <-service.server.ctx.Done():
			ended = appExchangeFailure(operation, "disconnected_runtime", "The dev server is stopping.")
		}
	}
	if ended != nil {
		// App-confirmed facts already received win a simultaneous shutdown.
		select {
		case raw = <-pending.result:
		default:
			return nil, ended
		}
	}

	if raw == nil {
		return nil, appExchangeFailure(operation, "disconnected_runtime", "The app disconnected during observation.")
	}
	service.server.apps.mu.Lock()
	live := service.server.apps.peers[peer.instance] == peer && peer.ready && peer.disconnectedAt == "" && peer.registry.Inspection != nil && peer.registry.Inspection.DocumentID == document
	service.server.apps.mu.Unlock()
	if !live && operation == "inspect" {
		return nil, &cliError{Code: "stale_identity", Message: "The app or document changed during inspection; inspect the current session again."}
	}
	return raw, nil
}

func appExchangeFailure(operation, code, message string) *cliError {
	failure := &cliError{Code: code, Message: message}
	if operation == "interact" {
		failure.Message += " Interaction effects are unknown."
		failure.Context = map[string]any{"outcome": "unknown"}
	}
	return failure
}
func (service *devInspection) recordEvidence(peer *devAppPeer, document, kind, mechanism string, result map[string]any) json.RawMessage {
	record := map[string]any{"id": "ev_" + identity(), "kind": kind, "summary": kind + " of named hosts in a connected browser app", "provenance": map[string]any{"appRoot": service.server.record.AppRoot, "platform": peer.platform, "targetId": peer.target, "sessionId": peer.session, "appInstanceId": peer.instance, "documentId": document, "mechanism": mechanism, "capturedAt": isoNow()}, "data": result, "createdAt": isoNow(), "retention": map[string]any{"scope": "session", "detail": "Bounded to this dev-server startup; oldest session records are evicted."}}
	serialized, _ := json.Marshal(record)
	service.mu.Lock()
	for len(service.evidence) > 0 && (len(service.evidence) >= 32 || service.evidenceBytes+len(serialized) > 2<<20) {
		service.evidenceBytes -= len(service.evidence[0])
		service.evidence = service.evidence[1:]
	}
	service.evidence = append(service.evidence, serialized)
	service.evidenceBytes += len(serialized)
	service.mu.Unlock()
	return serialized
}

package main

import (
	"context"
	"encoding/json"
	"github.com/coder/websocket"
	"testing"
	"time"
)

func TestDevAppInspectionRoundTripAndEvidence(t *testing.T) {
	server, _, conn, instance := devActionsFixture(t, devActionPolicy{Allowed: true, TimeoutMs: 30000})
	service := server.inspection
	server.apps.mu.Lock()
	peer := server.apps.peers[instance]
	peer.registry.Inspection = &devInspectionCapability{Version: 1, DocumentID: "doc_fixture"}
	session := peer.session
	server.apps.mu.Unlock()
	done := make(chan any, 1)
	failure := make(chan *cliError, 1)
	go func() {
		result, err := service.inspect(context.Background(), map[string]any{"sessionId": session, "_grants": []string{"runtime-actions"}})
		done <- result
		failure <- err
	}()
	request := appSocketRead(t, conn)
	if request["type"] != "inspect" {
		t.Fatal(request)
	}
	// A response from a different peer cannot satisfy this read.
	if service.receive(&devAppPeer{}, request["requestId"].(string), json.RawMessage(`{}`)) {
		t.Fatal("foreign inspection result accepted")
	}
	result := map[string]any{"documentId": "doc_fixture", "controls": []any{}, "total": 0, "nextOffset": nil}
	if err := conn.Write(context.Background(), websocket.MessageText, mustJSON(map[string]any{"type": "inspection", "requestId": request["requestId"], "result": result})); err != nil {
		t.Fatal(err)
	}
	var value map[string]any
	select {
	case data := <-done:
		value = data.(map[string]any)
	case <-time.After(time.Second):
		t.Fatal("inspection did not finish")
	}
	if err := <-failure; err != nil {
		t.Fatal(err)
	}
	if value["documentId"] != "doc_fixture" || value["coverage"] != namedHostCoverage {
		t.Fatal(value)
	}
	list, err := service.evidenceCommand("evidence list", map[string]any{})
	if err != nil {
		t.Fatal(err)
	}
	records := list.(map[string]any)["evidence"].([]json.RawMessage)
	if len(records) != 1 {
		t.Fatal(list)
	}
	var record struct {
		ID string `json:"id"`
	}
	_ = json.Unmarshal(records[0], &record)
	if _, err := service.evidenceCommand("evidence delete", map[string]any{"id": record.ID}); err != nil {
		t.Fatal(err)
	}
	if _, err := service.evidenceCommand("evidence delete", map[string]any{"id": record.ID}); err == nil || err.Code != "not_found" {
		t.Fatal(err)
	}
}
func TestDevAppInspectionAdmissionAndCancellation(t *testing.T) {
	server, _, conn, instance := devActionsFixture(t, devActionPolicy{Allowed: true, TimeoutMs: 30000})
	service := server.inspection
	server.apps.mu.Lock()
	peer := server.apps.peers[instance]
	session := peer.session
	server.apps.mu.Unlock()
	values := map[string]any{"sessionId": session}
	if _, failure := service.inspect(context.Background(), values); failure == nil || failure.Code != "permission_denied" {
		t.Fatal(failure)
	}
	values["_grants"] = []string{"runtime-actions"}
	if _, failure := service.inspect(context.Background(), values); failure == nil || failure.Code != "unsupported_capability" {
		t.Fatal(failure)
	}
	server.apps.mu.Lock()
	peer.registry.Inspection = &devInspectionCapability{Version: 1, DocumentID: "doc_fixture"}
	server.apps.mu.Unlock()
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan *cliError, 1)
	go func() { _, failure := service.inspect(ctx, values); done <- failure }()
	request := appSocketRead(t, conn)
	if _, failure := service.inspect(context.Background(), values); failure == nil || failure.Code != "target_busy" {
		t.Fatal(failure)
	}
	cancel()
	select {
	case failure := <-done:
		if failure == nil {
			t.Fatal("cancelled inspection succeeded")
		}
	case <-time.After(time.Second):
		t.Fatal("cancelled read retained its slot")
	}
	if !service.receive(peer, request["requestId"].(string), json.RawMessage(`{}`)) {
		t.Fatal("late read should be ignored")
	}
	service.mu.Lock()
	busy := len(service.pending) + len(service.busy)
	service.mu.Unlock()
	if busy != 0 {
		t.Fatal("inspection slot leaked", busy)
	}
	conn.CloseRead(context.Background())
	ping, stop := context.WithTimeout(context.Background(), time.Second)
	defer stop()
	if err := conn.Ping(ping); err != nil {
		t.Fatal("inspection cancellation closed the app connection", err)
	}
}

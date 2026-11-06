package dev

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"testing"
	"time"

	"github.com/coder/websocket"
)

func interactionFixture(t *testing.T) (*devServer, *devServerClient, *websocket.Conn, map[string]any) {
	t.Helper()
	ready := make(chan struct{})
	var service *devInspection
	server, cache, app := devServerFixture(t, func(ctx context.Context, command string, values map[string]any) (any, *cli.Error) {
		<-ready
		return service.interact(ctx, values)
	})
	service = server.inspection
	close(ready)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	conn := appSocketDial(t, grant, "", grant.Token, "interaction-app")
	_ = appSocketRead(t, conn)
	waitActionPeerReady(t, server, "interaction-app")
	server.apps.mu.Lock()
	peer := server.apps.peers["interaction-app"]
	peer.registry.Inspection = &devInspectionCapability{Version: 1, DocumentID: "doc_fixture", Mechanisms: []string{"handler-dispatch"}}
	session := peer.session
	server.apps.mu.Unlock()
	client, failure := lookupDevServer(context.Background(), cache, app)
	if failure != nil {
		t.Fatal(failure)
	}
	return server, client, conn, map[string]any{"sessionId": session, "documentId": "doc_fixture", "id": "button", "mechanism": "handler-dispatch", "requestKey": "click-once", "_grants": []string{"runtime-actions"}}
}
func confirmInteraction(t *testing.T, conn *websocket.Conn, request map[string]any) {
	t.Helper()
	if request["type"] != "interact" {
		t.Fatal(request)
	}
	args := request["args"].(map[string]any)
	if args["documentId"] != "doc_fixture" || args["expiresAt"].(float64) <= float64(time.Now().UnixMilli()) {
		t.Fatal("invalid interaction deadline/identity", args)
	}
	result := map[string]any{"documentId": "doc_fixture", "controls": []any{map[string]any{"id": "button", "text": "UI text belongs only in evidence"}}, "inputSent": true, "eventTrusted": false, "mechanism": "handler-dispatch"}
	if err := conn.Write(context.Background(), websocket.MessageText, mustJSON(map[string]any{"type": "inspection", "requestId": request["requestId"], "result": result})); err != nil {
		t.Fatal(err)
	}
}
func TestDevAppInteractionSurvivesClientDisconnectAndNeverRepeats(t *testing.T) {
	server, client, conn, values := interactionFixture(t)
	ctx, cancel := context.WithCancel(context.Background())
	first := make(chan *cli.Error, 1)
	go func() { _, failure := client.call(ctx, "interact", values); first <- failure }()
	request := appSocketRead(t, conn)
	cancel()
	select {
	case failure := <-first:
		if failure == nil {
			t.Fatal("cancelled caller unexpectedly received confirmation")
		}
	case <-time.After(time.Second):
		t.Fatal("HTTP caller did not cancel")
	}
	confirmInteraction(t, conn, request)
	receipt, failure := client.call(context.Background(), "interact", values)
	if failure != nil {
		t.Fatal(failure)
	}
	repeated, failure := client.call(context.Background(), "interact", values)
	if failure != nil || !bytes.Equal(receipt, repeated) {
		t.Fatal("retry changed the retained receipt", failure)
	}
	var confirmed struct {
		InputSent    bool `json:"inputSent"`
		EventTrusted bool `json:"eventTrusted"`
		Evidence     struct {
			Provenance struct {
				Mechanism string `json:"mechanism"`
			} `json:"provenance"`
		} `json:"evidence"`
	}
	if json.Unmarshal(receipt, &confirmed) != nil || !confirmed.InputSent || confirmed.EventTrusted || confirmed.Evidence.Provenance.Mechanism != "handler-dispatch" {
		t.Fatal(string(receipt))
	}

	if bytes.Contains(receipt, []byte("UI text belongs only in evidence")) {
		t.Fatal("receipt retained a second copy of UI text")
	}
	var stored struct {
		Evidence struct {
			ID string `json:"id"`
		} `json:"evidence"`
	}
	_ = json.Unmarshal(receipt, &stored)
	if _, failure := server.inspection.evidenceOperation(server.ctx, "evidence delete", map[string]any{"id": stored.Evidence.ID}); failure != nil {
		t.Fatal(failure)
	}
	afterDelete, failure := client.call(context.Background(), "interact", values)
	if failure != nil || !bytes.Equal(receipt, afterDelete) {
		t.Fatal("evidence deletion lost dispatch receipt", failure)
	}
	server.inspection.mu.Lock()
	for _, record := range server.inspection.evidence {
		if bytes.Contains(record, []byte("UI text belongs only in evidence")) {
			t.Error("deleted UI text remains in evidence")
		}
	}
	server.inspection.mu.Unlock()

	changed := map[string]any{}
	for key, value := range values {
		changed[key] = value
	}
	changed["id"] = "other"
	if _, failure := client.call(context.Background(), "interact", changed); failure == nil || failure.Code != "stale_identity" {
		t.Fatal("rebound key accepted", failure)
	}
	server.inspection.mu.Lock()
	count := len(server.inspection.receipts)
	server.inspection.mu.Unlock()
	if count != 1 {
		t.Fatal("one request key created multiple receipts", count)
	}
	conn.CloseRead(context.Background())
	ping, stop := context.WithTimeout(context.Background(), time.Second)
	defer stop()
	if err := conn.Ping(ping); err != nil {
		t.Fatal("HTTP cancellation ended the app", err)
	}
}
func TestDevAppInteractionLostOutcomeIsNotRetried(t *testing.T) {
	_, client, conn, values := interactionFixture(t)
	done := make(chan *cli.Error, 1)
	go func() { _, failure := client.call(context.Background(), "interact", values); done <- failure }()
	_ = appSocketRead(t, conn)
	_ = conn.CloseNow()
	var first *cli.Error
	select {
	case first = <-done:
	case <-time.After(time.Second):
		t.Fatal("disconnected interaction did not end")
	}
	if first == nil || interactionOutcome(first) != "unknown" {
		t.Fatal("lost delivery invented an outcome", first)
	}
	_, repeated := client.call(context.Background(), "interact", values)
	if repeated == nil || interactionOutcome(repeated) != "unknown" || repeated.Message != first.Message {
		t.Fatal("retry forgot ambiguous effects", repeated)
	}
}
func TestDevAppInteractionAdmissionRejectsStaleAndUnsafeInput(t *testing.T) {
	server, _, _, values := interactionFixture(t)
	for _, name := range []string{"requestKey", "documentId", "id", "mechanism"} {
		missing := map[string]any{}
		for key, value := range values {
			if key != name {
				missing[key] = value
			}
		}
		if _, failure := server.inspection.interact(context.Background(), missing); failure == nil || failure.Code != "invalid_selection" {
			t.Fatal("omitted required interaction field", name, failure)
		}
	}
	values["documentId"] = "stale"
	_, failure := server.inspection.interact(context.Background(), values)
	if failure == nil || failure.Code != "stale_identity" || interactionOutcome(failure) != "not-run" {
		t.Fatal(failure)
	}
	service := server.inspection
	service.mu.Lock()
	pending := len(service.pending)
	service.mu.Unlock()
	if pending != 0 {
		t.Fatal("stale document reached socket delivery")
	}
}

func TestDevAppInteractionRequiresExplicitConfirmationBooleans(t *testing.T) {
	for _, field := range []string{"inputSent", "eventTrusted"} {
		t.Run(field, func(t *testing.T) {
			_, client, conn, values := interactionFixture(t)
			done := make(chan *cli.Error, 1)
			go func() { _, failure := client.call(context.Background(), "interact", values); done <- failure }()
			request := appSocketRead(t, conn)
			result := map[string]any{"documentId": "doc_fixture", "controls": []any{map[string]any{"id": "button"}}, "inputSent": true, "eventTrusted": false, "mechanism": "handler-dispatch"}
			result[field] = nil
			if err := conn.Write(context.Background(), websocket.MessageText, mustJSON(map[string]any{"type": "inspection", "requestId": request["requestId"], "result": result})); err != nil {
				t.Fatal(err)
			}
			select {
			case failure := <-done:
				if interactionOutcome(failure) != "unknown" {
					t.Fatal("null became confirmed dispatch", failure)
				}
			case <-time.After(time.Second):
				t.Fatal("invalid confirmation was not rejected")
			}
		})
	}
}

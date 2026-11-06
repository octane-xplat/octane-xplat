package dev

import (
	"context"
	"encoding/json"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/coder/websocket"
)

func appSocketRegistry(id string) devAppRegistry {
	return devAppRegistry{Protocol: "xplat-dev-actions", Version: 1, AppInstanceID: id, Platform: "web", Revision: 1, Actions: []json.RawMessage{json.RawMessage(`{"id":"fixture.read","title":"Read","effects":{}}`)}}
}

func appSocketDial(t *testing.T, grant devAppGrant, origin string, token string, id string) *websocket.Conn {
	t.Helper()
	headers := http.Header{}
	if origin != "" {
		headers.Set("Origin", origin)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, grant.Socket, &websocket.DialOptions{HTTPHeader: headers})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = conn.CloseNow() })
	hello := devAppHello{Protocol: "octane-app-debug", Version: 1, InstanceID: grant.InstanceID, TargetID: grant.TargetID, Token: token, Registry: appSocketRegistry(id)}
	data, _ := json.Marshal(hello)
	if err = conn.Write(ctx, websocket.MessageText, data); err != nil {
		t.Fatal(err)
	}
	return conn
}

func appSocketRead(t *testing.T, conn *websocket.Conn) map[string]any {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_, data, err := conn.Read(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var reply map[string]any
	if json.Unmarshal(data, &reply) != nil {
		t.Fatal("invalid socket reply")
	}
	return reply
}

func TestDevAppCredentialsAndOriginIsolation(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	if grant.Token == server.record.Token || strings.Contains(grant.Socket, grant.Token) {
		t.Fatal("app grant leaked full CLI authority or put a credential in the URL")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_, response, err := websocket.Dial(ctx, grant.Socket, &websocket.DialOptions{HTTPHeader: http.Header{"Origin": []string{"http://evil.test"}}})
	if err == nil || response == nil || response.StatusCode != 403 {
		t.Fatal("unregistered browser Origin accepted", err)
	}
	conn := appSocketDial(t, grant, "", server.record.Token, "wrong-token")
	if _, _, err := conn.Read(ctx); err == nil {
		t.Fatal("CLI credential was accepted as app proof")
	}
	if len(server.apps.snapshots("")) != 0 {
		t.Fatal("unauthenticated app registered")
	}
	server.apps.allowOrigin("web", "http://127.0.0.1:5173/some/path")
	conn = appSocketDial(t, grant, "http://127.0.0.1:5173", grant.Token, "correct-app")
	reply := appSocketRead(t, conn)
	if reply["type"] != "registered" || reply["instanceId"] != server.record.InstanceID {
		t.Fatal(reply)
	}
	if strings.Contains(string(mustJSON(reply)), grant.Token) || strings.Contains(string(mustJSON(reply)), server.record.Token) {
		t.Fatal("response leaked credential")
	}
	client := &devServerClient{record: server.record}
	client.record.Token = grant.Token
	if _, failure := client.call(ctx, "server.ping", nil); failure == nil {
		t.Fatal("app proof authorized CLI RPC")
	}
}

func mustJSON(value any) []byte { data, _ := json.Marshal(value); return data }

func TestDevAppRegistryAttachAndReconnectKeepClientLifetimeSeparate(t *testing.T) {
	ready := make(chan struct{})
	var hub *devAppHub
	server, cache, app := devServerFixture(t, func(_ context.Context, command string, values map[string]any) (any, *cli.Error) {
		<-ready
		return hub.dispatch(command, values)
	})
	hub = server.apps
	close(ready)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})

	conn := appSocketDial(t, grant, "", grant.Token, "app-a")
	registered := appSocketRead(t, conn)
	session := registered["sessionId"].(string)
	client, failure := lookupDevServer(context.Background(), cache, app)
	if failure != nil {
		t.Fatal(failure)
	}
	for i := 0; i < 3; i++ {
		result, failure := client.call(context.Background(), "session attach", map[string]any{"platform": "web"})
		if failure != nil || !strings.Contains(string(result), session) {
			t.Fatal(string(result), failure)
		}
	}
	result, failure := client.call(context.Background(), "actions list", nil)
	if failure != nil || !strings.Contains(string(result), "fixture.read") {
		t.Fatal(string(result), failure)
	}
	updated := appSocketRegistry("app-a")
	updated.Revision = 2
	updated.Actions = []json.RawMessage{}
	if err := conn.Write(context.Background(), websocket.MessageText, mustJSON(devAppMessage{Type: "registry", Registry: updated})); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(time.Second)
	for {
		result, failure = client.call(context.Background(), "session status", map[string]any{"sessionId": session})
		if failure == nil && strings.Contains(string(result), `"registryRevision":2`) {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal(string(result), failure)
		}
		time.Sleep(time.Millisecond)
	}
	// A reconnection replaces only this app's socket. The old reader must not
	// disconnect its successor or any target, even when it finishes later.
	replacement := appSocketDial(t, grant, "", grant.Token, "app-a")
	if appSocketRead(t, replacement)["sessionId"] != session {
		t.Fatal("reconnect changed app session identity")
	}
	waitActionPeerReady(t, server, "app-a")
	second := appSocketDial(t, grant, "", grant.Token, "app-b")
	_ = appSocketRead(t, second)
	waitActionPeerReady(t, server, "app-b")
	if _, failure = client.call(context.Background(), "session attach", nil); failure == nil || failure.Code != "ambiguous_selection" {
		t.Fatal("ambiguous apps selected implicitly", failure)
	}
	if _, failure = client.call(context.Background(), "session attach", map[string]any{"appInstanceId": "app-a"}); failure != nil {
		t.Fatal(failure)
	}
	_ = replacement.Close(websocket.StatusNormalClosure, "app stopped")
	deadline = time.Now().Add(time.Second)
	for {
		result, _ = client.call(context.Background(), "session status", map[string]any{"sessionId": session})
		if strings.Contains(string(result), `"state":"disconnected"`) {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("app socket close not observed", string(result))
		}
		time.Sleep(time.Millisecond)
	}
	result, failure = client.call(context.Background(), "actions list", nil)
	if failure != nil || !strings.Contains(string(result), "disconnectedInstances") || !strings.Contains(string(result), "app-b") {
		t.Fatal(string(result), failure)
	}
	// Shutdown closes hijacked sockets too and joins their request lifetimes.
	if err := server.close(); err != nil {
		t.Fatal(err)
	}
}

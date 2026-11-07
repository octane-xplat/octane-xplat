package dev

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/coder/websocket"
)

func devSocketBase(server *devServer) string {
	return "ws" + strings.TrimSuffix(strings.TrimPrefix(server.record.Endpoint, "http"), "/rpc")
}

func devChannelRegistry(id string, channels ...devChannelRef) devAppRegistry {
	registry := appSocketRegistry(id)
	registry.Channels = channels
	return registry
}

func dialRegisteredApp(t *testing.T, grant devAppGrant, registry devAppRegistry) (*websocket.Conn, map[string]any) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, grant.Socket, nil)
	if err != nil {
		t.Fatal(err)
	}
	conn.SetReadLimit(1 << 20)
	t.Cleanup(func() { _ = conn.CloseNow() })
	hello := devAppHello{Protocol: "octane-app-debug", Version: 1, InstanceID: grant.InstanceID, TargetID: grant.TargetID, Token: grant.Token, Registry: registry}
	data, _ := json.Marshal(hello)
	if err := conn.Write(ctx, websocket.MessageText, data); err != nil {
		t.Fatal(err)
	}
	return conn, appSocketRead(t, conn)
}

func sendSocketFrame(t *testing.T, conn *websocket.Conn, frame any) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	data, err := json.Marshal(frame)
	if err != nil || conn.Write(ctx, websocket.MessageText, data) != nil {
		t.Fatal("test frame could not be sent")
	}
}

// coder/websocket closes the whole connection when a read's context ends, so a
// timed "no frame" read would destroy the socket. Non-delivery is proven by
// ordering: a later directed frame must be the next thing the peer receives.
func expectNextSocketFrame(t *testing.T, conn *websocket.Conn, from any, data any) {
	t.Helper()
	frame := appSocketRead(t, conn)
	if frame["type"] != "channel" {
		t.Fatalf("expected a channel frame, got %v", frame)
	}
	if from != nil && frame["from"] != from {
		t.Fatalf("expected frame from %v, got %v", from, frame)
	}
	if data != nil {
		want, _ := json.Marshal(data)
		got, _ := json.Marshal(frame["data"])
		if string(want) != string(got) {
			t.Fatalf("expected data %s, got %s", want, got)
		}
	}
}

func backendDial(t *testing.T, server *devServer, hello devBackendHello, origin string) *websocket.Conn {
	t.Helper()
	headers := http.Header{}
	if origin != "" {
		headers.Set("Origin", origin)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, devSocketBase(server)+"/backend", &websocket.DialOptions{HTTPHeader: headers})
	if err != nil {
		t.Fatal(err)
	}
	conn.SetReadLimit(1 << 20)
	t.Cleanup(func() { _ = conn.CloseNow() })
	data, _ := json.Marshal(hello)
	if err := conn.Write(ctx, websocket.MessageText, data); err != nil {
		t.Fatal(err)
	}
	return conn
}

func backendHello(grant devBackendGrant, channel string) devBackendHello {
	return devBackendHello{Protocol: "octane-devtools-backend", Version: 1, InstanceID: grant.InstanceID, TargetID: grant.TargetID, Token: grant.Token, Channel: channel}
}

func panelDial(t *testing.T, server *devServer, hello devPanelHello, origins ...string) *websocket.Conn {
	t.Helper()
	headers := http.Header{}
	for _, origin := range origins {
		headers.Add("Origin", origin)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, devSocketBase(server)+"/devtools", &websocket.DialOptions{HTTPHeader: headers})
	if err != nil {
		t.Fatal(err)
	}
	conn.SetReadLimit(1 << 20)
	t.Cleanup(func() { _ = conn.CloseNow() })
	data, _ := json.Marshal(hello)
	if err := conn.Write(ctx, websocket.MessageText, data); err != nil {
		t.Fatal(err)
	}
	return conn
}

func panelHello(server *devServer, token string) devPanelHello {
	return devPanelHello{Protocol: "octane-devtools", Version: 1, InstanceID: server.record.InstanceID, Token: token}
}

func TestDevServerChannelCredentials(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	backend := server.backendGrant(devTarget{ID: "web", Kind: "web"})
	if backend.Token == grant.Token || backend.Token == server.record.Token || backend.Token == server.record.DevtoolsToken {
		t.Fatal("backend credential reused another party's token")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// /backend is an engine-side endpoint; any Origin header is a browser.
	_, response, err := websocket.Dial(ctx, devSocketBase(server)+"/backend", &websocket.DialOptions{HTTPHeader: http.Header{"Origin": []string{"http://127.0.0.1:5173"}}})
	if err == nil || response == nil || response.StatusCode != http.StatusForbidden {
		t.Fatal("backend accepted an Origin header", err)
	}
	rejects := []devBackendHello{
		{Protocol: "octane-devtools-backend", Version: 1, InstanceID: backend.InstanceID, TargetID: backend.TargetID, Token: "wrong", Channel: "probe"},
		{Protocol: "octane-devtools-backend", Version: 1, InstanceID: backend.InstanceID, TargetID: backend.TargetID, Token: server.record.Token, Channel: "probe"},
		{Protocol: "octane-devtools-backend", Version: 1, InstanceID: backend.InstanceID, TargetID: backend.TargetID, Token: grant.Token, Channel: "probe"},
		{Protocol: "octane-devtools-backend", Version: 1, InstanceID: backend.InstanceID, TargetID: backend.TargetID, Token: server.record.DevtoolsToken, Channel: "probe"},
		{Protocol: "octane-devtools-backend", Version: 1, InstanceID: strings.Repeat("0", 32), TargetID: backend.TargetID, Token: backend.Token, Channel: "probe"},
		{Protocol: "octane-devtools-backend", Version: 1, InstanceID: backend.InstanceID, TargetID: "absent", Token: backend.Token, Channel: "probe"},
		{Protocol: "octane-devtools-backend", Version: 1, InstanceID: backend.InstanceID, TargetID: "", Token: backend.Token, Channel: "probe"},
		{Protocol: "octane-devtools-backend", Version: 1, InstanceID: backend.InstanceID, TargetID: backend.TargetID, Token: backend.Token, Channel: "Bad-Channel"},
		{Protocol: "octane-devtools", Version: 1, InstanceID: backend.InstanceID, TargetID: backend.TargetID, Token: backend.Token, Channel: "probe"},
	}
	for index, hello := range rejects {
		conn := backendDial(t, server, hello, "")
		if _, _, err := conn.Read(ctx); err == nil {
			t.Fatalf("rejected backend first frame %d stayed connected", index)
		}
	}
	live := backendDial(t, server, backendHello(backend, "probe"), "")
	ready := appSocketRead(t, live)
	if ready["type"] != "ready" {
		t.Fatal(ready)
	}

	// /devtools accepts a native (headerless) client or one loopback Origin.
	for _, origins := range [][]string{{"http://foreign.invalid:1"}, {"https://127.0.0.1:2"}, {"http://127.0.0.2:2"}, {"http://127.0.0.1:1", "http://localhost:2"}} {
		_, response, err = websocket.Dial(ctx, devSocketBase(server)+"/devtools", &websocket.DialOptions{HTTPHeader: http.Header{"Origin": origins}})
		if err == nil || response == nil || response.StatusCode != http.StatusForbidden {
			t.Fatalf("devtools accepted Origin %v", origins)
		}
	}
	for _, hello := range []devPanelHello{
		panelHello(server, "wrong"),
		panelHello(server, server.record.Token),
		panelHello(server, grant.Token),
		panelHello(server, backend.Token),
		{Protocol: "octane-devtools", Version: 1, InstanceID: strings.Repeat("0", 32), Token: server.record.DevtoolsToken},
	} {
		conn := panelDial(t, server, hello)
		if _, _, err := conn.Read(ctx); err == nil {
			t.Fatalf("rejected devtools first frame %+v stayed connected", hello)
		}
	}
	for _, origins := range [][]string{nil, {"http://127.0.0.1:8080"}, {"http://localhost:3000"}} {
		conn := panelDial(t, server, panelHello(server, server.record.DevtoolsToken), origins...)
		if frame := appSocketRead(t, conn); frame["type"] != "ready" || !strings.HasPrefix(frame["panel"].(string), "panel_") {
			t.Fatalf("devtools Origin %v not accepted: %v", origins, frame)
		}
	}

	// Channel credentials never authorize CLI RPC.
	for _, token := range []string{backend.Token, server.record.DevtoolsToken, grant.Token} {
		client := &devServerClient{record: server.record}
		client.record.Token = token
		if _, failure := client.call(ctx, "server.ping", nil); failure == nil {
			t.Fatal("a channel credential authorized CLI RPC")
		}
	}
}

func TestDevServerChannelRouting(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	otherGrant := server.appGrant(devTarget{ID: "second", Kind: "web"})
	spareGrant := server.appGrant(devTarget{ID: "spare", Kind: "web"})
	backend := server.backendGrant(devTarget{ID: "web", Kind: "web"})
	otherBackend := server.backendGrant(devTarget{ID: "second", Kind: "web"})

	app, ack := dialRegisteredApp(t, grant, devChannelRegistry("app-web", devChannelRef{ID: "probe", Version: 1}))
	session := ack["sessionId"].(string)
	if capabilities, ok := ack["capabilities"].([]any); !ok || len(capabilities) != 1 || capabilities[0] != "channels" {
		t.Fatal("registered ack did not advertise channels", ack)
	}
	other, otherAck := dialRegisteredApp(t, otherGrant, devChannelRegistry("app-other", devChannelRef{ID: "probe", Version: 1}))
	otherSession := otherAck["sessionId"].(string)
	plain, plainAck := dialRegisteredApp(t, otherGrant, devChannelRegistry("app-plain", devChannelRef{ID: "plain", Version: 1}))
	plainSession := plainAck["sessionId"].(string)
	dialRegisteredApp(t, spareGrant, devChannelRegistry("app-free"))

	first := backendDial(t, server, backendHello(backend, "probe"), "")
	if ready := appSocketRead(t, first); ready["type"] != "ready" || len(ready["sessions"].([]any)) != 1 {
		t.Fatal("backend ready did not list its target session", ready)
	}
	second := backendDial(t, server, backendHello(otherBackend, "probe"), "")
	_ = appSocketRead(t, second)
	panel := panelDial(t, server, panelHello(server, server.record.DevtoolsToken))
	ready := appSocketRead(t, panel)
	panelID := ready["panel"].(string)
	if len(ready["sessions"].([]any)) != 4 || len(ready["backends"].([]any)) != 2 {
		t.Fatal("devtools ready did not report every session and backend", ready)
	}
	// App → backend routes only to its own target's backend. The other
	// target's backend must not see it; ordering proves non-delivery when a
	// later panel frame arrives first.
	sendSocketFrame(t, app, map[string]any{"type": "channel", "channel": "probe", "to": "backend", "data": map[string]any{"n": 1}})
	frame := appSocketRead(t, first)
	if frame["from"] != "app" || frame["session"] != session || frame["channel"] != "probe" || frame["data"].(map[string]any)["n"].(float64) != 1 {
		t.Fatal("backend saw a malformed app frame", frame)
	}
	sendSocketFrame(t, panel, map[string]any{"type": "channel", "channel": "probe", "to": "backend", "targetId": "second", "data": "next"})
	expectNextSocketFrame(t, second, "panel", "next")

	// App → panels stamps the session.
	sendSocketFrame(t, app, map[string]any{"type": "channel", "channel": "probe", "to": "panels", "data": "a"})
	if frame = appSocketRead(t, panel); frame["from"] != "app" || frame["session"] != session || frame["data"] != "a" {
		t.Fatal("panel saw a malformed app frame", frame)
	}

	// Backend → one app session on its target.
	sendSocketFrame(t, first, map[string]any{"type": "channel", "to": "app", "session": session, "data": "b"})
	if frame = appSocketRead(t, app); frame["from"] != "backend" || frame["channel"] != "probe" || frame["data"] != "b" || frame["session"] != nil {
		t.Fatal("app saw a malformed backend frame", frame)
	}
	// A backend cannot address another target's session.
	sendSocketFrame(t, second, map[string]any{"type": "channel", "to": "app", "session": session, "data": "c"})
	if frame = appSocketRead(t, second); frame["type"] != "channel-error" || frame["code"] != "no_session" {
		t.Fatal("cross-target session delivery was not refused", frame)
	}

	// Backend → '*' only reaches own-target sessions declaring the channel.
	sendSocketFrame(t, second, map[string]any{"type": "channel", "to": "app", "session": "*", "data": "d"})
	expectNextSocketFrame(t, other, "backend", "d")
	sendSocketFrame(t, first, map[string]any{"type": "channel", "to": "app", "session": session, "data": "flush-web"})
	expectNextSocketFrame(t, app, "backend", "flush-web")
	sendSocketFrame(t, panel, map[string]any{"type": "channel", "channel": "plain", "to": "app", "session": plainSession, "data": "flush-plain"})
	expectNextSocketFrame(t, plain, "panel", "flush-plain")

	// Backend → all panels, then one panel.
	sendSocketFrame(t, first, map[string]any{"type": "channel", "to": "panels", "data": "e"})
	if frame = appSocketRead(t, panel); frame["from"] != "backend" || frame["targetId"] != "web" || frame["data"] != "e" {
		t.Fatal("panel saw a malformed backend frame", frame)
	}
	sendSocketFrame(t, first, map[string]any{"type": "channel", "to": "panels", "panel": panelID, "data": "f"})
	if frame = appSocketRead(t, panel); frame["data"] != "f" {
		t.Fatal("addressed panel frame did not arrive", frame)
	}
	sendSocketFrame(t, first, map[string]any{"type": "channel", "to": "panels", "panel": "panel_absent", "data": "g"})
	if frame = appSocketRead(t, first); frame["type"] != "channel-error" || frame["code"] != "invalid_target" {
		t.Fatal("missing panel was not an invalid_target error", frame)
	}

	// Panel → one app session, then every declaring session.
	sendSocketFrame(t, panel, map[string]any{"type": "channel", "channel": "probe", "to": "app", "session": otherSession, "data": "h"})
	if frame = appSocketRead(t, other); frame["from"] != "panel" || frame["panel"] != panelID || frame["data"] != "h" {
		t.Fatal("app saw a malformed panel frame", frame)
	}
	sendSocketFrame(t, panel, map[string]any{"type": "channel", "channel": "probe", "to": "app", "session": "*", "data": "i"})
	expectNextSocketFrame(t, app, "panel", "i")
	expectNextSocketFrame(t, other, "panel", "i")
	sendSocketFrame(t, panel, map[string]any{"type": "channel", "channel": "plain", "to": "app", "session": plainSession, "data": "flush-plain-2"})
	expectNextSocketFrame(t, plain, "panel", "flush-plain-2")

	// Panel → backend by target id.
	sendSocketFrame(t, panel, map[string]any{"type": "channel", "channel": "probe", "to": "backend", "targetId": "second", "data": "j"})
	if frame = appSocketRead(t, second); frame["from"] != "panel" || frame["panel"] != panelID || frame["data"] != "j" {
		t.Fatal("backend saw a malformed panel frame", frame)
	}
	sendSocketFrame(t, panel, map[string]any{"type": "channel", "channel": "probe", "to": "backend", "targetId": "absent", "data": "k"})
	if frame = appSocketRead(t, panel); frame["type"] != "channel-error" || frame["code"] != "invalid_target" {
		t.Fatal("unknown target was not an invalid_target error", frame)
	}
	sendSocketFrame(t, panel, map[string]any{"type": "channel", "channel": "probe", "to": "backend", "targetId": "spare", "data": "l"})
	if frame = appSocketRead(t, panel); frame["type"] != "channel-error" || frame["code"] != "no_backend" {
		t.Fatal("backend-less target was not a no_backend error", frame)
	}
}

func TestDevServerChannelErrors(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	backend := server.backendGrant(devTarget{ID: "web", Kind: "web"})
	app, _ := dialRegisteredApp(t, grant, devChannelRegistry("app-web", devChannelRef{ID: "probe", Version: 1}, devChannelRef{ID: "alone", Version: 1}))
	conn := backendDial(t, server, backendHello(backend, "probe"), "")
	_ = appSocketRead(t, conn)

	sendSocketFrame(t, app, map[string]any{"type": "channel", "channel": "undeclared", "to": "panels", "data": 1})
	if frame := appSocketRead(t, app); frame["type"] != "channel-error" || frame["code"] != "undeclared_channel" || frame["channel"] != "undeclared" {
		t.Fatal("undeclared channel was not refused", frame)
	}
	sendSocketFrame(t, app, map[string]any{"type": "channel", "channel": "alone", "to": "backend", "data": 1})
	if frame := appSocketRead(t, app); frame["type"] != "channel-error" || frame["code"] != "no_backend" {
		t.Fatal("missing backend was not refused", frame)
	}
	sendSocketFrame(t, app, map[string]any{"type": "channel", "channel": "probe", "to": "panels", "data": strings.Repeat("x", 300*1024)})
	if frame := appSocketRead(t, app); frame["type"] != "channel-error" || frame["code"] != "oversize" {
		t.Fatal("oversize channel data was not refused", frame)
	}
	sendSocketFrame(t, conn, map[string]any{"type": "channel", "to": "app", "session": "sess_absent", "data": 1})
	if frame := appSocketRead(t, conn); frame["type"] != "channel-error" || frame["code"] != "no_session" {
		t.Fatal("missing session was not refused", frame)
	}
	// Errors are not disconnects; the channel still routes afterwards.
	sendSocketFrame(t, app, map[string]any{"type": "channel", "channel": "probe", "to": "backend", "data": "ok"})
	if frame := appSocketRead(t, conn); frame["type"] != "channel" || frame["data"] != "ok" {
		t.Fatal("routing did not continue after channel errors", frame)
	}
	// Malformed channel frames stay policy violations.
	sendSocketFrame(t, app, map[string]any{"type": "channel", "channel": "Bad Channel", "to": "panels", "data": 1})
	if _, _, err := app.Read(context.Background()); err == nil {
		t.Fatal("a malformed channel frame kept the app socket open")
	}
}

func TestDevServerChannelSessionsAndReplacement(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	backend := server.backendGrant(devTarget{ID: "web", Kind: "web"})
	otherBackend := server.backendGrant(devTarget{ID: "second", Kind: "web"})

	panel := panelDial(t, server, panelHello(server, server.record.DevtoolsToken))
	if ready := appSocketRead(t, panel); len(ready["backends"].([]any)) != 0 {
		t.Fatal("ready listed backends before any connected", ready)
	}
	first := backendDial(t, server, backendHello(backend, "probe"), "")
	if frame := appSocketRead(t, first); frame["type"] != "ready" {
		t.Fatal(frame)
	}
	if frame := appSocketRead(t, panel); frame["type"] != "backends" || len(frame["backends"].([]any)) != 1 {
		t.Fatal("backend connect did not emit backends", frame)
	}
	other := backendDial(t, server, backendHello(otherBackend, "probe"), "")
	_ = appSocketRead(t, other)

	// A same-key reconnect replaces the old socket with a policy close.
	replacement := backendDial(t, server, backendHello(backend, "probe"), "")
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_, _, err := first.Read(ctx)
	if websocket.CloseStatus(err) != websocket.StatusPolicyViolation {
		t.Fatal("replaced backend was not closed with a policy status", err)
	}
	if frame := appSocketRead(t, replacement); frame["type"] != "ready" {
		t.Fatal(frame)
	}
	seenBackends := 0
	for seenBackends < 2 {
		if frame := appSocketRead(t, panel); frame["type"] == "backends" {
			seenBackends++
		}
	}
	_ = panel

	// App connect emits sessions to its target's backend and every panel, but
	// not to another target's backend — ordering proves it sees nothing first.
	app, _ := dialRegisteredApp(t, grant, devChannelRegistry("app-web", devChannelRef{ID: "probe", Version: 1}))
	if frame := appSocketRead(t, replacement); frame["type"] != "sessions" || len(frame["sessions"].([]any)) != 1 {
		t.Fatal("app connect did not emit sessions to its backend", frame)
	}
	sendSocketFrame(t, panel, map[string]any{"type": "channel", "channel": "probe", "to": "backend", "targetId": "second", "data": "untouched"})
	expectNextSocketFrame(t, other, "panel", "untouched")
	// The replaced socket's exit emits one more backends event; read past it.
	for frame := appSocketRead(t, panel); frame["type"] != "sessions"; frame = appSocketRead(t, panel) {
		if frame["type"] != "backends" {
			t.Fatalf("unexpected frame waiting for sessions: %v", frame)
		}
	}

	// A registry channel change re-emits snapshots carrying the channels.
	updated := devChannelRegistry("app-web", devChannelRef{ID: "probe", Version: 1}, devChannelRef{ID: "extra", Version: 2})
	updated.Revision = 2
	sendSocketFrame(t, app, devAppMessage{Type: "registry", Registry: updated})
	frame := appSocketRead(t, replacement)
	snapshot := frame["sessions"].([]any)[0].(map[string]any)
	if frame["type"] != "sessions" || len(snapshot["channels"].([]any)) != 2 {
		t.Fatal("channel change did not re-emit sessions", frame)
	}
	if frame = appSocketRead(t, panel); frame["type"] != "sessions" {
		t.Fatal("channel change did not reach the panel", frame)
	}

	// Disconnect re-emits with a disconnected state.
	_ = app.Close(websocket.StatusNormalClosure, "app done")
	deadline := time.Now().Add(2 * time.Second)
	for {
		frame = appSocketRead(t, replacement)
		entry := frame["sessions"].([]any)[0].(map[string]any)
		if frame["type"] == "sessions" && entry["state"] == "disconnected" {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("disconnect did not emit sessions", frame)
		}
	}
}

func TestDevServerChannelSlowConsumer(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	app, _ := dialRegisteredApp(t, grant, devChannelRegistry("app-web", devChannelRef{ID: "probe", Version: 1}))
	slow := panelDial(t, server, panelHello(server, server.record.DevtoolsToken))
	slowReady := appSocketRead(t, slow)
	fast := panelDial(t, server, panelHello(server, server.record.DevtoolsToken))
	_ = appSocketRead(t, fast)

	received := make(chan int, 1)
	go func() {
		count := 0
		deadline := time.Now().Add(15 * time.Second)
		for time.Now().Before(deadline) {
			ctx, cancel := context.WithTimeout(context.Background(), time.Until(deadline))
			_, data, err := fast.Read(ctx)
			cancel()
			if err != nil {
				break
			}
			var frame map[string]any
			if json.Unmarshal(data, &frame) == nil && frame["type"] == "channel" {
				count++
				if frame["data"] == "still-live" {
					break
				}
			}
		}
		received <- count
	}()

	// Stall the slow panel's writer outright: its socket stays open while
	// routed frames only accumulate in the bounded queue. When the queue fills,
	// the next delivery drops into the queue-full branch and the hub closes
	// just that receiver with 1013.
	slowID := slowReady["panel"].(string)
	server.apps.mu.Lock()
	peer := server.apps.panels[slowID]
	server.apps.mu.Unlock()
	if peer == nil {
		t.Fatal("slow panel was not registered")
	}
	peer.writer.close()
	const frames = devSocketQueueDepth + 100
	for index := 0; index < frames; index++ {
		sendSocketFrame(t, app, map[string]any{"type": "channel", "channel": "probe", "to": "panels", "data": index})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	for {
		_, _, err := slow.Read(ctx)
		if err != nil {
			if websocket.CloseStatus(err) != websocket.StatusTryAgainLater {
				t.Fatalf("slow consumer was not closed with 1013: %v", err)
			}
			break
		}
	}
	deadline := time.Now().Add(2 * time.Second)
	for {
		server.apps.mu.Lock()
		panels := len(server.apps.panels)
		server.apps.mu.Unlock()
		if panels == 1 {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("closed slow consumer stayed registered", panels)
		}
		time.Sleep(5 * time.Millisecond)
	}
	sendSocketFrame(t, app, map[string]any{"type": "channel", "channel": "probe", "to": "panels", "data": "still-live"})
	if count := <-received; count != frames+1 {
		t.Fatalf("live panel received %d of %d channel frames", count, frames+1)
	}
}

// ready must stay the first frame a new backend or panel sees: it is enqueued
// while the hub lock still serializes peer insertion, so traffic already in
// flight can never overtake it.
func TestDevServerChannelReadyFirst(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	backend := server.backendGrant(devTarget{ID: "web", Kind: "web"})
	app, _ := dialRegisteredApp(t, grant, devChannelRegistry("app-web", devChannelRef{ID: "probe", Version: 1}))

	// Drain the app socket so hub-sent errors never backpressure the flood.
	go func() {
		for {
			if _, _, err := app.Read(context.Background()); err != nil {
				return
			}
		}
	}()
	stop := make(chan struct{})
	defer close(stop)
	go func() {
		for index := 0; ; index++ {
			select {
			case <-stop:
				return
			default:
			}
			for _, to := range []string{"panels", "backend"} {
				frame, _ := json.Marshal(map[string]any{"type": "channel", "channel": "probe", "to": to, "data": index})
				if err := app.Write(context.Background(), websocket.MessageText, frame); err != nil {
					return
				}
			}
		}
	}()

	for round := 0; round < 50; round++ {
		panel := panelDial(t, server, panelHello(server, server.record.DevtoolsToken))
		if frame := appSocketRead(t, panel); frame["type"] != "ready" {
			t.Fatalf("panel %d saw %v before ready", round, frame)
		}
		_ = panel.Close(websocket.StatusNormalClosure, "")
		// Panels hold unique ids; wait for the closed one to leave the map
		// before dialing again so the panel cap stays unhit.
		deadline := time.Now().Add(2 * time.Second)
		for {
			server.apps.mu.Lock()
			remaining := len(server.apps.panels)
			server.apps.mu.Unlock()
			if remaining == 0 {
				break
			}
			if time.Now().After(deadline) {
				t.Fatalf("closed panel %d stayed registered", round)
			}
			time.Sleep(5 * time.Millisecond)
		}
	}
	for round := 0; round < 50; round++ {
		conn := backendDial(t, server, backendHello(backend, "probe"), "")
		if frame := appSocketRead(t, conn); frame["type"] != "ready" {
			t.Fatalf("backend %d saw %v before ready", round, frame)
		}
		_ = conn.Close(websocket.StatusNormalClosure, "")
	}
}

func TestDevServerChannelShutdown(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	backend := server.backendGrant(devTarget{ID: "web", Kind: "web"})
	app, _ := dialRegisteredApp(t, grant, devChannelRegistry("app-web", devChannelRef{ID: "probe", Version: 1}))
	back := backendDial(t, server, backendHello(backend, "probe"), "")
	_ = appSocketRead(t, back)
	panel := panelDial(t, server, panelHello(server, server.record.DevtoolsToken))
	_ = appSocketRead(t, panel)

	if err := server.close(); err != nil {
		t.Fatal("shutdown did not join all handlers", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	for name, conn := range map[string]*websocket.Conn{"app": app, "backend": back, "panel": panel} {
		if _, _, err := conn.Read(ctx); err == nil {
			t.Fatalf("%s socket survived server shutdown", name)
		}
	}
}

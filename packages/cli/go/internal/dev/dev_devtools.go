package dev

// Devtools channels: one Go-owned routing plane between app sessions (/app),
// per-target Node backends (/backend) and devtools panels (/devtools). The hub
// routes opaque, bounded, per-channel JSON and never interprets payloads. Each
// peer class authenticates with a distinct first-frame credential — the
// embeddable app grant, the per-target backend token (XPLAT_DEV_BACKEND) and
// the discovery-record devtools token — and none authorizes another endpoint.

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/coder/websocket"
)

const (
	devChannelDataLimit  = 256 << 10
	devSocketQueueDepth  = 256
	devMaxChannelsPerApp = 32
	devMaxPendingSockets = 64
	devMaxPanels         = 16
	devMaxBackendKeys    = 64
)

var devChannelID = regexp.MustCompile(`^[a-z][a-z0-9-]{0,31}$`)

type devChannelRef struct {
	ID      string `json:"id"`
	Version int64  `json:"version"`
}

func validDevChannels(channels []devChannelRef) bool {
	if len(channels) > devMaxChannelsPerApp {
		return false
	}
	ids := map[string]bool{}
	for _, channel := range channels {
		if !devChannelID.MatchString(channel.ID) || channel.Version < 1 || channel.Version > 1<<31-1 || ids[channel.ID] {
			return false
		}
		ids[channel.ID] = true
	}
	return true
}

func devChannelsChanged(previous, next []devChannelRef) bool {
	if len(previous) != len(next) {
		return true
	}
	before := map[string]int64{}
	for _, channel := range previous {
		before[channel.ID] = channel.Version
	}
	for _, channel := range next {
		if version, ok := before[channel.ID]; !ok || version != channel.Version {
			return true
		}
	}
	return false
}

func devPeerDeclaresChannel(peer *devAppPeer, channel string) bool {
	for _, declared := range peer.registry.Channels {
		if declared.ID == channel {
			return true
		}
	}
	return false
}

func devPeerLive(peer *devAppPeer) bool {
	return peer.ready && peer.disconnectedAt == ""
}

type devSocketWrite struct {
	data []byte
	ack  chan error
}

// One writer goroutine per socket keeps every outbound frame ordered and
// non-interleaved. The queue is bounded so a slow receiver loses its own
// socket instead of stalling the hub.
type devSocketWriter struct {
	ctx      context.Context
	conn     *websocket.Conn
	queue    chan devSocketWrite
	done     chan struct{}
	stop     chan struct{}
	once     sync.Once
	slowOnce sync.Once
	failed   atomic.Bool
}

func newDevSocketWriter(ctx context.Context, conn *websocket.Conn) *devSocketWriter {
	writer := &devSocketWriter{ctx: ctx, conn: conn, queue: make(chan devSocketWrite, devSocketQueueDepth), done: make(chan struct{}), stop: make(chan struct{})}
	go writer.run()
	return writer
}

func (writer *devSocketWriter) run() {
	defer close(writer.done)
	for {
		select {
		case frame := <-writer.queue:
			ctx, cancel := context.WithTimeout(writer.ctx, 3*time.Second)
			err := writer.conn.Write(ctx, websocket.MessageText, frame.data)
			cancel()
			if frame.ack != nil {
				frame.ack <- err
			}
			if err != nil {
				writer.conn.CloseNow()
				return
			}
		case <-writer.stop:
			return
		case <-writer.ctx.Done():
			return
		}
	}
}

func (writer *devSocketWriter) close() {
	writer.once.Do(func() { close(writer.stop) })
}

// Queue overflow marks the writer failed once: the close happens a single
// time and every later send drops instead of spawning close storms.
func (writer *devSocketWriter) closeSlow() {
	writer.slowOnce.Do(func() {
		writer.failed.Store(true)
		go func() { _ = writer.conn.Close(websocket.StatusTryAgainLater, "slow consumer") }()
	})
}

// send never blocks, so callers may hold the hub mutex; a full queue closes
// only the slow receiver.
func (writer *devSocketWriter) send(data []byte) {
	if writer.failed.Load() {
		return
	}
	select {
	case writer.queue <- devSocketWrite{data: data}:
	default:
		writer.closeSlow()
	}
}

func (writer *devSocketWriter) sendSync(ctx context.Context, data []byte) error {
	if writer.failed.Load() {
		return errors.New("app socket writer stopped")
	}
	ack := make(chan error, 1)
	select {
	case writer.queue <- devSocketWrite{data: data, ack: ack}:
	default:
		writer.closeSlow()
		return errors.New("app socket queue is full")
	}
	select {
	case err := <-ack:
		return err
	case <-writer.done:
		return errors.New("app socket writer stopped")
	case <-ctx.Done():
		return ctx.Err()
	}
}

func devChannelFrame(fields map[string]any) []byte {
	data, _ := json.Marshal(fields)
	return data
}

func devChannelError(code, channel, detail string) []byte {
	frame := map[string]any{"type": "channel-error", "code": code, "detail": detail}
	if channel != "" {
		frame["channel"] = channel
	}
	return devChannelFrame(frame)
}

func devSessionsSnapshot(hub *devAppHub, target string) []any {
	result := []any{}
	for _, peer := range hub.peers {
		if target == "" || peer.target == target {
			entry := devPeerSnapshot(peer)
			// Devtools consumers get the declared action surface with each
			// session so panels can list invocable actions without RPC.
			entry["actions"] = peer.registry.Actions
			result = append(result, entry)
		}
	}
	sortDevSessions(result)
	return result
}

func (hub *devAppHub) backendRefsLocked() []any {
	refs := []any{}
	for _, backend := range hub.backends {
		refs = append(refs, map[string]any{"channel": backend.key.channel, "targetId": backend.key.target})
	}
	sort.Slice(refs, func(i, j int) bool {
		first, second := refs[i].(map[string]any), refs[j].(map[string]any)
		if first["channel"].(string) != second["channel"].(string) {
			return first["channel"].(string) < second["channel"].(string)
		}
		return first["targetId"].(string) < second["targetId"].(string)
	})
	return refs
}

// Callers hold hub.mu; target scopes the update to that target's backend while
// panels always observe the full session set. Snapshotting and enqueuing stay
// under the lock because a bounded send queue cannot block.
func (hub *devAppHub) emitSessionsLocked(target string) {
	for _, backend := range hub.backends {
		if backend.key.target == target {
			backend.writer.send(devChannelFrame(map[string]any{"type": "sessions", "sessions": devSessionsSnapshot(hub, target)}))
		}
	}
	if len(hub.panels) > 0 {
		data := devChannelFrame(map[string]any{"type": "sessions", "sessions": devSessionsSnapshot(hub, "")})
		for _, panel := range hub.panels {
			panel.writer.send(data)
		}
	}
}

func (hub *devAppHub) emitBackendsLocked() {
	if len(hub.panels) == 0 {
		return
	}
	data := devChannelFrame(map[string]any{"type": "backends", "backends": hub.backendRefsLocked()})
	for _, panel := range hub.panels {
		panel.writer.send(data)
	}
}

func normalizedChannelData(data json.RawMessage) json.RawMessage {
	if len(data) == 0 {
		return json.RawMessage("null")
	}
	return data
}

// deliverFromApp routes an app channel frame. It returns a channel-error frame
// for the sender, or nil when routed; routing failures are not disconnects.
func (hub *devAppHub) deliverFromApp(peer *devAppPeer, channel, to string, data json.RawMessage) []byte {
	if len(data) > devChannelDataLimit {
		return devChannelError("oversize", channel, "Channel data exceeds its 256 KiB encoded bound.")
	}
	hub.mu.Lock()
	defer hub.mu.Unlock()
	if !devPeerDeclaresChannel(peer, channel) {
		return devChannelError("undeclared_channel", channel, "The app registry does not declare this channel.")
	}
	payload := normalizedChannelData(data)
	switch to {
	case "backend":
		backend := hub.backends[devBackendKey{channel: channel, target: peer.target}]
		if backend == nil {
			return devChannelError("no_backend", channel, "No backend is connected for this target on this channel.")
		}
		backend.writer.send(devChannelFrame(map[string]any{"type": "channel", "channel": channel, "from": "app", "session": peer.session, "data": payload}))
	case "panels":
		if len(hub.panels) == 0 {
			return nil
		}
		frame := devChannelFrame(map[string]any{"type": "channel", "channel": channel, "from": "app", "session": peer.session, "data": payload})
		for _, panel := range hub.panels {
			panel.writer.send(frame)
		}
	}
	return nil
}

// deliverToAppSession sends to one live session that declared the channel;
// absent or undeclared sessions are indistinguishable no_session failures.
func (hub *devAppHub) deliverToAppSession(channel, session, target string, frame []byte) []byte {
	for _, peer := range hub.peers {
		if peer.session != session || (target != "" && peer.target != target) {
			continue
		}
		if devPeerLive(peer) && devPeerDeclaresChannel(peer, channel) {
			peer.writer.send(frame)
			return nil
		}
	}
	return devChannelError("no_session", channel, "No live session declares this channel.")
}

func (hub *devAppHub) broadcastToAppSessions(channel, target string, frame []byte) {
	for _, peer := range hub.peers {
		if (target == "" || peer.target == target) && devPeerLive(peer) && devPeerDeclaresChannel(peer, channel) {
			peer.writer.send(frame)
		}
	}
}

// deliverFromBackend routes a backend channel frame. Backends are keyed by
// (channel, target): they only ever reach their own target's sessions.
func (hub *devAppHub) deliverFromBackend(backend *devBackendPeer, to string, session, panel *string, data json.RawMessage) []byte {
	channel := backend.key.channel
	if len(data) > devChannelDataLimit {
		return devChannelError("oversize", channel, "Channel data exceeds its 256 KiB encoded bound.")
	}
	hub.mu.Lock()
	defer hub.mu.Unlock()
	payload := normalizedChannelData(data)
	switch to {
	case "app":
		frame := devChannelFrame(map[string]any{"type": "channel", "channel": channel, "from": "backend", "data": payload})
		if *session == "*" {
			hub.broadcastToAppSessions(channel, backend.key.target, frame)
			return nil
		}
		return hub.deliverToAppSession(channel, *session, backend.key.target, frame)
	case "panels":
		frame := devChannelFrame(map[string]any{"type": "channel", "channel": channel, "from": "backend", "targetId": backend.key.target, "data": payload})
		if panel == nil {
			for _, receiver := range hub.panels {
				receiver.writer.send(frame)
			}
			return nil
		}
		if receiver := hub.panels[*panel]; receiver != nil {
			receiver.writer.send(frame)
			return nil
		}
		return devChannelError("invalid_target", channel, "No devtools panel has this id.")
	}
	return nil
}

// deliverFromPanel routes a devtools panel channel frame across every target.
func (hub *devAppHub) deliverFromPanel(panel *devPanelPeer, channel, to string, session, target *string, data json.RawMessage) []byte {
	if len(data) > devChannelDataLimit {
		return devChannelError("oversize", channel, "Channel data exceeds its 256 KiB encoded bound.")
	}
	hub.mu.Lock()
	defer hub.mu.Unlock()
	payload := normalizedChannelData(data)
	switch to {
	case "app":
		frame := devChannelFrame(map[string]any{"type": "channel", "channel": channel, "from": "panel", "panel": panel.id, "data": payload})
		if *session == "*" {
			hub.broadcastToAppSessions(channel, "", frame)
			return nil
		}
		return hub.deliverToAppSession(channel, *session, "", frame)
	case "backend":
		if hub.grants[*target] == nil {
			return devChannelError("invalid_target", channel, "No dev target has this id.")
		}
		backend := hub.backends[devBackendKey{channel: channel, target: *target}]
		if backend == nil {
			return devChannelError("no_backend", channel, "No backend is connected for this target on this channel.")
		}
		backend.writer.send(devChannelFrame(map[string]any{"type": "channel", "channel": channel, "from": "panel", "panel": panel.id, "data": payload}))
	}
	return nil
}

type devBackendHello struct {
	Protocol   string `json:"protocol"`
	Version    int    `json:"version"`
	InstanceID string `json:"instanceId"`
	TargetID   string `json:"targetId"`
	Token      string `json:"token"`
	Channel    string `json:"channel"`
}

type devPanelHello struct {
	Protocol   string `json:"protocol"`
	Version    int    `json:"version"`
	InstanceID string `json:"instanceId"`
	Token      string `json:"token"`
}

// The backend grant is per-target Node-engine proof: it reaches the engine
// through XPLAT_DEV_BACKEND and must never enter served app code.
type devBackendGrant struct {
	Protocol   string `json:"protocol"`
	Version    int    `json:"version"`
	Socket     string `json:"socket"`
	InstanceID string `json:"instanceId"`
	TargetID   string `json:"targetId"`
	Token      string `json:"token"`
}

func (server *devServer) backendGrant(target devTarget) devBackendGrant {
	grant := server.appGrant(target)
	endpoint := "ws" + strings.TrimPrefix(server.record.Endpoint, "http")
	endpoint = strings.TrimSuffix(endpoint, "/rpc") + "/backend"
	return devBackendGrant{Protocol: "octane-devtools-backend", Version: 1, Socket: endpoint, InstanceID: server.record.InstanceID, TargetID: target.ID, Token: grant.backendToken}
}

// Backend credentials arrive in the bounded first frame, never in URLs.
// Backends are engine-side processes; any Origin header is a browser and is
// rejected outright.
func (server *devServer) backendSocket(w http.ResponseWriter, r *http.Request) {
	hub := server.apps
	if r.Method != "GET" || r.URL.Path != "/backend" || r.URL.RawPath != "" || r.URL.RawQuery != "" || r.URL.ForceQuery || len(r.Header.Values("Origin")) != 0 {
		http.Error(w, "invalid backend connection", http.StatusForbidden)
		return
	}
	server.mu.Lock()
	if server.closing {
		server.mu.Unlock()
		http.Error(w, "dev server stopping", http.StatusServiceUnavailable)
		return
	}
	server.handlers.Add(1)
	server.mu.Unlock()
	defer server.handlers.Done()
	hub.mu.Lock()
	if hub.pendingSockets >= devMaxPendingSockets {
		hub.mu.Unlock()
		http.Error(w, "backend connection rejected", http.StatusForbidden)
		return
	}
	hub.pendingSockets++
	hub.mu.Unlock()
	pending := true
	defer func() {
		if pending {
			hub.mu.Lock()
			hub.pendingSockets--
			hub.mu.Unlock()
		}
	}()
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		return
	}
	defer conn.CloseNow()
	conn.SetReadLimit(devAppFrameLimit)
	writer := newDevSocketWriter(server.ctx, conn)
	defer writer.close()
	stopped := make(chan struct{})
	defer close(stopped)
	go func() {
		select {
		case <-server.ctx.Done():
			_ = conn.CloseNow()
		case <-stopped:
		}
	}()
	helloCtx, cancel := context.WithTimeout(server.ctx, 3*time.Second)
	kind, data, err := conn.Read(helloCtx)
	cancel()
	var hello devBackendHello
	if err != nil || kind != websocket.MessageText || json.Unmarshal(data, &hello) != nil {
		_ = conn.Close(websocket.StatusPolicyViolation, "invalid backend registration")
		return
	}
	hub.mu.Lock()
	grant := hub.grants[hello.TargetID]
	valid := hello.Protocol == "octane-devtools-backend" && hello.Version == 1 && hello.InstanceID == server.record.InstanceID && grant != nil && devChannelID.MatchString(hello.Channel) && subtle.ConstantTimeCompare([]byte(hello.Token), []byte(grant.backendToken)) == 1
	if !valid {
		hub.mu.Unlock()
		_ = conn.Close(websocket.StatusPolicyViolation, "invalid backend registration")
		return
	}
	key := devBackendKey{channel: hello.Channel, target: hello.TargetID}
	previous := hub.backends[key]
	if previous == nil && len(hub.backends) >= devMaxBackendKeys {
		hub.mu.Unlock()
		_ = conn.Close(websocket.StatusTryAgainLater, "backend connection limit")
		return
	}
	peer := &devBackendPeer{id: osfs.Identity(), conn: conn, writer: writer, key: key}
	hub.backends[key] = peer
	hub.pendingSockets--
	pending = false
	sessions := devSessionsSnapshot(hub, key.target)
	hub.emitBackendsLocked()
	// ready is enqueued under the lock so it stays the first frame the new
	// backend sees even while other traffic is being routed.
	writer.send(devChannelFrame(map[string]any{"type": "ready", "sessions": sessions}))
	hub.mu.Unlock()
	if previous != nil {
		// Engine restarts reconnect the same key; the replaced socket learns why.
		_ = previous.conn.Close(websocket.StatusPolicyViolation, "replaced")
	}
	defer func() {
		hub.mu.Lock()
		if hub.backends[key] == peer {
			delete(hub.backends, key)
		}
		hub.emitBackendsLocked()
		hub.mu.Unlock()
	}()
	for {
		kind, data, err = conn.Read(server.ctx)
		if err != nil {
			return
		}
		var frame devBackendFrame
		if kind != websocket.MessageText || json.Unmarshal(data, &frame) != nil || !validBackendFrame(&frame) {
			_ = conn.Close(websocket.StatusPolicyViolation, "invalid backend frame")
			return
		}
		if failure := hub.deliverFromBackend(peer, frame.To, frame.Session, frame.Panel, frame.Data); failure != nil {
			peer.writer.send(failure)
		}
	}
}

type devBackendFrame struct {
	Type    string          `json:"type"`
	To      string          `json:"to"`
	Session *string         `json:"session"`
	Panel   *string         `json:"panel"`
	Data    json.RawMessage `json:"data"`
}

func validBackendFrame(frame *devBackendFrame) bool {
	if frame.Type != "channel" {
		return false
	}
	switch frame.To {
	case "app":
		return frame.Session != nil && *frame.Session != "" && frame.Panel == nil
	case "panels":
		return frame.Session == nil && (frame.Panel == nil || *frame.Panel != "")
	}
	return false
}

// Devtools panels authenticate with the per-server discovery-record token.
// The panel app may itself be a local web build, so a single loopback Origin
// is accepted alongside native (headerless) clients.
func devLoopbackOrigin(raw string) bool {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Scheme != "http" || parsed.User != nil || parsed.Opaque != "" || parsed.RawQuery != "" || parsed.ForceQuery || parsed.Fragment != "" || (parsed.Path != "" && parsed.Path != "/") {
		return false
	}
	host := parsed.Hostname()
	if host != "127.0.0.1" && host != "localhost" {
		return false
	}
	port, err := strconv.Atoi(parsed.Port())
	return err == nil && port >= 1 && port <= 65535
}

func (server *devServer) devtoolsSocket(w http.ResponseWriter, r *http.Request) {
	hub := server.apps
	origins := r.Header.Values("Origin")
	if r.Method != "GET" || r.URL.Path != "/devtools" || r.URL.RawPath != "" || r.URL.RawQuery != "" || r.URL.ForceQuery || len(origins) > 1 || (len(origins) == 1 && !devLoopbackOrigin(origins[0])) {
		http.Error(w, "invalid devtools connection", http.StatusForbidden)
		return
	}
	server.mu.Lock()
	if server.closing {
		server.mu.Unlock()
		http.Error(w, "dev server stopping", http.StatusServiceUnavailable)
		return
	}
	server.handlers.Add(1)
	server.mu.Unlock()
	defer server.handlers.Done()
	hub.mu.Lock()
	if hub.pendingSockets >= devMaxPendingSockets {
		hub.mu.Unlock()
		http.Error(w, "devtools connection rejected", http.StatusForbidden)
		return
	}
	hub.pendingSockets++
	hub.mu.Unlock()
	pending := true
	defer func() {
		if pending {
			hub.mu.Lock()
			hub.pendingSockets--
			hub.mu.Unlock()
		}
	}()
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		return
	}
	defer conn.CloseNow()
	conn.SetReadLimit(devAppFrameLimit)
	writer := newDevSocketWriter(server.ctx, conn)
	defer writer.close()
	stopped := make(chan struct{})
	defer close(stopped)
	go func() {
		select {
		case <-server.ctx.Done():
			_ = conn.CloseNow()
		case <-stopped:
		}
	}()
	helloCtx, cancel := context.WithTimeout(server.ctx, 3*time.Second)
	kind, data, err := conn.Read(helloCtx)
	cancel()
	var hello devPanelHello
	if err != nil || kind != websocket.MessageText || json.Unmarshal(data, &hello) != nil || hello.Protocol != "octane-devtools" || hello.Version != 1 || hello.InstanceID != server.record.InstanceID || subtle.ConstantTimeCompare([]byte(hello.Token), []byte(server.record.DevtoolsToken)) != 1 {
		_ = conn.Close(websocket.StatusPolicyViolation, "invalid devtools registration")
		return
	}
	hub.mu.Lock()
	if len(hub.panels) >= devMaxPanels {
		hub.mu.Unlock()
		_ = conn.Close(websocket.StatusTryAgainLater, "devtools panel limit")
		return
	}
	hub.panelSeq++
	id := fmt.Sprintf("panel_%d", hub.panelSeq)
	peer := &devPanelPeer{id: id, conn: conn, writer: writer}
	hub.panels[id] = peer
	hub.pendingSockets--
	pending = false
	sessions := devSessionsSnapshot(hub, "")
	backends := hub.backendRefsLocked()
	// ready is enqueued under the lock so it stays the first frame the new
	// panel sees even while other traffic is being routed.
	writer.send(devChannelFrame(map[string]any{"type": "ready", "panel": id, "sessions": sessions, "backends": backends}))
	hub.mu.Unlock()
	defer func() {
		hub.mu.Lock()
		if hub.panels[id] == peer {
			delete(hub.panels, id)
		}
		hub.mu.Unlock()
	}()
	for {
		kind, data, err = conn.Read(server.ctx)
		if err != nil {
			return
		}
		var frame devPanelFrame
		if kind != websocket.MessageText || json.Unmarshal(data, &frame) != nil || !validPanelFrame(&frame) {
			_ = conn.Close(websocket.StatusPolicyViolation, "invalid devtools frame")
			return
		}
		if failure := hub.deliverFromPanel(peer, frame.Channel, frame.To, frame.Session, frame.TargetID, frame.Data); failure != nil {
			peer.writer.send(failure)
		}
	}
}

type devPanelFrame struct {
	Type     string          `json:"type"`
	Channel  string          `json:"channel"`
	To       string          `json:"to"`
	Session  *string         `json:"session"`
	TargetID *string         `json:"targetId"`
	Data     json.RawMessage `json:"data"`
}

func validPanelFrame(frame *devPanelFrame) bool {
	if frame.Type != "channel" || !devChannelID.MatchString(frame.Channel) {
		return false
	}
	switch frame.To {
	case "app":
		return frame.Session != nil && *frame.Session != "" && frame.TargetID == nil
	case "backend":
		return frame.TargetID != nil && *frame.TargetID != "" && frame.Session == nil
	}
	return false
}

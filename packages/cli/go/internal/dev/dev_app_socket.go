package dev

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/coder/websocket"
)

const (
	devAppFrameLimit = 1 << 20
	devAppMaxPending = 32
	devAppMaxPeers   = 64
	devAppMaxActions = 256
)

// coder/websocket closes the whole connection when a write's context ends,
// even just after the peer received the bytes. Bind writes to the server
// lifetime so cancelling one request cannot drop a human-owned app. The
// per-peer writer keeps every outbound frame ordered and non-interleaved.
func writeDevApp(server context.Context, peer *devAppPeer, data []byte) error {
	ctx, cancel := context.WithTimeout(server, 3*time.Second)
	defer cancel()
	return peer.writer.sendSync(ctx, data)
}

// App grants cannot authorize CLI RPC or another target. They may be embedded in
// development code; the private same-user CLI credential must never be embedded.
type devAppGrant struct {
	Protocol   string `json:"protocol"`
	Version    int    `json:"version"`
	Socket     string `json:"socket"`
	InstanceID string `json:"instanceId"`
	TargetID   string `json:"targetId"`
	Token      string `json:"token"`
	platform   string
	origins    map[string]bool
	// Per-target backend credential; minted with the app grant but never
	// marshalled into the app-facing grant JSON.
	backendToken string
}

type devAppRegistry struct {
	Protocol      string                   `json:"protocol"`
	Version       int                      `json:"version"`
	AppInstanceID string                   `json:"appInstanceId"`
	AppLabel      string                   `json:"appLabel,omitempty"`
	Platform      string                   `json:"platform"`
	Revision      int64                    `json:"revision"`
	AnnouncedAt   string                   `json:"announcedAt"`
	Location      json.RawMessage          `json:"location,omitempty"`
	Inspection    *devInspectionCapability `json:"inspection,omitempty"`
	Actions       []json.RawMessage        `json:"actions"`
	Channels      []devChannelRef          `json:"channels,omitempty"`
}

type devAppHello struct {
	Protocol   string         `json:"protocol"`
	Version    int            `json:"version"`
	InstanceID string         `json:"instanceId"`
	TargetID   string         `json:"targetId"`
	Token      string         `json:"token"`
	Registry   devAppRegistry `json:"registry"`
}

type devAppMessage struct {
	Type      string          `json:"type"`
	RequestID string          `json:"requestId,omitempty"`
	Result    json.RawMessage `json:"result,omitempty"`
	Registry  devAppRegistry  `json:"registry"`
	Outcome   json.RawMessage `json:"outcome,omitempty"`
	Channel   string          `json:"channel,omitempty"`
	To        string          `json:"to,omitempty"`
	Data      json.RawMessage `json:"data,omitempty"`
}

type devAppPeer struct {
	conn               *websocket.Conn
	writer             *devSocketWriter
	ready              bool
	instance, platform string
	target             string
	session            string
	registry           devAppRegistry
	connectedAt        string
	disconnectedAt     string
}

type devBackendKey struct {
	channel string
	target  string
}

type devBackendPeer struct {
	id     string
	conn   *websocket.Conn
	writer *devSocketWriter
	key    devBackendKey
}

type devPanelPeer struct {
	id     string
	conn   *websocket.Conn
	writer *devSocketWriter
}

type devAppHub struct {
	mu             sync.Mutex
	grants         map[string]*devAppGrant
	peers          map[string]*devAppPeer
	backends       map[devBackendKey]*devBackendPeer
	panels         map[string]*devPanelPeer
	pending        int
	pendingSockets int
	panelSeq       int
}

func newDevAppHub() *devAppHub {
	return &devAppHub{grants: map[string]*devAppGrant{}, peers: map[string]*devAppPeer{}, backends: map[devBackendKey]*devBackendPeer{}, panels: map[string]*devPanelPeer{}}
}

func (server *devServer) appGrant(target devTarget) devAppGrant {
	hub := server.apps
	hub.mu.Lock()
	defer hub.mu.Unlock()
	if existing := hub.grants[target.ID]; existing != nil {
		return *existing
	}
	endpoint := "ws" + strings.TrimPrefix(server.record.Endpoint, "http")
	endpoint = strings.TrimSuffix(endpoint, "/rpc") + "/app?target=" + url.QueryEscape(target.ID) + "&instance=" + server.record.InstanceID
	grant := &devAppGrant{Protocol: "octane-app-debug", Version: 1, Socket: endpoint, InstanceID: server.record.InstanceID, TargetID: target.ID, Token: osfs.Identity() + osfs.Identity(), platform: target.Kind, origins: map[string]bool{}, backendToken: osfs.Identity() + osfs.Identity()}
	hub.grants[target.ID] = grant
	return *grant
}

func (hub *devAppHub) allowOrigin(target, raw string) {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.User != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return
	}
	origin := parsed.Scheme + "://" + parsed.Host
	hub.mu.Lock()
	defer hub.mu.Unlock()
	if grant := hub.grants[target]; grant != nil {
		grant.origins[origin] = true
	}
}

func validDevRegistry(registry devAppRegistry, platform string) bool {
	if registry.Protocol != "xplat-dev-actions" || registry.Version != 1 || registry.Platform != platform || len(registry.AppInstanceID) == 0 || len(registry.AppInstanceID) > 128 || len(registry.AppLabel) > 512 || registry.Revision < 0 || registry.Revision > 9007199254740991 || registry.Actions == nil || len(registry.Actions) > devAppMaxActions || !validDevChannels(registry.Channels) {
		return false
	}
	if strings.ContainsAny(registry.AppInstanceID, "\x00\r\n") {
		return false
	}
	ids := map[string]bool{}
	for _, raw := range registry.Actions {
		var action struct {
			ID string `json:"id"`
		}
		if json.Unmarshal(raw, &action) != nil || action.ID == "" || len(action.ID) > 256 || ids[action.ID] {
			return false
		}
		ids[action.ID] = true
	}
	return true
}

func (server *devServer) appSocket(w http.ResponseWriter, r *http.Request) {
	hub := server.apps
	query, err := url.ParseQuery(r.URL.RawQuery)
	target := query.Get("target")
	if err != nil || r.Method != "GET" || r.URL.Path != "/app" || r.URL.RawPath != "" || len(query) != 2 || len(query["target"]) != 1 || len(query["instance"]) != 1 || query.Get("instance") != server.record.InstanceID {
		http.Error(w, "invalid app connection", http.StatusForbidden)
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
	grant := hub.grants[target]
	origins := r.Header.Values("Origin")
	accepted := grant != nil && hub.pending < devAppMaxPending && (len(origins) == 0 || len(origins) == 1 && grant.origins[origins[0]])
	if accepted {
		hub.pending++
	}
	hub.mu.Unlock()
	if !accepted {
		http.Error(w, "app connection rejected", http.StatusForbidden)
		return
	}
	pending := true
	defer func() {
		if pending {
			hub.mu.Lock()
			hub.pending--
			hub.mu.Unlock()
		}
	}()
	// Origin was checked against this target's observed dev origin above. App proof
	// follows in a bounded first frame, avoiding credentials in URLs/access logs.
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
	var hello devAppHello
	if err != nil || kind != websocket.MessageText || json.Unmarshal(data, &hello) != nil || hello.Protocol != "octane-app-debug" || hello.Version != 1 || hello.InstanceID != server.record.InstanceID || hello.TargetID != target || subtle.ConstantTimeCompare([]byte(hello.Token), []byte(grant.Token)) != 1 || !validDevRegistry(hello.Registry, grant.platform) {
		_ = conn.Close(websocket.StatusPolicyViolation, "invalid app registration")
		return
	}
	sessionHash := sha256.Sum256([]byte(server.record.InstanceID + "\x00" + target + "\x00" + hello.Registry.AppInstanceID))
	peer := &devAppPeer{conn: conn, writer: writer, instance: hello.Registry.AppInstanceID, platform: hello.Registry.Platform, target: target, session: fmt.Sprintf("sess_%x", sessionHash[:16]), registry: hello.Registry, connectedAt: cli.IsoNow()}
	hub.mu.Lock()
	previous := hub.peers[hello.Registry.AppInstanceID]
	if previous != nil && previous.target != target {
		hub.mu.Unlock()
		_ = conn.Close(websocket.StatusPolicyViolation, "app belongs to another target")
		return
	}
	if previous == nil && len(hub.peers) >= devAppMaxPeers {
		// Retain bounded disconnected observations; live apps cannot be evicted.
		var oldestID, oldest string
		for id, entry := range hub.peers {
			if entry.disconnectedAt != "" && (oldest == "" || entry.disconnectedAt < oldest) {
				oldestID, oldest = id, entry.disconnectedAt
			}
		}
		if oldestID == "" {
			hub.mu.Unlock()
			_ = conn.Close(websocket.StatusTryAgainLater, "app connection limit")
			return
		}
		delete(hub.peers, oldestID)
	}
	hub.peers[hello.Registry.AppInstanceID] = peer
	hub.pending--
	pending = false
	hub.mu.Unlock()
	if previous != nil {
		_ = previous.conn.CloseNow()
	}
	defer func() {
		hub.mu.Lock()
		if hub.peers[hello.Registry.AppInstanceID] == peer {
			peer.disconnectedAt = cli.IsoNow()
		}
		hub.emitSessionsLocked(peer.target)
		hub.mu.Unlock()
		server.actions.disconnected(peer)
		server.inspection.disconnected(peer)
	}()
	ack, _ := json.Marshal(map[string]any{"type": "registered", "protocol": "octane-app-debug", "version": 1, "instanceId": server.record.InstanceID, "sessionId": peer.session, "capabilities": []string{"channels"}})
	writeCtx, cancel := context.WithTimeout(server.ctx, 2*time.Second)
	err = writer.sendSync(writeCtx, ack)
	cancel()
	if err != nil {
		return
	}
	hub.mu.Lock()
	peer.ready = true
	hub.emitSessionsLocked(peer.target)
	hub.mu.Unlock()
	for {
		readCtx, cancel := context.WithTimeout(server.ctx, 20*time.Second)
		kind, data, err = conn.Read(readCtx)
		cancel()
		if err != nil {
			return
		}
		var message devAppMessage
		if kind != websocket.MessageText || json.Unmarshal(data, &message) != nil || (message.Type != "registry" && message.Type != "outcome" && message.Type != "inspection" && message.Type != "channel") {
			_ = conn.Close(websocket.StatusPolicyViolation, "invalid app update")
			return
		}
		if message.Type == "channel" {
			if !devChannelID.MatchString(message.Channel) || (message.To != "backend" && message.To != "panels") {
				_ = conn.Close(websocket.StatusPolicyViolation, "invalid app channel frame")
				return
			}
			if failure := hub.deliverFromApp(peer, message.Channel, message.To, message.Data); failure != nil {
				peer.writer.send(failure)
			}
			continue
		}
		if message.Type == "inspection" {
			if !server.inspection.receive(peer, message.RequestID, message.Result) {
				return
			}
			continue
		}
		if message.Type == "outcome" {
			if !server.actions.receive(peer, message.Outcome) {
				_ = conn.Close(websocket.StatusPolicyViolation, "invalid action outcome")
				return
			}
			continue
		}
		if !validDevRegistry(message.Registry, grant.platform) || message.Registry.AppInstanceID != hello.Registry.AppInstanceID {
			_ = conn.Close(websocket.StatusPolicyViolation, "invalid app update")
			return
		}
		hub.mu.Lock()
		if hub.peers[hello.Registry.AppInstanceID] != peer {
			hub.mu.Unlock()
			return
		}
		// Out-of-order async announcements must not roll the registry backward.
		if message.Registry.Revision >= peer.registry.Revision {
			changed := devChannelsChanged(peer.registry.Channels, message.Registry.Channels)
			peer.registry = message.Registry
			if changed {
				hub.emitSessionsLocked(peer.target)
			}
		}
		hub.mu.Unlock()
	}
}

func devPeerSnapshot(peer *devAppPeer) map[string]any {
	state := "ready"
	if peer.disconnectedAt != "" {
		state = "disconnected"
	}
	channels := peer.registry.Channels
	if channels == nil {
		// Snapshots always carry channels so consumers have one stable shape;
		// a registry that never declared any reports an empty list.
		channels = []devChannelRef{}
	}
	snapshot := map[string]any{"sessionId": peer.session, "targetId": peer.target, "appInstanceId": peer.registry.AppInstanceID, "platform": peer.registry.Platform, "appLabel": peer.registry.AppLabel, "registryRevision": peer.registry.Revision, "state": state, "ownership": "observed", "origin": "dev-app-websocket", "readiness": "app-connected", "connectedAt": peer.connectedAt, "disconnectedAt": peer.disconnectedAt, "inspection": peer.registry.Inspection, "channels": channels}
	return snapshot
}

func (hub *devAppHub) snapshots(target string) []any {
	if hub == nil {
		return []any{}
	}
	hub.mu.Lock()
	defer hub.mu.Unlock()
	result := []any{}
	for _, peer := range hub.peers {
		if target == "" || peer.target == target {
			result = append(result, devPeerSnapshot(peer))
		}
	}
	// Registry map ordering must not change otherwise identical CLI snapshots.
	sortDevSessions(result)
	return result
}

func (hub *devAppHub) dispatch(command string, values map[string]any) (any, *cli.Error) {
	hub.mu.Lock()
	defer hub.mu.Unlock()
	switch command {
	case "session list":
		result := []any{}
		for _, peer := range hub.peers {
			result = append(result, devPeerSnapshot(peer))
		}
		sortDevSessions(result)
		return map[string]any{"sessions": result}, nil
	case "session status":
		for _, peer := range hub.peers {
			if peer.session == cli.StringValue(values["sessionId"]) {
				return map[string]any{"session": devPeerSnapshot(peer)}, nil
			}
		}
		return nil, &cli.Error{Code: "not_found", Message: "No app instance has this session id in the current dev server."}
	case "session attach":
		matches := []*devAppPeer{}
		for _, peer := range hub.peers {
			if !peer.ready || peer.disconnectedAt != "" {
				continue
			}
			if platform := cli.StringValue(values["platform"]); platform != "" && platform != peer.registry.Platform {
				continue
			}
			if target := cli.StringValue(values["targetId"]); target != "" && target != peer.target {
				continue
			}
			if instance := cli.StringValue(values["appInstanceId"]); instance != "" && instance != peer.registry.AppInstanceID {
				continue
			}
			matches = append(matches, peer)
		}
		if len(matches) == 0 {
			return nil, &cli.Error{Code: "not_found", Message: "No connected app matches this selection. Open the app with its dev bridge enabled first."}
		}
		if len(matches) > 1 {
			return nil, &cli.Error{Code: "ambiguous_selection", Message: "Several apps are connected; select --target and --instance."}
		}
		return map[string]any{"session": devPeerSnapshot(matches[0]), "detail": "Observation only; this request does not own or change app lifetime."}, nil
	case "actions list":
		live, disconnected := []any{}, []any{}
		for _, peer := range hub.peers {
			entry := devPeerSnapshot(peer)
			if peer.disconnectedAt != "" {
				disconnected = append(disconnected, entry)
				continue
			}
			entry["actions"] = peer.registry.Actions
			entry["revision"] = peer.registry.Revision
			live = append(live, entry)
		}
		sortDevSessions(live)
		sortDevSessions(disconnected)
		return map[string]any{"instances": live, "disconnectedInstances": disconnected}, nil
	}
	return nil, &cli.Error{Code: "unavailable", Message: "This app debug command is not implemented yet."}
}

func sortDevSessions(rows []any) {
	sort.Slice(rows, func(i, j int) bool {
		return rows[i].(map[string]any)["sessionId"].(string) < rows[j].(map[string]any)["sessionId"].(string)
	})
}

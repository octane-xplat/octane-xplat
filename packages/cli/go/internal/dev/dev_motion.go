package dev

import (
	"context"
	"encoding/json"
	"time"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
)

const devMotionChannel = "xplat-motion"

type devMotionReply struct {
	Type      string  `json:"type"`
	RequestID string  `json:"requestId"`
	Rate      float64 `json:"rate"`
}

type devMotionPending struct {
	peer   *devAppPeer
	result chan devMotionReply
}

func (hub *devAppHub) motionRequest(ctx context.Context, command string, values map[string]any) (any, *cli.Error) {
	requestID := osfs.Identity()
	request := map[string]any{"type": "get", "requestId": requestID}
	if command == "motion set-rate" {
		rate, ok := values["rate"].(float64)
		if !ok || !(rate > 0 && rate <= 1) {
			return nil, cli.Invalid("--rate must be greater than 0 and at most 1.")
		}
		request["type"] = "set"
		request["rate"] = rate
	}

	instance := cli.StringValue(values["appInstanceId"])
	if _, explicit := values["appInstanceId"]; explicit && instance == "" {
		return nil, cli.Invalid("--instance must be a nonempty app instance ID.")
	}
	hub.mu.Lock()
	var peer *devAppPeer
	for _, candidate := range hub.peers {
		if !devPeerLive(candidate) || (instance != "" && candidate.instance != instance) {
			continue
		}
		if peer != nil {
			hub.mu.Unlock()
			return nil, &cli.Error{Code: "ambiguous_selection", Message: "Several apps are connected; pass --instance."}
		}
		peer = candidate
	}
	if peer == nil {
		hub.mu.Unlock()
		return nil, &cli.Error{Code: "not_found", Message: "No connected app matches this selection."}
	}
	supported := false
	for _, channel := range peer.registry.Channels {
		if channel.ID == devMotionChannel && channel.Version == 1 {
			supported = true
			break
		}
	}
	if !supported {
		hub.mu.Unlock()
		return nil, &cli.Error{Code: "unsupported_capability", Message: "This app did not announce motion control."}
	}
	if len(hub.motionPending) >= devSocketQueueDepth {
		hub.mu.Unlock()
		return nil, &cli.Error{Code: "target_busy", Message: "Too many motion requests are pending."}
	}
	pending := devMotionPending{peer: peer, result: make(chan devMotionReply, 1)}
	hub.motionPending[requestID] = pending
	peer.writer.send(devChannelFrame(map[string]any{"type": "channel", "channel": devMotionChannel, "from": "backend", "data": request}))
	hub.mu.Unlock()

	defer func() {
		hub.mu.Lock()
		delete(hub.motionPending, requestID)
		hub.mu.Unlock()
	}()
	wait, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	select {
	case reply := <-pending.result:
		if reply.Type != "state" || !(reply.Rate > 0 && reply.Rate <= 1) {
			return nil, &cli.Error{Code: "execution_failure", Message: "The app rejected the motion request."}
		}
		return map[string]any{"appInstanceId": peer.instance, "rate": reply.Rate}, nil
	case <-peer.writer.done:
		return nil, &cli.Error{Code: "disconnected_runtime", Message: "The app disconnected before confirming the motion request."}
	case <-wait.Done():
		return nil, &cli.Error{Code: "timeout", Message: "The app did not confirm the motion request."}
	}
}

// Called under the hub lock. Frames also continue to DevTools so every panel
// sees the same app-owned state.
func (hub *devAppHub) receiveMotionReply(peer *devAppPeer, data json.RawMessage) {
	var reply devMotionReply
	if json.Unmarshal(data, &reply) != nil {
		return
	}
	if pending, ok := hub.motionPending[reply.RequestID]; ok && pending.peer == peer {
		select {
		case pending.result <- reply:
		default:
		}
	}
}

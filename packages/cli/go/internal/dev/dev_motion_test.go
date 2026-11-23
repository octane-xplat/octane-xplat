package dev

import (
	"context"
	"testing"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
)

func TestMotionRequestWaitsForSelectedApp(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	grant := server.appGrant(devTarget{ID: "web", Kind: "web"})
	channel := devChannelRef{ID: devMotionChannel, Version: 1}
	app, _ := dialRegisteredApp(t, grant, devChannelRegistry("motion-app", channel))
	other, _ := dialRegisteredApp(t, grant, devChannelRegistry("other-app", channel))
	waitActionPeerReady(t, server, "motion-app")
	waitActionPeerReady(t, server, "other-app")

	if _, failure := server.apps.motionRequest(context.Background(), "motion get-rate", nil); failure == nil || failure.Code != "ambiguous_selection" {
		t.Fatal("ambiguous motion command must select an app instance", failure)
	}

	type outcome struct {
		value   any
		failure *cli.Error
	}
	done := make(chan outcome, 1)
	go func() {
		value, failure := server.apps.motionRequest(context.Background(), "motion set-rate", map[string]any{
			"appInstanceId": "motion-app", "rate": 0.25,
		})
		done <- outcome{value, failure}
	}()

	frame := appSocketRead(t, app)
	data := frame["data"].(map[string]any)
	if frame["channel"] != devMotionChannel || data["type"] != "set" || data["rate"] != 0.25 {
		t.Fatal("incorrect motion command", frame)
	}
	reply := map[string]any{
		"type": "channel", "channel": devMotionChannel, "to": "panels",
		"data": map[string]any{"type": "state", "requestId": data["requestId"], "rate": 0.5},
	}
	sendSocketFrame(t, other, reply)
	reply["data"].(map[string]any)["rate"] = 0.25
	sendSocketFrame(t, app, reply)

	result := <-done
	if result.failure != nil {
		t.Fatal(result.failure)
	}
	value := result.value.(map[string]any)
	if value["rate"] != 0.25 || value["appInstanceId"] != "motion-app" {
		t.Fatal("motion result did not originate from the selected app", value)
	}
}

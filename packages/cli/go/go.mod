module github.com/octane-xplat/octane-xplat/packages/cli/go

go 1.27.3

require (
	github.com/coder/websocket v1.8.15
	github.com/octane-xplat/nativescript-cli v0.0.0
	github.com/tailscale/hujson v0.0.0-20260727124030-b80ff77dac4f
	github.com/yalue/onnxruntime_go v1.38.0
	go.yaml.in/yaml/v3 v3.0.6
	golang.org/x/sys v0.49.0
	golang.org/x/text v0.43.0
)

replace github.com/octane-xplat/nativescript-cli => ../vendor/nativescript-cli

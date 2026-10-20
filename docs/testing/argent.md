# Check an app with Argent

> Let a coding agent find controls and exercise a small, repeatable journey on your local browser or test phone.

[Argent](https://github.com/software-mansion/argent) is an optional tool that
connects an AI agent to device/browser controls through MCP (the protocol
agents use to call tools). It is development tooling; your Xplat app needs
no Argent runtime dependency or framework package. Follow the
[official installation guide](https://docs.swmansion.com/argent/docs/fundamentals/installation/)
for editor setup. This guide uses version **0.27.0**.

To configure MCP without a global installation, an editor entry can launch
`pnpm dlx` directly. Adapt the top-level key to your editor using the
[official MCP guide](https://docs.swmansion.com/argent/docs/fundamentals/mcp-server/).
This is optional configuration guidance; the qualified runtime checks use the
CLI, not an editor adapter. The setup wizard defaults to global installation,
so do not run it when global changes are prohibited.

```json
{
	"mcpServers": {
		"argent": {
			"command": "pnpm",
			"args": ["dlx", "@swmansion/argent@0.27.0", "mcp"],
			"env": { "DO_NOT_TRACK": "1" }
		}
	}
}
```

## Start with a local journey

1. Build and install your app using [Xplat's platform setup](../start/toolchain.md#run-on-ios-and-android).
   Use a dedicated simulator/emulator and deterministic test data; preserve
   other apps, devices, watchers, and user data. Reserve the build slot and
   device together when a resource broker is available.
2. Give meaningful controls [stable test names](test-identifiers.md). Inspect
   the text hierarchy, then verify replay independently. Replace `DEVICE_ID`
   below with the selected simulator UUID, emulator serial, or Chromium ID.

   ```sh
   DO_NOT_TRACK=1 pnpm dlx @swmansion/argent@0.27.0 run describe --udid DEVICE_ID --json
   DO_NOT_TRACK=1 pnpm dlx @swmansion/argent@0.27.0 flow run flows/counter.yaml --device DEVICE_ID --json
   ```

3. Write a bounded flow that starts from known state, uses unique IDs, waits
   for an observable result, and fails on a wrong result. Replace the sample
   app ID with yours. Numeric input is the qualified typing path; it appends
   to the current field value, so begin with an empty field when expecting `42`.

   ```yaml
   steps:
     - launch: { ios: com.example.packing }
     - assert: { visible: { text: 'Count: 0' } }
     - tap: { id: counter.increment }
     - await: { visible: { text: 'Count: 1' }, timeout: 5000 }
     - type: { into: { id: message.entry }, text: '42' }
     - await: { visible: { text: 'Message: 42' }, timeout: 5000 }
   ```

   For Android, use `launch: {android: com.example.packing}`. For Chromium,
   open/reset the page instead of launching a native app. Keep DOM `id`
   precedence in mind when selecting a field with both `id` and `testID`.

## Discovery and replay need different services

| Target           | Discovery                                                | Replay/input prerequisite                                                                                |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| iOS simulator    | AX accessibility tree, with native discovery available   | App launched through Argent with injected full UIKit hierarchy                                           |
| Android emulator | Argent helper tree, with UiAutomator discovery available | Installed/running Argent Android helper and full helper hierarchy; authenticated emulator gRPC for input |
| Chromium         | DOM through CDP                                          | Running Chromium with a local remote-debugging port and the intended page selected                       |

A successful `describe` does not establish replay readiness. iOS replay uses
injected native views; Android replay requires the helper rather than silently
falling back to UiAutomator. Argent starts the Android helper service and can install its bundled helper
APK on the selected test device; this is tool-side setup, not an app plugin.
During app startup an empty helper tree may need a readiness retry. Preserve labels: a duplicate label on a parent and its
child may need a role-scoped selector when an ID is unavailable.

For a dedicated headless Android emulator, the qualified input setup uses an
explicit gRPC port with a token. Substitute your own AVD and unused ports;
keep the endpoint local and do not print tokens.

```sh
emulator -avd YOUR_TEST_AVD -port 5582 -grpc 18556 -grpc-use-token \
  -no-window -no-audio -no-snapshot -gpu swiftshader
adb -s emulator-5582 wait-for-device
adb -s emulator-5582 shell getprop sys.boot_completed
```

Wait for `sys.boot_completed` to return `1`. A token-less gRPC launch can let
discovery work while replay input fails. Use [Android lab guidance](../../.agents/docs/android-lab.md)
for installed tools, JDK selection, isolation, and ownership.

The qualified nonvisual route calls the CLI directly. Avoid screenshot,
snapshot, recording, pixel-idle, and visual-regression tools when visual
analysis is not authorized. MCP adapters may automatically capture images
after actions; CLI qualification does not qualify that adapter behavior.
The iOS input service internally initializes a framebuffer backend, so this
is not a claim that the tool processes zero internal pixel buffers.

## Qualification limits

The bounded numeric-input and control journey passed on an iOS simulator and
Chromium. Android has source mapping coverage only; it has no runtime pass
in this qualification. Physical devices, desktop renderers, IME composition,
arbitrary alphabetic typing, navigation, permissions, and visual parity remain
unverified. MCP editor adapters are not qualified by CLI results.

Framework contributors can reproduce the
[maintained checks and target evidence](../../.agents/docs/argent.md).

# iOS HTTP graph timeout reproduction

This isolates NativeScript iOS 9.1.0's HTTP graph transport from Vite, Octane,
package resolution, and application configuration. The fixture is verified on
an arm64 iOS 27 simulator with NativeScript iOS 9.1.0: the delayed parent caused
two async timeouts and three graph-miss warnings. A request-scoped 30-second
timeout override removed the warnings with the same runtime binary. Both runs
returned 42. This proves the mechanism, not the cause of every consumer miss.
See [the limitation record](../../../.agents/docs/upstream-limitations.md#nativescript-ios-http-module-fetch-budget-910).

1. Start the server from this directory:

   ```sh
   node server.mjs
   ```

2. In a separate NativeScript iOS 9.1.0 **debug** test app, use `main.mjs` as
   its entry (`package.json` main must select that file). Keep it unbundled so
   the runtime receives the dynamic HTTP import. The app needs no JS package
   imports. This fixture supplies the JS entry and HTTP server; it does not
   provision or build a native host.

3. Reserve the simulator through the host resource broker and run only on
   `91D40099-A056-497D-A572-ADDDFD6A8F23`, once its owner permits using it.
   Capture text logs and server request times. Do not replace a running app,
   create devices, or capture screenshots for this test.

The control graph should print `[graph-repro] control 42` without graph-miss
warnings. The timeout graph delays the first two responses for `slow.mjs` by
6 seconds each. All paths exist and return JavaScript with HTTP 200; later
requests return immediately. NativeScript's request builder sets 5 seconds,
retries a transport failure once, then leaves failed dependencies for the
synchronous resolver. The observed signature was two timed-out async requests,
a third request plus a warning for `slow.mjs`, and further misses for its
previously undiscovered `branch.mjs` and `leaf.mjs`. The final value remains 42.
`export { value }` and `export *` deliberately exercise re-export discovery.

For the A/B, give the requests 30 seconds and run the same fixture again.
The test-only [timeout override](timeout-override.m) intercepts the native
request setter only for this local fixture and the isolated-consumer test port.
Load its simulator dylib through `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES` when
launching the separate test app; never inject it into a user app session.
The measured parent response completed on its first request in about 6 seconds,
with no warning or synchronous fallback. A rebuilt runtime patch is still
unqualified. Before release qualification, verify that a true HTTP 404, invalid JavaScript, and cyclic imports still fail or settle
correctly before adopting a runtime change. The 30-second value is an A/B
experiment, not a qualified framework default; Vite can wait up to 120 seconds
for transforms, and the runtime's pumped graph deadline is 60 seconds.

Build and sign the test override under a native-build reservation:

```sh
PROBE_SCRATCH="$HOME/agent-scratch/octane-xplat/ios-module-graph"
mkdir -p "$PROBE_SCRATCH"
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Compile test timeout override"}' -- xcrun --sdk iphonesimulator clang -dynamiclib -arch arm64 -mios-simulator-version-min=15.0 -framework Foundation timeout-override.m -o "$PROBE_SCRATCH/timeout-override.dylib"
codesign --force --sign - "$PROBE_SCRATCH/timeout-override.dylib"
```

Within the task's existing device reservation, launch the separate test app
with the override. Replace `YOUR_TEST_BUNDLE_ID` with that app's actual id:

```sh
SIMCTL_CHILD_DYLD_INSERT_LIBRARIES="$PROBE_SCRATCH/timeout-override.dylib" xcrun simctl launch --console 91D40099-A056-497D-A572-ADDDFD6A8F23 YOUR_TEST_BUNDLE_ID
```

A separate process-cold published-consumer comparison also removed the native
fetch failures and misses with this override. Its valid cold module responses
exceeded 5 seconds, establishing that the synthetic delay represents a real
serving condition. See the limitation record for evidence boundaries; this
fixture does not qualify UI startup or HMR.

Use a fresh test-app process or distinct URLs for each run to avoid measuring
an already-populated module registry. Stop the server with Ctrl-C. Script-style
native hosts may exit normally after printing both results; this does not test
UI mounting, HMR, or application startup latency.

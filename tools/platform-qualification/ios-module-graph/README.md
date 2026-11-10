# iOS HTTP graph timeout reproduction

This isolates NativeScript iOS 9.1.0's HTTP graph transport from Vite, Octane,
package resolution, and application configuration. The fixture is syntax-checked;
the warning sequence below is **expected from source, not yet verified on iOS**.
A separate macOS Foundation transport test confirmed that a 5-second request
expires before a valid 6-second response despite a 10-second session timeout.
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
synchronous resolver. The predicted signature is two abandoned async requests,
a third request plus a warning for `slow.mjs`, and further misses for its
previously undiscovered `branch.mjs` and `leaf.mjs`. The final value remains 42.
`export { value }` and `export *` deliberately exercise re-export discovery.

For a candidate runtime repair, give the requests 30 seconds and run the same
fixture again. The delayed module should complete on its first request in
about 6 seconds, with no warning or synchronous fallback. Also verify that a
true HTTP 404, invalid JavaScript, and cyclic imports still fail or settle
correctly before adopting a runtime change. The 30-second value is an A/B
experiment, not a qualified framework default; Vite can wait up to 120 seconds
for transforms, and the runtime's pumped graph deadline is 60 seconds.

Use a fresh test-app process or distinct URLs for each run to avoid measuring
an already-populated module registry. Stop the server with Ctrl-C. Script-style
native hosts may exit normally after printing both results; this does not test
UI mounting, HMR, or application startup latency.

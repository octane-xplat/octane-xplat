# CEF browser spike (S0)

Prove the spine of the CEF browser plan: an Xplat window rendered by the
macOS AppKit renderer hosts a CEF browser as a real windowed child NSView via
the `attachTo` seam, and an Xplat text field navigates it. See `SPIKE.md` for
the full report, including the green-light checklist and the C API / V2
seatbelt findings.

## Setup

```sh
pnpm install
pnpm --dir apps/cef-browser cef:fetch     # download CEF 154.0.34 (macOS arm64)
pnpm --dir apps/cef-browser cef:runtime   # assemble the .app skeleton + helpers
```

`cef:fetch` pulls the pinned minimal binary distribution into `cef-dist/`
(gitignored) and stages the C API headers into `platforms/macos/cef/`.
`cef:runtime` builds `cef-runtime/XplatCefSpike.app` — the bundle skeleton CEF
requires on macOS (`Contents/Frameworks/` carries the Chromium Embedded
Framework plus five helper bundles) — compiles the helper executable, and
copies the JavaScriptCore host into `Contents/MacOS/XplatCefSpike` so the
browser process is bundled (required for the V2 seatbelt).

## Run

```sh
pnpm --dir apps/cef-browser run:host    # rebuild app + leaf + bundle, then launch
```

The window shows an Xplat-rendered toolbar (back/forward/reload, URL field,
Go) above a CEF-rendered page. The status label reports CEF events. A timed
self-test navigates from `https://example.com` to `https://example.org`,
injects a wheel event, fetches the page DOM via `get_source`, and moves focus
between chrome and content.

Environment flags (see `scripts/run.sh` for the full list):

- `XPLAT_CEF_NO_SANDBOX=1` — disable the renderer/utility sandbox.
- `XPLAT_CEF_IN_PROCESS_GPU=1` — run GPU work in the browser process
  (required today with the sandbox on; the sandboxed GPU helper still hits a
  Chromium CHECK inside `cef_execute_process`).
- `XPLAT_CEF_CBTRACE=1` — log every CEF callback entry.
- `XPLAT_CEF_REFTRACE=1` — log handler add_ref/release balance.
- `XPLAT_CEF_HANDLERS=display,load,focus` — enable only named handlers.
- `XPLAT_CEF_SINGLE_PROCESS=1`, `XPLAT_CEF_IN_PROCESS_RENDERER=1`,
  `XPLAT_CEF_DISABLE_GPU=1` — debug switches passed through to CEF.

Chromium logs land in `cef-runtime/cef.log`; helper stderr is inherited by
the browser's stderr.

## Layout

- `platforms/macos/src/XplatCefHost.mm` — CEF C API bridge (dlopen'd
  framework, `cef_api_hash`, path switches, handlers, pump, events)
- `platforms/macos/include/XplatCefHost.h` — leaf interface
- `platforms/macos/helper/cef_helper_main.m` — shared helper executable
  (seatbelt init → framework load → `cef_execute_process`)
- `platforms/macos/cef/include` — staged C API headers
- `src/cef.macos.ts` — JS facade + `wireControl` (native target/action)
- `src/App.tsrx` — chrome UI + self-test
- `src/main.mjs`, `src/appkit.mjs` — entry + window
- `scripts/` — `fetch-cef.sh`, `build-cef-runtime.sh`, `run.sh`

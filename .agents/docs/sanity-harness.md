# Sanity console and qualification fixtures

Use `/harness` for the internal test console, `/harness/:caseId` for a stable case link, and `/?harness` for an explicit console launch. The visitor showcase remains separate. The console groups checks by contract rather than by mini-app: rendering, layout, input, navigation, asynchronous state, collections/motion, media/services, and diagnostics.

## Case ownership

`packages/app/src/harness/core-cases.ts` owns renderer-free core case definitions. A case declares a stable ID, expected result, owner, fixture, suite and ordered steps. Both the in-app web driver and production browser-input runner consume those steps. `Fixtures.tsrx` owns shared public-component fixtures; it does not repair public component styles or use mock components. `resources.ts` exposes an independent ownership count so unmount cleanup remains observable after a child disappears.

`catalog.ts` classifies every retained demo and adds links to qualification workflows. Retained fixtures are manual, not automatically qualified contracts. They preserve existing coverage while useful behaviors are promoted into precise cases. Keep component appearance/variant matrices in Workshop, pure logic/types/packaging in package tests, and temporary investigations in the probe runner. Do not duplicate a fixture only to populate this console.

## Result meaning

The console has Overview, Cases, and Results. Search matches case names, IDs, owners, areas and tags; suite, area and outcome filters narrow the catalog. The workbench shows the expected result, ordered checks or manual instructions, a fresh fixture, and a separate manual observation form. Opening a fixture never counts as passing.

Outcomes are passed, failed, blocked, unsupported, and implicit not-run. Running is an execution state, not a passing outcome. Results record case/run identity, target, build mode, evidence method, timestamps, duration, successful assertions, and a failure message containing the failed step and last observed value. Keep manual observations separate from automatic evidence, even for the same case. History is bounded to the latest 200 session results; export JSON before retiring the host. The overview's latest observations are not a release qualification matrix.

The in-app web runner uses DOM event dispatch and DOM state/geometry inspection. It does not qualify pointer hit-testing, OS input, screenshots or accessibility services. The production browser runner supplies actual browser pointer/keyboard input against the same case steps and writes a separate scoped report. It does not upgrade the console's DOM-dispatch results into OS-input claims.

Native console leaves identify their target and expose the shared fixtures for manual inspection. Automatic DOM checks explicitly report unsupported on those hosts. A compiled/shared fixture, manual pass, or source-only adapter does not establish native input, pixels, accessibility or packaged-runtime parity. Use the maintained device/host qualification tools for those claims.

## Isolation and failure

`runner.ts` owns serialized execution. Each core case mounts a fresh fixture generation, waits for observable conditions, performs assertions, and awaits teardown before the next mount. Cleanup runs on failure and cancellation too. Failed assertions may continue only after successful cleanup. Failed cleanup quarantines the owner: later cases are blocked and the host must reload. Do not hide lifecycle races with fixed sleeps or force a resource count back to zero.

Manual reset and case selection dispose the previous fixture before mounting another. Keep fixture state local and subscribe to module stores at each reader. Cancel a running owner when the console detaches; retired work must not publish to a new fixture. Navigation qualification creates a fresh explicit router and pane host inside the fixture. It verifies retained pane state without changing the enclosing app URL or claiming native Frame/OS Back integration. The fixture disposes that router when it closes.

## Existing baseline

`/harness-baseline` opens `harness/BaselineFixture.tsrx`: the retained Home / Apps / Test integration fixture. On web this entry starts a fresh `/?baseline` host; existing browser smoke, navigation and virtual-list launchers use that root entry directly, so named-flow URLs retain the original shell owner. `?selfdrive` / `?selfdrive-os` and direct named `@test` / `@demos` launches also select this baseline. Its self-driving and parity hooks start only when it mounts. The console and visitor app do not schedule those sweeps.

The baseline is a test fixture, not a second visitor gallery or a compatibility promise for framework APIs. Preserve its probe IDs, named stacks and assertions until equivalent focused cases replace the behavior they protect. Delete redundant fixture material only with an explicit coverage replacement. Baseline mounting or a basic counter check does not qualify every retained fixture.

## Maintained checks

Run through Turbo so build and generated-route prerequisites are prepared:

```sh
bun run turbo run smoke:harness --filter=@xplat/web
bun run turbo run smoke --filter=@xplat/web
bun run turbo run smoke:navigation --filter=@xplat/web
bun run turbo run test --filter=@xplat/web -- packages/app/src/harness/runner.web.test.ts
```

`XPLAT_WEB_BROWSER` selects an installed Chromium, Firefox or WebKit engine for the harness and baseline smoke. `XPLAT_HARNESS_URL` can identify an owned running server; otherwise the harness runner starts its own preview. `XPLAT_HARNESS_REPORT` writes browser-input results as JSON. None of these harness checks capture images. Keep browser tasks outside lightweight PR CI.

The harness browser check verifies the in-app suite and exported evidence, then exercises each core case with browser input. It also checks an injected geometry failure, cancellation, manual/automatic distinction, fresh reset, filtering, narrow layout, baseline navigation, explicit console launch, and return to the showcase. Runner tests pin cleanup ordering, cancellation, concurrency rejection, quarantine and unsupported/manual outcomes. Target execution and broader qualification remain separate.

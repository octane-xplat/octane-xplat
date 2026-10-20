# Protect unsaved edits during navigation

ID: navigation-blocking
Targets: web, ios, android, macos, linux
Related APIs: useNavigationBlocker, NavigationBlockerOptions, NavigationBlockerState, RouterProvider, router.back, router.dismiss, router.refresh

## Starting point

A canonical router and a mounted screen that owns a draft and its dirty flag.
The application owns persistence and confirmation-panel UI.

## Requirements

Confirm client navigation before discarding edits, preserve the admitted screen
on refusal, and resume preparation with current context on approval. Distinguish
that flow-owned choice from document unload, raw host operations and teardown.

## Acceptance criteria

- AC1: The reader binds `when` to the draft, renders confirmation in its owning
  flow, narrows the blocked state before using `proceed`/`reset`, and understands
  idle, blocked and proceeding without caller-chosen route-data types.
- AC2: Refusal preserves the committed screen and cancels without a new loading
  failure; approval starts fresh context/guards/loaders once. Save ordering,
  condition clearing, supersession and unmount release obsolete controls/work.
- AC3: Older retained entries with the same href cannot block the current one.
  Several active registrations must all approve; another named flow, a redirect
  in the approved attempt and forced owner teardown have explicit ownership rules.
- AC4: The reader can state the supported browser Back/Forward, iOS Frame edge,
  Android Back, native modal and AppKit pane/modal boundaries. Refresh is distinct from
  leaving. Document unload, external document links, predictive animation and OS
  exit are not silently promised by the hook.

## Documentation

- AC1: [Confirm unsaved edits](../../../docs/app/navigation.md#confirm-before-leaving-unsaved-edits),
  package consumer type fixtures, and shared DOM/native hook cases.
- AC2: [Confirm unsaved edits](../../../docs/app/navigation.md#confirm-before-leaving-unsaved-edits),
  controller and router-protocol tests, plus maintained browser/native fixtures.
- AC3: [Flow ownership and visibility](../../../docs/app/navigation.md#confirm-before-leaving-unsaved-edits),
  shared duplicate-href cases and owned platform fixture checks.
- AC4: [Supported boundaries](../../../docs/app/navigation.md#confirm-before-leaving-unsaved-edits)
  and [release navigation checks](../navigation-checks.md).
  Runtime qualification is recorded separately from documentation coverage.
- Maintained shared example: [Test → Unsaved edits](../../../packages/app/src/app/navigation-blocking.tsrx),
  exercised by the Linux WebKitGTK harness. The current Silo recipe-audit target
  constraint cannot store Linux assessments; do not relabel them as web.

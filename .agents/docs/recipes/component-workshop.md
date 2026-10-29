# Develop a component in the workshop

ID: component-workshop
Targets: web, linux, macos
Related APIs: @octane-xplat/workshop, defineStory, defineWorkshopConfig, WORKSHOP_CONTRACT_VERSION, xplat workshop

## Starting point

An existing Octane Xplat consumer with its matching compiler, renderer and pnpm
setup. This recipe covers the browser preview, the Linux GTK4 renderer host
and the macOS AppKit/JavaScriptCore host — the same story catalog, controls and
lifecycle in each. The other three real-host workshops remain separate delivery
gates.

## Requirements

Develop an app-owned component in a separate development entry, manipulate its
explicit inputs, recover from failures, and keep workshop data out of production.

## Acceptance criteria

- AC1: Install packaged dependencies, initialize without overwriting the app, and use doctor/list to identify target availability and story IDs without evaluating incompatible leaves.
- AC2: Declare typed props, controls, fresh state, cancellable fixtures and ordered providers; invalid prop/control declarations produce actionable errors.
- AC3: Select and interact with a real compiled component, apply controls without resetting healthy state, remove optional props, and Reset to fresh nested defaults.
- AC4: Release all owned roots and resources on switching/reset; stale asynchronous work cannot mount, and failed/timed-out cleanup requires target restart.
- AC5: Save story/component source, observe a fresh successful revision, retain clearly stale content on a bad edit, and recover after correction.
- AC6: Use search, compact panels and stage-only mode through keyboard and screen reader; preserve composition, selection and healthy state through layout changes.
- AC7: Build the ordinary production entry with stories, fixture data and workshop dependencies excluded.

## Documentation

- AC1: [Install and launch](../../../docs/testing/component-workshop.md#try-it); [commands](../../../docs/testing/component-workshop.md#commands); [Linux host](../../../docs/testing/component-workshop.md#linux-host); [macOS target](../../../docs/testing/component-workshop.md#macos-target); [Windows setup status](../../../packages/workshop/WINDOWS.md). Gaps: Linux launch qualifies only through an actual GTK4/GJS host (non-Linux GJS is a dev stand-in); macOS interaction evidence is recognizer-action dispatch, not OS-synthesized input, and screen-reader/IME remain unqualified; Windows prerequisite reporting exists, but native launch and host qualification remain incomplete.
- AC2: [Declare stories](../../../docs/testing/component-workshop.md#declaring-stories); [owned fixture resources](../../../docs/testing/component-workshop.md#owned-fixture-resources).
- AC3: [Controls and Reset](../../../docs/testing/component-workshop.md#state-preserving-controls-vs-full-reset); [acceptance catalog](../../../apps/workshop-demo/src/stories/isolation.stories.web.tsrx).
- AC4: [Owned fixture resources](../../../docs/testing/component-workshop.md#owned-fixture-resources); [isolation example](../../../apps/workshop-demo/src/stories/isolation.stories.web.tsrx).
- AC5: [Save and reload](../../../docs/testing/component-workshop.md#save-and-reload).
- AC6: [Shell](../../../docs/testing/component-workshop.md#shell). Gap: actual screen-reader announcements and real OS IME qualification remain unverified.
- AC7: [Production exclusion](../../../docs/testing/component-workshop.md#production-exclusion); [packed regression](../../../packages/workshop/tests/packed-consumer.web.mjs); [packed Linux regression](../../../packages/workshop/tests/packed-consumer.linux.mjs); [packed macOS regression](../../../packages/workshop/tests/packed-consumer.macos.mjs).

// Test bundle entry — the vite config's --env.unitTesting overlay swaps the
// app entry (src/index.ts) for this file, so `ns test`/`ns run
// --env.unitTesting` boots the Vitest coordinator instead of the app.
import '@valor/nativescript-websockets'
import { Application } from '@nativescript/core'
import {
	NativeScriptVitestCoordinator,
	createNativeScriptTestRegistry,
} from '@nativescript/unit-test-runner/runtime'

import { createVitestHostPage } from '@nativescript/unit-test-runner/testing'

const coordinator = new NativeScriptVitestCoordinator({
	// Every spec matched by vitest.config.mts `include` must also match this
	// glob — vite statically bundles each as a lazily imported chunk that the
	// registry loads on demand (the vite equivalent of webpack's
	// require.context registry upstream scaffolds).
	// Rolldown's glob expansion does not support extglob `@(a|b)` — use
	// brace alternation.
	registry: createNativeScriptTestRegistry(import.meta.glob('./**/*.spec.{ts,tsx,tsrx}')),
})

void coordinator.start()
// The host page keeps the screen free as a mount() surface for UI specs.
Application.run({ create: () => createVitestHostPage(coordinator) })

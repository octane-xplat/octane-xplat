// Test bundle entry — `ns test` builds with --env.unitTesting, and the
// xplatNative preset swaps the app entry (src/main.ts) for this file, so the
// device boots the Vitest coordinator instead of the app.
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
	// registry loads on demand.
	registry: createNativeScriptTestRegistry(import.meta.glob('./**/*.spec.{ts,tsx,tsrx}')),
})

void coordinator.start()
// The host page keeps the screen free as a mountXplat() surface for UI specs.
Application.run({ create: () => createVitestHostPage(coordinator) })

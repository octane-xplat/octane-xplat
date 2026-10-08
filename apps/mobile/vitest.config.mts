import { defineConfig } from 'vitest/config'
import { nativeScript } from '@nativescript/unit-test-runner'

// `pnpm test:ios` / `pnpm test:android` (ns test) drive this config: the
// plugin launches `ns run <platform> --no-hmr --env.unitTesting` and
// orchestrates spec execution on-device over a loopback WebSocket — Vitest
// stays the orchestrator on the host.
//
// This host runs Xcode 27 (no Simulator.app): the runner's `ns run` launch
// only works against an already-booted simulator, so boot first —
// `xcrun simctl boot <udid>` — and pass `--device <udid>` (or NS_DEVICE).
export default defineConfig({
	plugins: [
		nativeScript({
			platform: process.env.NS_PLATFORM || 'ios', // 'android' | 'ios' | 'visionos'
			device: process.env.NS_DEVICE || undefined,
			// Keep this in sync with the import.meta.glob in src/test.ts —
			// the device can only run files that made it into the bundle.
			include: ['src/**/*.spec.{ts,tsx,tsrx}'],
			// The connect clock starts when the host session opens and covers
			// `ns run`'s native build + install + boot — a cold build easily
			// exceeds the 120s default.
			connectTimeout: 600_000,
		}),
	],
	test: {
		// Device runs include app startup and real layout passes.
		testTimeout: 30_000,
	},
})

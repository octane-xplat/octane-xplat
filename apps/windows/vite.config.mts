import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

// The shared preset owns the renderer rules, octane→universal/native alias,
// suffix extension chain (.windows → the unsuffixed native default when
// building for windows), deps-bundle plugin exclusions, the HMR watchdog,
// and the px→dip CSS rewrite. App-specific additions go through the second
// argument's `extra` (or mergeConfig).
export default defineConfig(({ mode }) =>
	xplatNative(mode, {
		extra: {
			resolve: {
				// This app runs the PR-preview core (9.1.3-next.2) while workspace
				// packages' devDeps carry 9.1.2 — importers inside packages/* would
				// otherwise resolve a second core copy and split view identity.
				// Peer contexts can also duplicate the renderer's element registry.
				dedupe: ['@nativescript/core', '@nativescript-community/octane'],
			},
		},
	}),
)

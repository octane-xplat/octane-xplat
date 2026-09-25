import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

// The shared preset owns the renderer rules, octane→universal/native alias,
// suffix extension chain, deps-bundle plugin exclusions, the HMR watchdog,
// and the px→dip CSS rewrite. App-specific additions go through the second
// argument's `extra` (or mergeConfig) — nothing needed here today.
export default defineConfig(({ mode }) => xplatNative(mode))

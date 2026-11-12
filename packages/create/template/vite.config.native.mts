import { defineConfig, native, tweaks } from 'octane-xplat/vite'

// The shared preset owns the renderer rules, octane→universal/native alias,
// suffix extension chain, deps-bundle plugin exclusions, the HMR watchdog,
// the px→dip CSS rewrite, and fs.allow widening for link:/file: dep roots.
// App-specific additions go through the second argument's `extra` (or
// mergeConfig). tweaks() instruments useTweak for `xplat dev` — enforce:'pre'
// keeps it ahead of the Octane compile inside the merged preset.
export default defineConfig(({ mode }) => native(mode, { extra: { plugins: [tweaks()] } }))

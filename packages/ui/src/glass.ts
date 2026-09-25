import type { GlassConfig, GlassProp } from './props'

/** Normalize the `glass` surface prop into the config object handed to
 *  `iosGlassEffect` on native. Always returns an object — the upstream
 *  string shorthand silently drops `interactive` on the layout's update
 *  path, and an empty config defaults the variant to 'regular' here rather
 *  than upstream's own fallback. `false`/'none'/'identity' → no glass. */
export function glassConfigOf(glass: GlassProp | undefined): GlassConfig | undefined {
	if (!glass || glass === 'none' || glass === 'identity') {
		return undefined
	}

	const c = typeof glass === 'string' ? { variant: glass } : glass === true ? {} : glass
	if (c.variant === 'none' || c.variant === 'identity') {
		return undefined
	}

	return { variant: 'regular', ...c }
}

/** `vx-glass` classes shared by web (real styling) and native (hook for
 *  app-supplied fallback CSS on non-glass OSes). */
export function glassClassOf(glass: GlassProp | undefined): string | undefined {
	const c = glassConfigOf(glass)
	if (!c) {
		return undefined
	}

	return c.variant === 'clear' ? 'vx-glass vx-glass--clear' : 'vx-glass'
}

/** Style merge for the web approximation — `tint` becomes the surface
 *  color (the class's translucent fallback is a weaker claim than an
 *  explicit inline value). Caller spreads result into its style object. */
export function glassStyleOf(glass: GlassProp | undefined): Record<string, any> {
	const c = glassConfigOf(glass)
	return c?.tint ? { backgroundColor: c.tint } : {}
}

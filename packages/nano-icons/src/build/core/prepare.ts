// Ported from react-native-nano-icons (MIT, © Software Mansion) — the
// shared per-file SVG prep stage. Adapted to accept SVG content directly so
// callers can feed files or generated sources (e.g. Iconify collections),
// and to reject paint-server fills instead of degrading them to black.
import { flattenSvg } from './flatten/index'
import { mergeSameColorPaths } from './glyph/merge'
import { parseFlattenedSvg, type ParsedPath } from './glyph/parse'
import { preprocessSvg, validateSvg } from './glyph/validate'
import { convertEvenoddToWinding } from './pathkit/evenodd'
import type { PathKitModule } from './pathkit/types'
import type { NanoLogger } from './types'

export type PreparedSvg = {
	viewBox: [number, number, number, number]
	/** Z-ordered, same-color-merged, nonzero-winding layers. */
	paths: ParsedPath[]
}

/**
 * Fill values that reference a paint server (`url(#…)`) cannot be expressed
 * as font glyph layers — a solid-color glyph has no gradient or pattern stop
 * representation. Reject rather than silently painting black.
 */
function assertNoPaintServers(paths: ParsedPath[], fileLabel: string): void {
	for (const p of paths) {
		if (p.fill && p.fill.includes('url(')) {
			throw new Error(
				`${fileLabel} uses a paint-server fill ("${p.fill}"); gradients and patterns cannot be compiled to font glyphs`,
			)
		}
	}
}

/**
 * Shared per-file SVG prep: validate → preprocess → flatten → parse →
 * evenodd convert → same-color merge. Returns null for unsupported SVGs
 * (logged as a warning); throws for inputs that cannot be converted.
 */
export async function prepareSvgLayers(opts: {
	svg: string
	/** Label used in log messages, e.g. `"MyIcons:heart.svg"`. */
	fileLabel: string
	pathkit: PathKitModule
	logger?: NanoLogger
}): Promise<PreparedSvg | null> {
	const { svg, fileLabel, pathkit, logger } = opts

	const validation = validateSvg(svg)
	if (validation.valid === false) {
		logger?.warn(`${fileLabel} skipped: ${validation.reason}`)
		return null
	}

	const preprocessed = preprocessSvg(svg)

	let flattenedSvg: string
	try {
		flattenedSvg = flattenSvg(preprocessed, pathkit)
	} catch (err) {
		throw new Error(
			`${fileLabel} failed to flatten: ${err instanceof Error ? err.message : String(err)}`,
			{ cause: err },
		)
	}

	const parsed = parseFlattenedSvg(flattenedSvg, {
		onSanitize: (original) => {
			logger?.info(
				`  ⚠ ${fileLabel} sanitized path: path was missing initial moveto (prepended M from endpoint)`,
			)

			logger?.info(`    Original: ${original.slice(0, 80)}…`)
		},
		onMissingViewBox: (assumed) => {
			logger?.warn(`${fileLabel} has no viewBox; assuming [${assumed.join(' ')}]`)
		},
	})

	assertNoPaintServers(parsed.paths, fileLabel)

	// Convert evenodd to nonzero winding with our containment-based
	// algorithm. Mark as noMerge — compound paths with holes must stay
	// separate so their CW hole contours don't cancel adjacent paths' CCW
	// contours.
	for (const p of parsed.paths) {
		if (p.fillRule === 'evenodd') {
			logger?.info(`  ↻ ${fileLabel} converting evenodd path to nonzero winding`)

			p.d = convertEvenoddToWinding(pathkit, p.d)
			delete p.fillRule
			p.noMerge = true
		}
	}

	const mergedPaths = mergeSameColorPaths(parsed.paths, logger)

	return { viewBox: parsed.viewBox, paths: mergedPaths }
}

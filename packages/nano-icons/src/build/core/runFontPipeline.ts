// Ported from react-native-nano-icons (MIT, © Software Mansion) — font
// pipeline orchestration. Adapted: sequential icon preparation (the upstream
// worker pool and disk cache are dropped), inputs arrive as name+SVG pairs so
// callers can feed a directory or generated sources, and the skipped-icon
// list is reported in the result.
import path from 'node:path'

import {
	compileTtfFromGlyphs,
	compileWoff2FromTtf,
	parseCompileTtfFromGlyphsError,
	type FontGlyph,
} from './font/compile'

import { buildFontFamily } from './fontIdentity'
import type { GlyphLayer, NanoGlyphMap, NanoLogger } from './types'
import { ensureDir, writeFileAtomic, type PipelineConfig } from './config'
import { loadPathKit } from './pathkit/load'
import { prepareIcon, type IconResult } from './prepareIcon'

export type SvgInput = {
	/** File name for labeling (`name.svg`); the `.svg` suffix is stripped for the icon name. */
	file: string
	svg: string
}

export type PipelineResult = {
	ttfPath: string
	glyphmapPath: string
	family: string
	woff2Path?: string
	glyphMap: NanoGlyphMap
	/** Icons included in the font, in codepoint order. */
	icons: string[]
	/** Icon names that were validated out or produced no paint. */
	skipped: { file: string; reason: string }[]
}

const SKIP_REASONS = /skipped:|produced no glyphs/

/**
 * Run the font pipeline: prepared SVG layers → placement → glyphs → TTF +
 * glyphmap (+ WOFF2 when `config.web`). The PathKit WASM instance is shared
 * across calls.
 */
export async function runFontPipeline(
	config: PipelineConfig,
	paths: { outputDir: string },
	inputs: SvgInput[],
	options?: {
		logger?: NanoLogger
		inputHash?: string
	},
): Promise<PipelineResult> {
	const startTime = Date.now()
	const logger = options?.logger

	logger?.update(`Building "${config.fontFamily}"…`)

	ensureDir(paths.outputDir)

	const inputHash = options?.inputHash
	const family = inputHash ? buildFontFamily(config.fontFamily, inputHash) : config.fontFamily

	const glyphMap: NanoGlyphMap = {
		m: {
			f: family,
			u: config.upm,
			z: config.safeZone,
			s: config.startUnicode,
			...(config.web ? { w: true as const } : {}),
		},
		i: {},
	}

	let currentUnicode = config.startUnicode
	const codepointToIcon = new Map<number, string>()
	const allGlyphs: FontGlyph[] = []
	const failed: string[] = []
	const skipped: { file: string; reason: string }[] = []

	const pathkit = await loadPathKit()

	for (const input of inputs) {
		const result: IconResult = await prepareIcon(
			{
				file: input.file,
				svg: input.svg,
				fontFamily: config.fontFamily,
				upm: config.upm,
				safeZone: config.safeZone,
			},
			pathkit,
		)

		for (const [level, msg] of result.logs) {
			logger?.[level](msg)
		}

		if (result.error !== null) {
			logger?.fail(result.error)
			failed.push(result.file)
			continue
		}

		if (result.layers.length === 0) {
			skipped.push({
				file: result.file,
				reason:
					result.logs
						.filter(([, msg]) => SKIP_REASONS.test(msg))
						.map(([, msg]) => msg)
						.at(-1) ?? 'no paintable layers',
			})

			continue
		}

		const layers: GlyphLayer[] = []
		for (const layer of result.layers) {
			const cp = currentUnicode++
			codepointToIcon.set(cp, result.iconName)
			allGlyphs.push({
				codepoint: cp,
				advanceWidth: result.adv,
				d: layer.d,
			})

			layers.push([cp, layer.fill || 'black'])
		}

		glyphMap.i[result.iconName] = [result.adv, layers]
	}

	if (failed.length) {
		throw new Error(
			`${failed.length} of ${inputs.length} icons in [${config.fontFamily}] could not be converted: ${failed.join(', ')}`,
		)
	}

	logger?.info(`Compiling TTF…`)
	const ttfPath = path.join(paths.outputDir, `${family}.ttf`)

	let ttfBuffer: Buffer | undefined
	try {
		ttfBuffer = await compileTtfFromGlyphs({
			glyphs: allGlyphs,
			outTtfPath: ttfPath,
			fontName: family,
			upm: config.upm,
			ascent: config.upm,
			descent: 0,
		})
	} catch (err: unknown) {
		parseCompileTtfFromGlyphsError(err, codepointToIcon)
	}

	let woff2Path: string | undefined
	if (config.web && ttfBuffer) {
		logger?.info(`Compiling WOFF2…`)
		woff2Path = path.join(paths.outputDir, `${family}.woff2`)
		writeFileAtomic(woff2Path, await compileWoff2FromTtf(ttfBuffer))
	}

	const glyphmapPath = path.join(paths.outputDir, `${family}.glyphmap.json`)

	if (inputHash) {
		glyphMap.m.h = inputHash
	}

	writeFileAtomic(glyphmapPath, JSON.stringify(glyphMap))

	const iconCount = Object.keys(glyphMap.i).length
	const elapsed = Date.now() - startTime
	const products = woff2Path ? `${family}.ttf + ${family}.woff2` : `${family}.ttf`

	logger?.succeed(
		`Built ${products} [${iconCount} icon${iconCount === 1 ? '' : 's'} in ${elapsed}ms]`,
	)

	return {
		ttfPath,
		glyphmapPath,
		family,
		woff2Path,
		glyphMap,
		icons: Object.keys(glyphMap.i),
		skipped,
	}
}

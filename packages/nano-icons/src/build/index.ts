// Public build entry for @octane-xplat/nano-icons: compile a directory of
// SVG icons — or Iconify collections — into a layered TTF font + typed
// glyph map + a generated runtime module.
//
// The geometry pipeline (validate → flatten → color layers → placement →
// quadratic outlines → svg2ttf → metrics fixup) is ported from
// react-native-nano-icons (MIT, © Software Mansion); see
// packages/nano-icons/LICENSES.md and src/build/core for attribution.
import crypto from 'node:crypto'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import type { IconifyJSON } from '@iconify/types'

import { iconifyCollectionToSvgs } from './iconify'
import { emitNanoIconSetModule } from './module'
import { ensureDir, writeFileAtomic, type PipelineConfig } from './core/config'
import { runFontPipeline, type SvgInput } from './core/runFontPipeline'
import type { NanoGlyphMap, NanoLogger } from './core/types'

export type { NanoGlyphMap, NanoLogger } from './core/types'
export { iconifyCollectionToSvgs } from './iconify'
export { runFontPipeline } from './core/runFontPipeline'
export { loadPathKit } from './core/pathkit/load'

export const DEFAULT_UPM = 1024
export const DEFAULT_SAFE_ZONE = 1020
export const DEFAULT_START_UNICODE = 0xe900

export interface NanoIconFontOptions {
	/** Flat directory of `.svg` files; each file becomes one icon named by its basename. */
	inputDir?: string
	/** Explicit SVG documents, e.g. produced by `iconifyCollectionToSvgs`. */
	icons?: { name: string; svg: string }[]
	/** Iconify collections — converted to SVG via `iconifyCollectionToSvgs`. */
	iconify?: IconifyJSON[]
	/** Output directory for the font, glyphmap and generated module. */
	outputDir: string
	/** Configured set name; the emitted family is `<fontFamily>-<hash8>`. */
	fontFamily?: string
	/** Units per em. Default 1024. */
	upm?: number
	/** Glyph safe zone in font units. Default 1020. */
	safeZone?: number
	/** First codepoint (default 0xe900, private use area). */
	startUnicode?: number | string
	/** Also emit `<family>.woff2` beside the TTF. Default true. */
	web?: boolean
	/** Emit `<fontFamily>.ts` runtime module. Default true. */
	module?: boolean
	/** Optional app fonts directory (e.g. `app/fonts`) to copy the TTF into for iOS/Android. */
	appFontsDir?: string
	logger?: NanoLogger
}

export interface NanoIconFontResult {
	/** Configured set name (e.g. `MyIcons`). */
	fontFamily: string
	/** Runtime family and emitted file basename (`<fontFamily>-<hash8>`). */
	family: string
	ttfPath: string
	woff2Path?: string
	glyphmapPath: string
	modulePath?: string
	/** Icon names included in the font, in glyphmap order. */
	icons: string[]
	/** Icons that produced no glyph, with the rejection reason. */
	skipped: { file: string; reason: string }[]
	glyphMap: NanoGlyphMap
	/** True when the existing output already matched the input fingerprint. */
	unchanged: boolean
}

function generatorVersion(): string {
	try {
		const req = createRequire(import.meta.url)
		const packageJsonPath = req.resolve('@octane-xplat/nano-icons/package.json')
		const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
			version?: string
		}

		return `@octane-xplat/nano-icons@${pkg.version ?? 'unknown'}`
	} catch {
		return '@octane-xplat/nano-icons@unknown'
	}
}

function parseStartUnicode(value: number | string | undefined): number {
	if (value === undefined) {
		return DEFAULT_START_UNICODE
	}

	if (typeof value === 'number') {
		return value
	}

	const parsed = value.startsWith('0x') ? parseInt(value, 16) : parseInt(value, 10)

	if (!Number.isInteger(parsed) || parsed < 0 || parsed > 0x10ffff) {
		throw new RangeError(`Invalid startUnicode "${value}"`)
	}

	return parsed
}

/** sha256 over sorted inputs + pipeline settings + generator version. */
function fingerprintInputs(inputs: SvgInput[], settings: unknown[]): string {
	const hash = crypto.createHash('sha256')
	for (const input of [...inputs].sort((a, b) => a.file.localeCompare(b.file))) {
		hash.update(input.file)
		hash.update(input.svg)
	}

	hash.update(JSON.stringify(settings))
	return hash.digest('hex')
}

/**
 * Build a layered icon font. Returns the emitted artifacts; throws if any
 * icon fails to convert. Icons that pass validation but paint nothing (or
 * use features skipped by validation) are listed in `skipped`.
 */
export async function buildNanoIconFont(options: NanoIconFontOptions): Promise<NanoIconFontResult> {
	const fontFamily =
		options.fontFamily ??
		(options.inputDir ? path.basename(path.resolve(options.inputDir)) : 'nano-icons')

	const web = options.web ?? true
	const config: PipelineConfig = {
		fontFamily,
		upm: options.upm ?? DEFAULT_UPM,
		safeZone: options.safeZone ?? DEFAULT_SAFE_ZONE,
		startUnicode: parseStartUnicode(options.startUnicode),
		web,
	}

	const inputs: SvgInput[] = []
	const namedIcons = new Map<string, string>()

	if (options.inputDir) {
		const dir = path.resolve(options.inputDir)
		const files = (await fsp.readdir(dir)).filter((f) => f.toLowerCase().endsWith('.svg'))

		for (const file of files.sort()) {
			inputs.push({
				file,
				svg: await fsp.readFile(path.join(dir, file), 'utf8'),
			})
		}
	}

	for (const collection of options.iconify ?? []) {
		for (const input of iconifyCollectionToSvgs(collection)) {
			inputs.push({ file: input.file, svg: input.svg })
		}
	}

	for (const icon of options.icons ?? []) {
		if (namedIcons.has(icon.name)) {
			throw new Error(`Duplicate icon name "${icon.name}"`)
		}

		namedIcons.set(icon.name, icon.svg)
		inputs.push({ file: `${icon.name}.svg`, svg: icon.svg })
	}

	if (inputs.length === 0) {
		throw new Error('buildNanoIconFont needs at least one of inputDir, icons, or iconify')
	}

	const inputHash = fingerprintInputs(inputs, [
		config.upm,
		config.safeZone,
		config.startUnicode,
		web,
		generatorVersion(),
	])

	const family = `${config.fontFamily}-${inputHash.slice(0, 8)}`

	const outputDir = path.resolve(options.outputDir)
	const glyphmapPath = path.join(outputDir, `${family}.glyphmap.json`)
	const ttfPath = path.join(outputDir, `${family}.ttf`)
	const woff2Path = path.join(outputDir, `${family}.woff2`)

	// Incremental skip: identical inputs and settings keep the same hash.
	if (fs.existsSync(glyphmapPath) && fs.existsSync(ttfPath)) {
		const existing = JSON.parse(fs.readFileSync(glyphmapPath, 'utf8')) as NanoGlyphMap

		if (existing.m?.h === inputHash && existing.m.f === family) {
			options.logger?.info?.(`Font "${family}" is up to date — skipping`)
			const modulePath =
				options.module === false
					? undefined
					: emitNanoIconSetModule({
							outputDir,
							fontFamily,
							family,
							glyphMap: existing,
							web,
						})

			return {
				fontFamily,
				family,
				ttfPath,
				woff2Path: web && fs.existsSync(woff2Path) ? woff2Path : undefined,
				glyphmapPath,
				modulePath,
				icons: Object.keys(existing.i),
				skipped: [],
				glyphMap: existing,
				unchanged: true,
			}
		}
	}

	const result = await runFontPipeline(config, { outputDir }, inputs, {
		logger: options.logger,
		inputHash,
	})

	let modulePath: string | undefined
	if (options.module !== false) {
		modulePath = emitNanoIconSetModule({
			outputDir,
			fontFamily,
			family: result.family,
			glyphMap: result.glyphMap,
			web,
		})
	}

	if (options.appFontsDir) {
		ensureDir(options.appFontsDir)
		writeFileAtomic(
			path.join(options.appFontsDir, `${result.family}.ttf`),
			fs.readFileSync(result.ttfPath),
		)
	}

	return {
		fontFamily,
		family: result.family,
		ttfPath: result.ttfPath,
		woff2Path: result.woff2Path,
		glyphmapPath: result.glyphmapPath,
		modulePath,
		icons: result.icons,
		skipped: result.skipped,
		glyphMap: result.glyphMap,
		unchanged: false,
	}
}

/**
 * `.nanoicons.json`-compatible config file support: `{ iconSets: [NanoIconFontOptions, …] }`.
 */
export interface NanoIconsConfig {
	iconSets?: (Omit<NanoIconFontOptions, 'outputDir' | 'appFontsDir'> & {
		outputDir?: string
		appFontsDir?: string
	})[]
}

export function loadNanoIconsConfig(configRoot: string): NanoIconsConfig {
	const configPath = path.join(configRoot, '.nanoicons.json')
	if (!fs.existsSync(configPath)) {
		throw new Error(
			`No .nanoicons.json found at ${configRoot}. Create one with:\n` +
				`{ "iconSets": [{ "inputDir": "assets/icons", "fontFamily": "MyIcons", "outputDir": "src/generated/icons" }] }`,
		)
	}

	return JSON.parse(fs.readFileSync(configPath, 'utf8')) as NanoIconsConfig
}

/** Run every icon set in a config file; returns per-set results. */
export async function buildAllNanoIconFonts(
	config: NanoIconsConfig,
	configRoot: string,
	logger?: NanoLogger,
): Promise<NanoIconFontResult[]> {
	if (!config.iconSets?.length) {
		throw new Error('Config must contain an "iconSets" array with at least one entry')
	}

	const results: NanoIconFontResult[] = []
	for (const set of config.iconSets) {
		results.push(
			await buildNanoIconFont({
				...set,
				outputDir: path.resolve(configRoot, set.outputDir ?? 'nano-icons'),
				inputDir: set.inputDir ? path.resolve(configRoot, set.inputDir) : undefined,
				appFontsDir: set.appFontsDir ? path.resolve(configRoot, set.appFontsDir) : undefined,
				logger,
			}),
		)
	}

	return results
}

import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	writeFileSync,
} from 'node:fs'

import { basename, extname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { inflateSync } from 'node:zlib'
import { spawnSync } from 'node:child_process'

export const FONT_EXTENSIONS = new Set(['.ttf', '.otf'])
const CONVERTIBLE_EXTENSIONS = new Set(['.woff', '.woff2'])
const WEB_ENTRIES = ['main.web.tsrx', 'main.web.tsx', 'main.web.ts', 'main.web.mjs', 'main.web.js']
const MANIFEST = 'fonts.json'

const GENERIC_FALLBACKS = {
	sans: ['system-ui', 'sans-serif'],
	mono: ['ui-monospace', 'monospace'],
	serif: ['serif'],
}

// Tailwind weight utility names — Android resolves font-family by filename,
// so a weight-correct family list has to ride the same rule that sets
// font-weight. Utilities are the only shared carrier of weight.
const WEIGHT_UTILITY = {
	100: 'font-thin',
	200: 'font-extralight',
	300: 'font-light',
	400: 'font-normal',
	500: 'font-medium',
	600: 'font-semibold',
	700: 'font-bold',
	800: 'font-extrabold',
	900: 'font-black',
}

const managedStart = (token) => `/* xplat-fonts:${token}:start */`
const managedEnd = (token) => `/* xplat-fonts:${token}:end */`

const decodeName = (platformID, raw) => {
	if (platformID === 0 || platformID === 3) {
		// Copy before swap16 — it mutates, and `raw` is a subarray view into
		// the source font buffer; swapping in place corrupts the font.
		return Buffer.from(raw).swap16().toString('utf16le')
	}

	return raw.toString('latin1')
}

const rankName = ({ platformID, languageID }) => {
	if (platformID === 3 && languageID === 0x409) {
		return 0
	}

	if (platformID === 3) {
		return 1
	}

	if (platformID === 0) {
		return 2
	}

	if (platformID === 1) {
		return 3
	}

	return 4
}

function pickName(records, nameIDs) {
	for (const nameID of nameIDs) {
		const candidates = records.filter((r) => r.nameID === nameID && r.value)

		if (candidates.length) {
			candidates.sort((a, b) => rankName(a) - rankName(b))
			return candidates[0].value
		}
	}

	return undefined
}

function tableDirectory(buf) {
	let dirOffset = 0
	if (buf.toString('latin1', 0, 4) === 'ttcf') {
		if (buf.length < 16) {
			return null
		}

		dirOffset = buf.readUInt32BE(12)
	}

	if (dirOffset + 4 > buf.length) {
		return null
	}

	const numTables = buf.readUInt16BE(dirOffset + 4)
	const tables = new Map()
	for (let i = 0; i < numTables; i++) {
		const rec = dirOffset + 12 + i * 16
		if (rec + 16 > buf.length) {
			return null
		}

		tables.set(buf.toString('latin1', rec, rec + 4), {
			offset: buf.readUInt32BE(rec + 8),
			length: buf.readUInt32BE(rec + 12),
		})
	}

	return tables
}

function readNameRecords(buf, table) {
	const base = table.offset
	if (base + 6 > buf.length) {
		return []
	}

	const count = buf.readUInt16BE(base + 2)
	const stringBase = base + buf.readUInt16BE(base + 4)
	const records = []
	for (let i = 0; i < count; i++) {
		const rec = base + 6 + i * 12
		if (rec + 12 > buf.length) {
			break
		}

		const platformID = buf.readUInt16BE(rec)
		const encodingID = buf.readUInt16BE(rec + 2)
		const languageID = buf.readUInt16BE(rec + 4)
		const nameID = buf.readUInt16BE(rec + 6)
		const length = buf.readUInt16BE(rec + 8)
		const offset = buf.readUInt16BE(rec + 10)
		const start = stringBase + offset
		if (start + length > buf.length) {
			continue
		}

		const value = decodeName(platformID, buf.subarray(start, start + length))
			.replaceAll('\x00', '')
			.trim()

		records.push({ platformID, encodingID, languageID, nameID, value })
	}

	return records
}

const fixedToNumber = (v) => {
	const n = v / 65536
	const rounded = Math.round(n)
	return Math.abs(n - rounded) < 0.01 ? rounded : Math.round(n * 100) / 100
}

function readWghtAxis(buf, tables) {
	const fvar = tables.get('fvar')
	if (!fvar || fvar.offset + 16 > buf.length) {
		return null
	}

	const axesOffset = fvar.offset + buf.readUInt16BE(fvar.offset + 4)
	const axisCount = buf.readUInt16BE(fvar.offset + 8)
	const axisSize = buf.readUInt16BE(fvar.offset + 10)
	for (let i = 0; i < axisCount; i++) {
		const rec = axesOffset + i * axisSize
		if (rec + 20 > buf.length || rec + 20 > fvar.offset + fvar.length) {
			break
		}

		if (buf.toString('latin1', rec, rec + 4) === 'wght') {
			return {
				min: fixedToNumber(buf.readInt32BE(rec + 4)),
				max: fixedToNumber(buf.readInt32BE(rec + 12)),
			}
		}
	}

	return null
}

// Family, PostScript name, and weight metadata straight from the sfnt tables —
// `ns fonts` shells out for the same data; keeping it in-process lets the
// command run in apps that never installed the platform toolchains.
export function parseFontBuffer(buf) {
	const tables = tableDirectory(buf)
	if (!tables || !tables.has('name')) {
		return { family: undefined, postscript: undefined, wght: null, weightClass: undefined }
	}

	const records = readNameRecords(buf, tables.get('name'))
	const os2 = tables.get('OS/2')
	return {
		family: pickName(records, [16, 1]),
		postscript: pickName(records, [6]),
		wght: readWghtAxis(buf, tables),
		weightClass: os2 && os2.offset + 6 <= buf.length ? buf.readUInt16BE(os2.offset + 4) : undefined,
	}
}

export function readFontInfo(file) {
	return parseFontBuffer(readFileSync(file))
}

const checksum = (buf) => {
	let sum = 0
	for (let i = 0; i < buf.length; i += 4) {
		sum = (sum + buf.readUInt32BE(i)) % 0x100000000
	}

	return sum
}

// Rebuild an sfnt (TTF/OTF) from {tag, data} tables for the WOFF inflater.
// Recomputes directory checksums and the head checkSumAdjustment.
function buildSfnt(flavor, tables) {
	tables.sort((a, b) => (a.tag < b.tag ? -1 : 1))

	const n = tables.length
	const maxPow2 = 2 ** Math.floor(Math.log2(n))
	const out = Buffer.alloc(
		12 + n * 16 + tables.reduce((s, t) => s + Math.ceil(t.data.length / 4) * 4, 0),
	)

	out.writeUInt32BE(flavor, 0)
	out.writeUInt16BE(n, 4)
	out.writeUInt16BE(maxPow2 * 16, 6)
	out.writeUInt16BE(Math.log2(maxPow2), 8)
	out.writeUInt16BE(n * 16 - maxPow2 * 16, 10)

	let cursor = 12 + n * 16
	tables.forEach((t, i) => {
		const rec = 12 + i * 16
		out.write(t.tag, rec, 'latin1')
		out.writeUInt32BE(
			checksum(
				t.data.length % 4 ? Buffer.concat([t.data, Buffer.alloc(4 - (t.data.length % 4))]) : t.data,
			),
			rec + 4,
		)

		out.writeUInt32BE(cursor, rec + 8)
		out.writeUInt32BE(t.data.length, rec + 12)
		t.data.copy(out, cursor)
		cursor += Math.ceil(t.data.length / 4) * 4
	})

	// head.checkSumAdjustment must read zero while the whole font is summed.
	const headIdx = tables.findIndex((t) => t.tag === 'head')
	if (headIdx !== -1) {
		const headOffset = out.readUInt32BE(12 + headIdx * 16 + 8)
		out.writeUInt32BE(0, headOffset + 8)
		out.writeUInt32BE((0xb1b0afba - checksum(out)) >>> 0, headOffset + 8)
	}

	return out
}

// WOFF v1 is zlib-deflated sfnt tables — inflate and rebuild the sfnt
// directory so NativeScript's ttf/otf-only registration accepts the file.
export function woffToSfnt(buf) {
	if (buf.length < 44 || buf.toString('latin1', 0, 4) !== 'wOFF') {
		throw new Error('not a WOFF file')
	}

	const flavor = buf.readUInt32BE(4)
	const numTables = buf.readUInt16BE(12)
	const tables = []
	for (let i = 0; i < numTables; i++) {
		const rec = 44 + i * 20
		if (rec + 20 > buf.length) {
			throw new Error('truncated WOFF table directory')
		}

		const tag = buf.toString('latin1', rec, rec + 4)
		const offset = buf.readUInt32BE(rec + 4)
		const compLen = buf.readUInt32BE(rec + 8)
		const origLen = buf.readUInt32BE(rec + 12)
		const checkSum = buf.readUInt32BE(rec + 16)
		if (offset + compLen > buf.length) {
			throw new Error(`truncated WOFF table ${tag}`)
		}

		const packed = buf.subarray(offset, offset + compLen)
		const data = compLen < origLen ? inflateSync(packed) : Buffer.from(packed)
		if (data.length !== origLen) {
			throw new Error(`WOFF table ${tag} inflated to ${data.length}, expected ${origLen}`)
		}

		tables.push({ tag, checkSum, data })
	}

	return buildSfnt(
		flavor,
		tables.map(({ tag, data }) => ({ tag, data })),
	)
}

// WOFF2 adds brotli + glyf transforms — defer to the wasm build of Google's
// converter rather than re-implementing reconstruction.
export async function woff2ToSfnt(buf) {
	const mod = await import('wawoff2')
	const decompress = mod.default?.decompress ?? mod.decompress
	return Buffer.from(await decompress(buf))
}

export async function toSfnt(file) {
	const buf = readFileSync(file)
	const ext = extname(file).toLowerCase()
	if (ext === '.woff') {
		return woffToSfnt(buf)
	}

	if (ext === '.woff2') {
		return woff2ToSfnt(buf)
	}

	throw new Error(`cannot convert ${ext}`)
}

const sanitizeFileBase = (name) => name.replace(/[^A-Za-z0-9._-]/g, '-')

// Stages one source font as a .ttf under `stagingDir`. destName defaults to
// the font's PostScript name so Android's filename-based lookup stays
// readable; local file inputs keep their own basename instead.
async function stageAsTtf(sourcePath, stagingDir, destName) {
	const ext = extname(sourcePath).toLowerCase()
	const sfnt = FONT_EXTENSIONS.has(ext) ? readFileSync(sourcePath) : await toSfnt(sourcePath)
	const info = parseFontBuffer(sfnt)
	const name = destName ?? sanitizeFileBase(info.postscript ?? basename(sourcePath, ext)) + '.ttf'
	const staged = join(stagingDir, name)
	writeFileSync(staged, sfnt)
	return { staged, destName: name, info }
}

const webFamilyFromCss = (cssPath) => {
	if (!existsSync(cssPath)) {
		return undefined
	}

	const match = readFileSync(cssPath, 'utf8').match(/font-family:\s*'([^']+)'/)
	return match?.[1]
}

const isFontsourceSpec = (input) => /^@fontsource(-variable)?\/[^/\s]+$/.test(input)

// Resolves a Fontsource package (installing it when absent), selects the
// faces for the requested subset/weights, and stages converted .ttf copies.
// Returns null-ish { error } on failure.
export async function prepareFontsource(appDir, spec, { subset = 'latin', weights, install } = {}) {
	const variable = spec.startsWith('@fontsource-variable/')
	if (!isFontsourceSpec(spec)) {
		return { error: `unsupported package ${spec} — only @fontsource/* and @fontsource-variable/*` }
	}

	// Prefer the direct node_modules path — Fontsource `exports` maps don't
	// always re-export ./package.json, and pnpm links deps at this location.
	let pkgDir = join(appDir, 'node_modules', ...spec.split('/'))
	let wasInstalled = false
	if (!existsSync(join(pkgDir, 'package.json'))) {
		if (!install) {
			return { error: `${spec} is not installed — run \`pnpm add ${spec}\` or pass --install` }
		}

		const added = spawnSync('pnpm', ['add', spec], { cwd: appDir, stdio: 'inherit' })
		if (added.status !== 0) {
			return { error: `pnpm add ${spec} failed` }
		}

		if (!existsSync(join(pkgDir, 'package.json'))) {
			return { error: `${spec} still not resolvable after install` }
		}

		wasInstalled = true
	}

	const filesDir = join(pkgDir, 'files')
	if (!existsSync(filesDir)) {
		return { error: `${spec} has no files/ directory — not a Fontsource layout` }
	}

	// <base>-<subset>-<axis-or-weight>-<style>.<ext> — subset and base can both
	// carry hyphens ('latin-ext', 'open-sans'), so anchor on the package name
	// prefix and split the tail from the right.
	const base = spec.split('/').pop()
	const parts = (f) => {
		if (!f.startsWith(`${base}-`)) {
			return null
		}

		const segs = f
			.replace(/\.(woff2?|ttf|otf)$/, '')
			.slice(base.length + 1)
			.split('-')

		return segs.length >= 3
			? { subset: segs.slice(0, -2).join('-'), key: segs.at(-2), style: segs.at(-1), file: f }
			: null
	}

	const listing = readdirSync(filesDir).map(parts).filter(Boolean)
	const stagingDir = mkdtempSync(join(tmpdir(), 'xplat-fonts-'))

	if (variable) {
		// 'wght' is the weight-axis file; 'standard'/'full' carry every axis.
		const axisPreference = ['wght', 'standard', 'full']
		const candidates = listing.filter(
			(f) => f.subset === subset && f.style === 'normal' && /\.woff2?$/.test(f.file),
		)

		const picked =
			axisPreference.map((axis) => candidates.find((f) => f.key === axis)).find(Boolean) ??
			candidates[0]

		if (!picked) {
			const subsets = [...new Set(listing.map((f) => f.subset))].join(', ')
			return { error: `${spec}: no ${subset}/normal face in files/ (subsets: ${subsets})` }
		}

		const face = await stageAsTtf(join(filesDir, picked.file), stagingDir)
		const cssPath = join(pkgDir, `${picked.key}.css`)
		return {
			faces: [face],
			webImports: [`@import '${spec}/${picked.key}.css';`],
			webFamily: webFamilyFromCss(cssPath),
			installed: install && wasInstalled ? spec : undefined,
		}
	}

	const weightsWanted = weights?.length ? new Set(weights.map(Number)) : null
	const candidates = listing.filter(
		(f) =>
			f.subset === subset &&
			f.style === 'normal' &&
			/^\d+$/.test(f.key) &&
			(!weightsWanted || weightsWanted.has(Number(f.key))),
	)

	// Prefer .woff sources (zlib-only inflate); woff2-only packages take woff2.
	const faces = candidates.filter((f) => f.file.endsWith('.woff'))
	const chosen = faces.length ? faces : candidates.filter((f) => f.file.endsWith('.woff2'))
	if (!chosen.length) {
		return {
			error: `${spec}: no ${subset}/normal faces for weights ${weights?.join(',') ?? '(any)'}`,
		}
	}

	const staged = []
	const webImports = []
	for (const f of chosen) {
		const face = await stageAsTtf(join(filesDir, f.file), stagingDir)
		staged.push({ ...face, weight: Number(f.key) })
		webImports.push(`@import '${spec}/${subset}-${f.key}.css';`)
	}

	return {
		faces: staged,
		webImports,
		webFamily: webFamilyFromCss(join(pkgDir, `${subset}-${chosen[0].key}.css`)),
		installed: install && wasInstalled ? spec : undefined,
	}
}

const quoteList = (names) => [...new Set(names)].map((n) => `'${n.replace(/'/g, "\\'")}'`)

function managedBlock(token, faces, genericFallbacks) {
	const varName = `--font-${token}`
	const names = faces.flatMap((f) => f.names)
	const list = [...quoteList(names), ...genericFallbacks].join(', ')
	const rules = [`:root,\n.ns-root {\n\t${varName}: ${list};\n}`]

	if (token === 'sans') {
		const defaults = faces.find((f) => f.weight === 400) ?? faces[0]
		// Literal list on the native root — harness-proven; var() in font-family
		// is not assumed to resolve on the NS css adapter.
		rules.push(
			`.ns-root {\n\tfont-family: ${[...quoteList(defaults.names), genericFallbacks.at(-1)].join(', ')};\n}`,
			`body {\n\tfont-family: var(${varName}, system-ui, sans-serif);\n}`,
		)
	}

	// Android looks font files up by filename inside the same rule's
	// font-family — for static (non-variable) faces, weight-correct text needs
	// a family list pointing at that weight's file. Variable faces resolve
	// weight through the wght axis and need no per-weight rule.
	const staticFaces = faces.filter(
		(f) => !f.variable && Number.isInteger(f.weight) && WEIGHT_UTILITY[f.weight],
	)

	for (const face of staticFaces) {
		rules.push(
			`.${WEIGHT_UTILITY[face.weight]} {\n\tfont-family: ${quoteList(face.names).join(', ')};\n}`,
		)
	}

	return `${managedStart(token)}\n${rules.join('\n\n')}\n${managedEnd(token)}`
}

function upsertManagedBlock(css, token, block) {
	const start = css.indexOf(managedStart(token))
	const end = css.indexOf(managedEnd(token))
	if (start !== -1 && end !== -1 && end > start) {
		return css.slice(0, start) + block + css.slice(end + managedEnd(token).length)
	}

	return `${css.trimEnd()}\n\n${block}\n`
}

function ensureWebImport(entrySource) {
	if (entrySource.includes(`'./fonts.css'`) || entrySource.includes('"./fonts.css"')) {
		return { source: entrySource, changed: false }
	}

	const lines = entrySource.split('\n')
	const styleLine = lines.findIndex((l) => /^import\s+['"].*style\.css['"]/.test(l))
	if (styleLine !== -1) {
		lines.splice(styleLine + 1, 0, `import './fonts.css';`)
		return { source: lines.join('\n'), changed: true }
	}

	let lastImport = -1
	for (let i = 0; i < lines.length; i++) {
		if (/^import\s/.test(lines[i])) {
			lastImport = i
		}
	}

	if (lastImport !== -1) {
		lines.splice(lastImport + 1, 0, `import './fonts.css';`)
		return { source: lines.join('\n'), changed: true }
	}

	return { source: `import './fonts.css';\n${entrySource}`, changed: true }
}

function appSourceDir(appDir) {
	const configPath = join(appDir, 'nativescript.config.ts')
	if (existsSync(configPath)) {
		const match = readFileSync(configPath, 'utf8').match(/appPath:\s*['"]([^'"]+)['"]/)
		if (match) {
			return join(appDir, match[1])
		}
	}

	return join(appDir, 'src')
}

const readManifest = (fontsDir) => {
	const manifestPath = join(fontsDir, MANIFEST)
	if (!existsSync(manifestPath)) {
		return { tokens: {} }
	}

	try {
		return JSON.parse(readFileSync(manifestPath, 'utf8'))
	} catch {
		return { tokens: {} }
	}
}

// Registers staged .ttf files ({staged, destName, info, weight?}) for web
// (@font-face or a package @import) and NativeScript (src/fonts + family
// list), then upserts the --font-* token block in style.css from a manifest
// of everything registered so far. `xplat fonts add` drives both callers:
// local files stage through stageAsTtf; Fontsource packages through
// prepareFontsource.
export function addFont(appDir, stagedFaces, { token = 'sans', webImports = [], webFamily } = {}) {
	const report = {
		copied: [],
		faces: [],
		edited: [],
		names: { family: undefined, ios: [], android: [] },
		warnings: [],
	}

	if (!existsSync(join(appDir, 'package.json'))) {
		return { error: `no package.json in ${appDir} — pass --dir <app root>` }
	}

	const srcDir = appSourceDir(appDir)
	if (!existsSync(srcDir)) {
		return { error: `no app source directory at ${srcDir}` }
	}

	if (!stagedFaces.length) {
		return { error: 'nothing to register' }
	}

	const family = stagedFaces[0].info.family
	report.names.family = family

	const fontsDir = join(srcDir, 'fonts')
	mkdirSync(fontsDir, { recursive: true })

	const manifest = readManifest(fontsDir)
	manifest.tokens[token] ??= { faces: [], webImports: [] }
	const state = manifest.tokens[token]

	for (const face of stagedFaces) {
		const target = join(fontsDir, face.destName)
		if (!existsSync(target)) {
			copyFileSync(face.staged, target)
			report.copied.push(face.destName)
		}

		const fileBase = face.destName.replace(/\.ttf$/, '')
		const names = [webFamily, face.info.family, face.info.postscript, fileBase].filter(Boolean)
		const entry = {
			file: face.destName,
			weight: Number(face.weight ?? face.info.weightClass ?? 400),
			variable: Boolean(face.info.wght),
			names,
		}

		if (!state.faces.some((f) => f.file === entry.file && f.weight === entry.weight)) {
			state.faces.push(entry)
		}

		report.names.ios.push(face.info.postscript, face.info.family)
		report.names.android.push(fileBase)
		report.faces.push({
			file: face.destName,
			weight: face.info.wght ? `${face.info.wght.min} ${face.info.wght.max}` : String(entry.weight),
			variable: entry.variable,
			imported: Boolean(face.fromPackage),
		})
	}

	for (const imp of webImports) {
		if (!state.webImports.includes(imp)) {
			state.webImports.push(imp)
		}
	}

	writeFileSync(join(fontsDir, MANIFEST), JSON.stringify(manifest, null, '\t') + '\n')
	report.edited.push(`fonts/${MANIFEST}`)

	// Web faces — package adds import the package's own CSS (it already emits
	// per-subset @font-face with unicode-range); local files get our block.
	const fontsCssPath = join(srcDir, 'fonts.css')
	let fontsCss = existsSync(fontsCssPath)
		? readFileSync(fontsCssPath, 'utf8')
		: '/* @font-face faces generated by `xplat fonts add`. Web-only — the native\n * bundles resolve the same families from src/fonts. */\n'

	let fontsCssChanged = false

	for (const imp of state.webImports) {
		if (!fontsCss.includes(imp)) {
			fontsCss = `${fontsCss.trimEnd()}\n\n${imp}\n`
			fontsCssChanged = true
		}
	}

	for (const face of stagedFaces) {
		if (face.fromPackage) {
			continue
		}

		if (fontsCss.includes(`./fonts/${face.destName}`)) {
			report.warnings.push(`${face.destName} — @font-face already registered`)
			continue
		}

		const weightCss = face.info.wght
			? `${face.info.wght.min} ${face.info.wght.max}`
			: String(face.weight ?? face.info.weightClass ?? 400)

		fontsCss = `${fontsCss.trimEnd()}\n\n@font-face {
	font-family: '${(face.info.family ?? '').replace(/'/g, "\\'")}';
	src: url('./fonts/${face.destName}') format('truetype');
	font-style: normal;
	font-weight: ${weightCss};
	font-display: swap;
}\n`

		fontsCssChanged = true
	}

	if (fontsCssChanged || !existsSync(fontsCssPath)) {
		writeFileSync(fontsCssPath, fontsCss)
		report.edited.push('fonts.css')
	}

	// Import the faces from the web entry — native never sees this file.
	const entry = WEB_ENTRIES.map((e) => join(srcDir, e)).find((e) => existsSync(e))
	if (entry) {
		const { source, changed } = ensureWebImport(readFileSync(entry, 'utf8'))
		if (changed) {
			writeFileSync(entry, source)
			report.edited.push(basename(entry))
		}
	} else {
		report.warnings.push(
			`no web entry (${WEB_ENTRIES.join(' | ')}) in ${srcDir} — add \`import './fonts.css'\` to your web entry manually`,
		)
	}

	if (token !== 'none') {
		const stylePath = join(srcDir, 'style.css')
		if (!existsSync(stylePath)) {
			report.warnings.push(`no ${stylePath} — add the token + font-family rules manually`)
		} else {
			const generic = GENERIC_FALLBACKS[token] ?? ['sans-serif']
			const block = managedBlock(token, state.faces, generic)
			const styleCss = readFileSync(stylePath, 'utf8')
			const next = upsertManagedBlock(styleCss, token, block)
			if (next !== styleCss) {
				writeFileSync(stylePath, next)
				report.edited.push('style.css')
			}
		}
	}

	report.names.ios = [...new Set(report.names.ios.filter(Boolean))]
	report.names.android = [...new Set(report.names.android)]
	return report
}

// Splits the command's positional inputs into local files (staged to .ttf)
// and Fontsource package specs, then runs addFont once.
export async function addFontInputs(
	appDir,
	inputs,
	{ name, token, subset, weights, install } = {},
) {
	const stagingDir = mkdtempSync(join(tmpdir(), 'xplat-fonts-'))
	const staged = []
	const webImports = []
	let webFamily
	const installed = []

	for (const input of inputs) {
		if (isFontsourceSpec(input)) {
			const prepared = await prepareFontsource(appDir, input, { subset, weights, install })
			if (prepared.error) {
				return { error: prepared.error }
			}

			for (const f of prepared.faces) {
				staged.push({ ...f, fromPackage: true })
			}

			webImports.push(...prepared.webImports)
			webFamily ??= prepared.webFamily
			if (prepared.installed) {
				installed.push(prepared.installed)
			}
		} else {
			if (!existsSync(input)) {
				return { error: `no such file: ${input}` }
			}

			const ext = extname(input).toLowerCase()
			if (!FONT_EXTENSIONS.has(ext) && !CONVERTIBLE_EXTENSIONS.has(ext)) {
				return { error: `${basename(input)} — expected .ttf, .otf, .woff, or .woff2` }
			}

			staged.push(await stageAsTtf(input, stagingDir, basename(input, ext) + '.ttf'))
		}
	}

	const families = new Set(staged.map((f) => f.info.family).filter(Boolean))
	if (families.size > 1 && token !== 'none' && !name) {
		return {
			error: `inputs resolve to multiple families (${[...families].join(', ')}) — run one family per token or pass --token none`,
		}
	}

	if (name) {
		for (const f of staged) {
			f.info.family = name
		}
	}

	const report = addFont(appDir, staged, { token, webImports, webFamily })
	report.installed = installed
	return report
}

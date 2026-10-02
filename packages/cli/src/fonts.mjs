import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'

export const FONT_EXTENSIONS = new Set(['.ttf', '.otf'])
const WEB_ENTRIES = ['main.web.tsrx', 'main.web.tsx', 'main.web.ts', 'main.web.mjs', 'main.web.js']
const GENERIC_FALLBACKS = {
	sans: ['system-ui', 'sans-serif'],
	mono: ['ui-monospace', 'monospace'],
	serif: ['serif'],
}

const managedStart = (token) => `/* xplat-fonts:${token}:start */`
const managedEnd = (token) => `/* xplat-fonts:${token}:end */`

const decodeName = (platformID, raw) => {
	if (platformID === 0 || platformID === 3) {
		return raw.swap16().toString('utf16le')
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
			.replace(/\0/g, '')
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
export function readFontInfo(file) {
	const buf = readFileSync(file)
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

const quoteList = (names) => [...new Set(names)].map((n) => `'${n.replace(/'/g, "\\'")}'`)

const existingManagedNames = (css, token) => {
	const start = css.indexOf(managedStart(token))
	const end = css.indexOf(managedEnd(token))
	if (start === -1 || end === -1 || end < start) {
		return []
	}
	return [...css.slice(start, end).matchAll(/'([^']+)'/g)].map((m) => m[1])
}

function managedBlock(token, names, genericFallbacks) {
	const varName = `--font-${token}`
	const list = [...quoteList(names), ...genericFallbacks].join(', ')
	const rules = [`:root,\n.ns-root {\n\t${varName}: ${list};\n}`]
	if (token === 'sans') {
		// Literal list on the native root — harness-proven; var() in font-family
		// is not assumed to resolve on the NS css adapter.
		rules.push(
			`.ns-root {\n\tfont-family: ${[...quoteList(names), genericFallbacks.at(-1)].join(', ')};\n}`,
			`body {\n\tfont-family: var(${varName}, system-ui, sans-serif);\n}`,
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

function faceBlock({ cssFamily, fileName, format, weightCss }) {
	return `@font-face {
	font-family: '${cssFamily.replace(/'/g, "\\'")}';
	src: url('./fonts/${fileName}') format('${format}');
	font-style: normal;
	font-weight: ${weightCss};
	font-display: swap;
}`
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

// Registers font files for web (@font-face), iOS, and Android (src/fonts +
// font-family list) and wires the family onto a --font-* token. All edits are
// marked so reruns update in place; returns a report for the command layer.
export function addFont(appDir, files, { name, token = 'sans', weight } = {}) {
	const report = {
		copied: [],
		faces: [],
		edited: [],
		names: { family: name, ios: [], android: [] },
		warnings: [],
	}

	if (!existsSync(join(appDir, 'package.json'))) {
		return { error: `no package.json in ${appDir} — pass --dir <app root>` }
	}

	const srcDir = appSourceDir(appDir)
	if (!existsSync(srcDir)) {
		return { error: `no app source directory at ${srcDir}` }
	}

	if (!files.length) {
		return { error: 'pass at least one .ttf/.otf file' }
	}

	for (const file of files) {
		if (!existsSync(file)) {
			return { error: `no such file: ${file}` }
		}
		if (!FONT_EXTENSIONS.has(extname(file).toLowerCase())) {
			return {
				error: `${basename(file)} — native targets need .ttf or .otf (convert .woff/.woff2 first)`,
			}
		}
	}

	const infos = files.map((file) => ({ file, info: readFontInfo(file) }))
	const family = name ?? infos.find((i) => i.info.family)?.info.family
	if (!family) {
		return { error: 'could not read a family name from the font files — pass --name <family>' }
	}

	if (!name && infos.some((i) => i.info.family && i.info.family !== family)) {
		return {
			error: `files disagree on family (${[...new Set(infos.map((i) => i.info.family))].join(', ')}) — pass --name to group them`,
		}
	}

	report.names.family = family

	// 1. Copy into the NativeScript fonts directory; `src/fonts` files are
	//    picked up automatically on iOS (internal/PostScript name) and Android
	//    (filename without extension).
	const fontsDir = join(srcDir, 'fonts')
	mkdirSync(fontsDir, { recursive: true })
	for (const { file } of infos) {
		const target = join(fontsDir, basename(file))
		copyFileSync(file, target)
		report.copied.push(basename(file))
		report.names.android.push(basename(file, extname(file)))
	}

	// 2. Web faces — one @font-face per file so static families keep their
	//    per-weight files and variable files advertise their wght range.
	const fontsCssPath = join(srcDir, 'fonts.css')
	let fontsCss = existsSync(fontsCssPath)
		? readFileSync(fontsCssPath, 'utf8')
		: '/* @font-face faces generated by `xplat fonts add`. Web-only — the native\n * bundles resolve the same families from src/fonts. */\n'

	let fontsCssChanged = false
	for (const { file, info } of infos) {
		const fileName = basename(file)
		if (info.postscript) {
			report.names.ios.push(info.postscript)
		}
		if (info.family) {
			report.names.ios.push(info.family)
		}
		if (fontsCss.includes(`./fonts/${fileName}`)) {
			report.warnings.push(`${fileName} — @font-face already registered`)
			continue
		}

		if (fontsCss.includes(`font-family: '${family}'`) && !weight && !info.wght) {
			report.warnings.push(
				`${fileName} — fonts.css already has a '${family}' face at the same weight; check the weights differ`,
			)
		}

		const weightCss =
			weight ?? (info.wght ? `${info.wght.min} ${info.wght.max}` : String(info.weightClass ?? 400))

		report.faces.push({ file: fileName, weight: weightCss, variable: Boolean(info.wght) })
		fontsCss = `${fontsCss.trimEnd()}\n\n${faceBlock({
			cssFamily: family,
			fileName,
			format: extname(file).toLowerCase() === '.otf' ? 'opentype' : 'truetype',
			weightCss,
		})}\n`

		fontsCssChanged = true
	}

	if (fontsCssChanged || !existsSync(fontsCssPath)) {
		writeFileSync(fontsCssPath, fontsCss)
		report.edited.push('fonts.css')
	}

	// 3. Import the faces from the web entry — native never sees this file.
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

	// 4. Token + native root wiring in the shared stylesheet. The managed block
	//    merges with earlier adds so re-running for the same token accumulates
	//    faces rather than clobbering them.
	if (token !== 'none') {
		const stylePath = join(srcDir, 'style.css')
		if (!existsSync(stylePath)) {
			report.warnings.push(`no ${stylePath} — add the token + font-family rules manually`)
		} else {
			const styleCss = readFileSync(stylePath, 'utf8')
			const fontNames = [
				...existingManagedNames(styleCss, token),
				family,
				...infos.flatMap((i) => [i.info.postscript, basename(i.file, extname(i.file))]),
			].filter(Boolean)

			const generic = GENERIC_FALLBACKS[token] ?? ['sans-serif']
			const next = upsertManagedBlock(styleCss, token, managedBlock(token, fontNames, generic))
			if (next !== styleCss) {
				writeFileSync(stylePath, next)
				report.edited.push('style.css')
			}
		}
	}

	report.names.ios = [...new Set(report.names.ios)]
	report.names.android = [...new Set(report.names.android)]
	return report
}

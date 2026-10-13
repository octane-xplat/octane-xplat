/**
 * Node-side story discovery — static, metadata-only.
 *
 * Story modules are never evaluated: this scanner reads `defineStory` option
 * literals out of the source text. `id`, `title`, and `targets` must be
 * literal values; anything computed fails with an actionable diagnostic.
 */
import { readFileSync } from 'node:fs'
import { globSync } from 'tinyglobby'

export const ALL_TARGETS = ['web', 'ios', 'android', 'macos', 'windows', 'linux']

const DEFAULT_INCLUDE = [
	'**/*.stories.{ts,tsx,tsrx,mts,mjs,js,jsx}',
	'**/*.stories.{web,mobile,ios,android,macos,windows,linux}.{ts,tsx,tsrx,mts,mjs,js,jsx}',
]

const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/dist/**', '**/types/**']

const SUFFIX_TARGETS = {
	web: ['web'],
	mobile: ['ios', 'android'],
	ios: ['ios'],
	android: ['android'],
	macos: ['macos'],
	windows: ['windows'],
	linux: ['linux'],
}

const SUFFIX_RE = /\.stories\.(web|mobile|ios|android|macos|windows|linux)\.[cm]?[jt]srx?$/

export function storyFileTag(file) {
	return SUFFIX_RE.exec(file)?.[1] ?? null
}

export function applicableTargets(declared, file) {
	const tag = storyFileTag(file)
	if (!tag) {
		return declared
	}

	const implied = SUFFIX_TARGETS[tag] ?? []
	return declared.filter((t) => implied.includes(t))
}

export function normalizeInclude(include) {
	if (include === undefined) {
		return DEFAULT_INCLUDE
	}

	return Array.isArray(include) ? [...include] : [include]
}

export function normalizeExclude(exclude) {
	const extra = exclude === undefined ? [] : Array.isArray(exclude) ? [...exclude] : [exclude]
	return [...DEFAULT_EXCLUDE, ...extra]
}

// ---------- literal source scanning ----------

/** Strip strings, template literals, and comments while preserving length. */
export function maskSource(source) {
	const out = source.split('')
	let i = 0
	const n = source.length
	const blank = (from, to) => {
		for (let k = from; k < to; k++) {
			out[k] = out[k] === '\n' ? '\n' : ' '
		}
	}

	while (i < n) {
		const ch = source[i]
		if (ch === '/' && source[i + 1] === '/') {
			let j = i
			while (j < n && source[j] !== '\n') {j++}
			blank(i, j)
			i = j
		} else if (ch === '/' && source[i + 1] === '*') {
			let j = source.indexOf('*/', i + 2)
			j = j === -1 ? n : j + 2
			blank(i, j)
			i = j
		} else if (ch === "'" || ch === '"') {
			let j = i + 1
			while (j < n) {
				if (source[j] === '\\') {j += 2}
				else if (source[j] === ch) { j++; break }
				else {j++}
			}

			j = Math.min(j, n)
			// Keep the delimiters so the slice still reads as a string shape;
			// blank the interior only.
			blank(i + 1, Math.max(i + 1, j - 1))
			i = j
		} else if (ch === '`') {
			// Keep ${ } interpolation visible (expressions are not literals);
			// blank only the literal text spans.
			let j = i + 1
			while (j < n) {
				if (source[j] === '\\') { blank(j, j + 2); j += 2 }
				else if (source[j] === '`') { j++; break }
				else if (source[j] === '$' && source[j + 1] === '{') {
					let depth = 1
					let k = j + 2
					while (k < n && depth > 0) {
						if (source[k] === '{') {depth++}
						else if (source[k] === '}') {depth--}
						else if (source[k] === "'" || source[k] === '"') {
							let q = k + 1
							while (q < n && source[q] !== source[k]) {q += source[q] === '\\' ? 2 : 1}
							k = Math.min(q + 1, n)
							continue
						}

						k++
					}

					j = k
				} else { blank(j, j + 1); j++ }
			}

			i = j
		} else {
			i++
		}
	}

	return out.join('')
}

/** Find matching close for an opening bracket at index `open` in masked text. */
function matchBracket(masked, open, openCh, closeCh) {
	let depth = 0
	for (let i = open; i < masked.length; i++) {
		const ch = masked[i]
		if (ch === openCh) {depth++}
		else if (ch === closeCh) {
			depth--
			if (depth === 0) {return i}
		}
	}

	return -1
}

/** Split a masked object-literal body into top-level key → raw value text. */
function objectFields(masked, source, openBrace, closeBrace) {
	const fields = new Map()
	let i = openBrace + 1
	while (i < closeBrace) {
		while (i < closeBrace && /[\s,]/.test(masked[i])) {i++}
		if (i >= closeBrace) {break}
		const m = /^([A-Za-z_$][\w$]*|'[\s\S]*'|"[\s\S]*"|\d+)\s*:/.exec(masked.slice(i, closeBrace))
		if (!m) {
			return { fields, error: `unsupported object syntax near "${masked.slice(i, i + 24).trim()}"` }
		}

		const rawKey = m[1]
		const key =
			rawKey.startsWith("'") || rawKey.startsWith('"')
				? source.slice(i, i + m[0].indexOf(':')).trim().slice(1, -1)
				: rawKey

		let v = i + m[0].length
		const start = v
		let depth = 0
		while (v < closeBrace) {
			const ch = masked[v]
			if (ch === '{' || ch === '[' || ch === '(') {depth++}
			else if (ch === '}' || ch === ']' || ch === ')') {
				if (depth === 0) {break}
				depth--
			} else if (ch === ',' && depth === 0) {break}

			v++
		}

		fields.set(key, { start, end: v })
		i = v + 1
	}

	return { fields }
}

/** Evaluate a literal-only expression slice; throws on non-literal content. */
function literalValue(masked, source, start, end, label, file) {
	const text = masked.slice(start, end).trim()
	const fail = () => {
		throw new Error(
			`${file}: story metadata "${label}" must be a literal value — got "${source.slice(start, end).trim().slice(0, 60)}"`,
		)
	}

	if (text === '') {fail()}
	if (text === 'true') {return true}
	if (text === 'false') {return false}
	if (text === 'null') {return null}
	if (/^-?\d+(\.\d+)?$/.test(text)) {return Number(text)}
	if (/^'[^']*'$/.test(text) || /^"[^"]*"$/.test(text)) {
		const value = source.slice(start, end).trim().slice(1, -1)
		if (value.includes('\\')) {fail()}
		return value
	}

	// Template literal without interpolation → masked to spaces; reject.
	if (text.startsWith('`') || text === '') {fail()}
	if (text.startsWith('[')) {
		const openIdx = masked.indexOf('[', start)
		const close = matchBracket(masked, openIdx, '[', ']')
		if (close < 0 || masked.slice(close + 1, end).trim()) {fail()}
		const items = []
		let seg = openIdx + 1
		let depth = 0
		const push = (end2) => {
			const t = masked.slice(seg, end2).trim()
			if (t) {
				items.push(literalValue(masked, source, seg, end2, label, file))
			}
		}

		for (let i = openIdx + 1; i < close; i++) {
			const ch = masked[i]
			if (ch === '{' || ch === '[' || ch === '(') {depth++}
			else if (ch === '}' || ch === ']' || ch === ')') {depth--}
			else if (ch === ',' && depth === 0) { push(i); seg = i + 1 }
		}

		push(close)
		return items
	}

	fail()
}

const DECL_RE = /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*$/

/**
 * Extract story metadata declarations from source text. Returns
 * { stories: [...], diagnostics: [...] } — never throws on malformed input.
 */
export function scanStoryFile(source, file) {
	const masked = maskSource(source)
	const stories = []
	const diagnostics = []
	const exported = new Set()
	for (const m of masked.matchAll(/export\s*\{([^}]*)\}/g)) {
		for (const part of m[1].split(',')) {
			const name = part.trim().split(/\s+as\s+/).pop()?.trim()
			if (name) {exported.add(name)}
		}
	}

	let search = 0
	for (;;) {
		const at = masked.indexOf('defineStory', search)
		if (at === -1) {break}
		search = at + 'defineStory'.length
		const before = masked.slice(0, at)
		const after = masked.slice(at + 'defineStory'.length)
		// Word-boundary check on both sides.
		if (/[\w$.]$/.test(before) || /^[\w$]/.test(after)) {continue}

		// Binding detection: the statement immediately preceding defineStory
		// must be `<export>? const|let|var X =` or `export default`; the binding
		// may also be re-exported later via `export { X }`.
		let exportName = 'default'
		const stmtStart = Math.max(before.lastIndexOf(';'), before.lastIndexOf('}'), before.lastIndexOf('{'))
		const stmt = before.slice(stmtStart + 1)
		const decl = DECL_RE.exec(stmt)
		let exportedStory = false
		if (decl && decl.index + decl[0].length === stmt.length) {
			exportName = decl[1]
			exportedStory = /export\s+(const|let|var)\s/.test(stmt) || exported.has(exportName)
		} else if (/export\s+default\s*$/.test(stmt)) {
			exportedStory = true
		}

		let i = at + 'defineStory'.length
		while (i < masked.length && /\s/.test(masked[i])) {i++}
		// Generic instantiation: defineStory<Props, State, Fixture>({ … })
		if (masked[i] === '<') {
			const closeAngle = matchBracket(masked, i, '<', '>')
			if (closeAngle !== -1) {
				i = closeAngle + 1
				while (i < masked.length && /\s/.test(masked[i])) {i++}
			}
		}

		if (masked[i] !== '(') {
			// Not a call — an import specifier, re-export or identifier mention.
			continue
		}

		const closeParen = matchBracket(masked, i, '(', ')')
		if (closeParen === -1) {
			diagnostics.push({ file, exportName, message: 'defineStory call has unbalanced parentheses' })
			continue
		}

		let j = i + 1
		while (j < closeParen && /\s/.test(masked[j])) {j++}
		if (masked[j] !== '{') {
			diagnostics.push({ file, exportName, message: 'defineStory options must be an object literal' })
			continue
		}

		const closeBrace = matchBracket(masked, j, '{', '}')
		const { fields, error } = objectFields(masked, source, j, closeBrace)
		if (error) {
			diagnostics.push({ file, exportName, message: error })
			continue
		}

		const story = { file, exportName, exported: exportedStory }
		let failed = false
		for (const key of ['id', 'title', 'targets', 'capabilities']) {
			const field = fields.get(key)
			if (!field) {
				if (key === 'capabilities') {continue}
				diagnostics.push({ file, exportName, message: `defineStory requires a literal "${key}"` })
				failed = true
				continue
			}

			try {
				story[key] = literalValue(masked, source, field.start, field.end, key, file)
			} catch (e) {
				diagnostics.push({ file, exportName, message: e.message })
				failed = true
			}
		}

		if (!failed && (typeof story.id !== 'string' || !story.id || typeof story.title !== 'string' || !story.title ||
			!(story.targets === 'all' || (Array.isArray(story.targets) && story.targets.length > 0 && story.targets.every(t => ALL_TARGETS.includes(t)))) ||
			!(story.capabilities === undefined || (Array.isArray(story.capabilities) && story.capabilities.every(c => typeof c === 'string' && c.length > 0))))) {
			diagnostics.push({ file, exportName, message: 'story requires non-empty literal id/title, targets: all or a non-empty target array, and a string capability array' })
			failed = true
		}

		if (!failed) {
			stories.push(story)
		}
	}

	return { stories, diagnostics }
}

/**
 * Discover story metadata under `root`.
 *   → { entries, diagnostics }
 * entries: StoryMeta[] (applicable/reason computed for `target`)
 */
export function discoverStories(root, { include, exclude, target = 'web' } = {}) {
	const files = globSync(normalizeInclude(include), {
		cwd: root,
		ignore: normalizeExclude(exclude),
		absolute: true,
	})

	const entries = []
	const diagnostics = []
	const byId = new Map()

	for (const file of files) {
		let source
		try {
			source = readFileSync(file, 'utf8')
		} catch (e) {
			diagnostics.push({ file, message: `could not read story file: ${e.message}` })
			continue
		}

		const { stories, diagnostics: fileDiagnostics } = scanStoryFile(source, file)
		diagnostics.push(...fileDiagnostics)
		for (const story of stories) {
			if (!story.exported) {
				diagnostics.push({
					file,
					exportName: story.exportName,
					message: `defineStory("${story.id}") must be exported to be discovered`,
				})

				continue
			}

			const declared =
				story.targets === 'all'
					? ALL_TARGETS
					: Array.isArray(story.targets)
						? story.targets
						: [story.targets]

			for (const t of declared) {
				if (!ALL_TARGETS.includes(t)) {
					diagnostics.push({
						file,
						exportName: story.exportName,
						message: `story "${story.id}" declares unknown target "${t}"`,
					})
				}
			}

			const applicable = applicableTargets(declared.filter((t) => ALL_TARGETS.includes(t)), file)
			const required = story.capabilities ?? []
			const canRun = applicable.includes(target) && required.length === 0
			const reason = canRun
				? undefined
				: applicable.includes(target) && required.length > 0
					? `required capabilities are unknown/unqualified on ${target}: ${required.join(', ')}`
					: applicable.length === 0
					? `declared targets and the ${storyFileTag(file) ?? 'story'} leaf do not overlap`
					: `story targets ${applicable.join(', ')}, not ${target}`

			const meta = {
				id: story.id,
				title: story.title,
				targets: applicable,
				capabilities: story.capabilities ?? [],
				file,
				exportName: story.exportName,
				applicable: canRun,
				reason,
			}

			const dup = byId.get(story.id)
			if (dup) {
				diagnostics.push({
					file,
					exportName: story.exportName,
					message: `duplicate story id "${story.id}" — also declared in ${dup.file} (export "${dup.exportName}")`,
				})

				continue
			}

			byId.set(story.id, meta)
			entries.push(meta)
		}
	}

	entries.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
	return { entries, diagnostics }
}

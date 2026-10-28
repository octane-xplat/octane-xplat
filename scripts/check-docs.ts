import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GROUPS, purposeOf, slugFor } from '../apps/docs/src/doc-meta.ts'
import { parseMd } from '../apps/docs/src/md.ts'

export interface Fence {
	line: number
	language: string
	code: string
}

interface DocumentationPage {
	path: string
	kind: string
	lines: number
	sections: string[]
	examples: number
}

/** Keep line numbers while excluding examples from prose/link checks. */
export function markdownParts(source: string) {
	const prose: string[] = []
	const fences: Fence[] = []
	let open: { marker: string; line: number; language: string; lines: string[] } | undefined
	for (const [index, line] of source.split('\n').entries()) {
		const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/)
		if (open) {
			if (
				marker &&
				marker[1][0] === open.marker[0] &&
				marker[1].length >= open.marker.length &&
				!marker[2].trim()
			) {
				const indentation = Math.min(
					...open.lines.filter((s) => s.trim()).map((s) => s.match(/^\s*/)![0].length),
				)
				fences.push({
					line: open.line,
					language: open.language,
					code: open.lines.map((s) => s.slice(indentation)).join('\n'),
				})
				open = undefined
			} else {
				open.lines.push(line)
			}
			prose.push('')
		} else if (marker) {
			open = { marker: marker[1], line: index + 1, language: marker[2].trim(), lines: [] }
			prose.push('')
		} else {
			prose.push(line)
		}
	}
	return {
		prose: prose.join('\n').replace(/<!--[\s\S]*?-->/g, (s) => s.replace(/[^\n]/g, ' ')),
		fences,
		unclosed: open?.line,
	}
}

function markdownFiles(directory: string): string[] {
	if (!existsSync(directory)) {
		return []
	}
	return readdirSync(directory, { withFileTypes: true })
		.flatMap((entry) => {
			const path = resolve(directory, entry.name)
			return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : []
		})
		.sort()
}

function anchors(source: string, site: boolean): Set<string> {
	if (site) {
		return new Set(parseMd(source).flatMap((b) => (b.kind === 'h' ? [b.id] : [])))
	}
	const { prose } = markdownParts(source)
	const ids = new Set<string>()
	for (const match of prose.matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
		const base = match[1]
			.toLowerCase()
			.replace(/[^\p{L}\p{N}_\s-]/gu, '')
			.replace(/ /g, '-')
		let id = base
		let suffix = 0
		while (ids.has(id)) {
			id = `${base}-${++suffix}`
		}
		ids.add(id)
	}
	for (const match of prose.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) {
		ids.add(match[1])
	}
	return ids
}

export function checkDocumentation(root: string) {
	const errors: string[] = []
	const docs = markdownFiles(resolve(root, 'docs'))
	const slugs = new Map<string, string>()
	const packages = resolve(root, 'packages')
	const readmes: string[] = []
	for (const entry of existsSync(packages) ? readdirSync(packages, { withFileTypes: true }) : []) {
		const manifest = resolve(packages, entry.name, 'package.json')
		if (!entry.isDirectory() || !existsSync(manifest)) {
			continue
		}
		const readme = resolve(packages, entry.name, 'README.md')
		if (existsSync(readme)) {
			readmes.push(readme)
		} else if (!JSON.parse(readFileSync(manifest, 'utf8')).private) {
			errors.push(`${relative(root, manifest)}: published package needs README.md`)
		}
	}
	for (const path of docs) {
		const dir = relative(resolve(root, 'docs'), dirname(path))
		const slug = slugFor(dir, basename(path, '.md'))
		if (slugs.has(slug)) {
			errors.push(`${relative(root, path)}: duplicate public slug ${slug}`)
		}
		slugs.set(slug, path)
		if (!GROUPS.some((group) => group.dir === (dir || 'start') && group.slugs.includes(slug))) {
			errors.push(
				`${relative(root, path)}: add ${slug} to its reading order in apps/docs/src/doc-meta.ts`,
			)
		}
	}
	const supporting = [
		'README.md',
		'CONTRIBUTING.md',
		'AGENTS.md',
		'apps/docs/README.md',
		'.agents/docs/documentation.md',
		'.agents/docs/documentation-quality.md',
	]
		.map((path) => resolve(root, path))
		.filter(existsSync)
	const inventory: DocumentationPage[] = []
	for (const path of [...docs, ...readmes.sort(), ...supporting]) {
		const name = relative(root, path)
		const source = readFileSync(path, 'utf8')
		const { prose, fences, unclosed } = markdownParts(source)
		const fail = (line: number, message: string) => errors.push(`${name}:${line}: ${message}`)
		const site = docs.includes(path)
		const titles = [...prose.matchAll(/^# (.+)$/gm)]
		const titleCount = titles.length + (name === 'README.md' && /<h1>/.test(prose) ? 1 : 0)
		if (titleCount !== 1) {
			fail(1, 'expected one H1 title')
		}
		if (site && !purposeOf(source)) {
			fail(1, 'add a purpose blockquote after the H1 (used by llms.txt)')
		}
		if (unclosed) {
			fail(unclosed, 'unclosed code fence')
		}
		for (const fence of fences) {
			if (!fence.language) {
				fail(fence.line, 'code fence needs a language; use text for output')
			}
		}
		// Inline and reference destinations. Code literals are not navigable links.
		const linkText = prose.replace(/`+[^`\n]*`+/g, '')
		const links = [
			...linkText.matchAll(
				/\]\(<?([^\s)>]+)>?(?:\s+["'][^\n]*["'])?\)|^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/gm,
			),
		]
		for (const match of links) {
			const href = match[1] ?? match[2]
			const line = linkText.slice(0, match.index).split('\n').length
			let target: string
			let hash: string
			try {
				if (/^https:\/\/octane-xplat\.goddardai\.org(?:\/|$)/.test(href)) {
					const url = new URL(href)
					if (/^\/(?:llms(?:-full)?\.txt|demos\/)/.test(url.pathname)) {
						continue
					}
					const slug = decodeURIComponent(url.pathname.replace(/^\/|\/$/g, '')) || 'README'
					const found = slugs.get(slug)
					if (!found) {
						fail(line, `unknown public guide: ${href}`)
						continue
					}
					target = found
					hash = decodeURIComponent(url.hash.slice(1))
				} else if (
					/^https:\/\/github\.com\/octane-xplat\/octane-xplat\/(?:blob|tree)\/main\//.test(href)
				) {
					const url = new URL(href)
					target = resolve(
						root,
						decodeURIComponent(
							url.pathname.replace(/^\/octane-xplat\/octane-xplat\/(?:blob|tree)\/main\//, ''),
						),
					)
					hash = decodeURIComponent(url.hash.slice(1))
				} else if (/^[a-z][a-z\d+.-]*:|^\/\//i.test(href)) {
					continue // No network requests: external availability is reviewed separately.
				} else {
					const [file, fragment = ''] = href.split('#')
					target = file ? resolve(dirname(path), decodeURIComponent(file.split('?')[0])) : path
					hash = decodeURIComponent(fragment)
				}
				const rel = relative(root, target)
				if (rel === '..' || rel.startsWith(`..${sep}`)) {
					fail(line, `link escapes repository: ${href}`)
					continue
				}
				if (!existsSync(target)) {
					fail(line, `missing local target: ${href}`)
					continue
				}
				if (hash && target.endsWith('.md') && statSync(target).isFile()) {
					if (!anchors(readFileSync(target, 'utf8'), docs.includes(target)).has(hash)) {
						fail(line, `missing heading: ${href}`)
					}
				}
			} catch (error) {
				fail(line, `invalid link ${href}: ${String(error)}`)
			}
		}
		inventory.push({
			path: name,
			kind: site ? 'guide' : readmes.includes(path) ? 'package-readme' : 'contributor-or-entry',
			lines: source.split('\n').length,
			sections: [...prose.matchAll(/^## (.+)$/gm)].map((m) => m[1]),
			examples: fences.length,
		})
	}
	return { errors, inventory }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2)
	if (args.some((arg) => arg !== '--inventory')) {
		throw new Error('Usage: node scripts/check-docs.ts [--inventory]')
	}
	const result = checkDocumentation(fileURLToPath(new URL('../', import.meta.url)))
	if (args.includes('--inventory')) {
		console.log(JSON.stringify(result, null, 2))
	} else if (result.errors.length) {
		console.error(result.errors.join('\n'))
	} else {
		console.log(
			`Documentation structure and links pass (${result.inventory.length} files). Prose, API correctness, and runtime behavior require review.`,
		)
	}
	if (result.errors.length) {
		process.exitCode = 1
	}
}

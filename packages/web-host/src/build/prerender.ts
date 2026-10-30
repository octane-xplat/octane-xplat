import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, writeFile, rename, rm, lstat } from 'node:fs/promises'
import { resolve, dirname, join, relative, isAbsolute } from 'node:path'

/** A public rendered page, independent of the current build's document and assets. */
export interface StaticPage {
	/** Payload schema version; currently always 1. */
	version: 1
	/** Pathname + search the page was rendered for. */
	url: string
	/** HTTP status the rendered document carried; prerender only keeps 200. */
	status: number
	/** Response headers as name/value pairs; only content-type and cache-control survive static hosting. */
	headers: [string, string][]
}

/** One concrete route and its content revision. null always renders again. */
export interface StaticPath<Destination> {
	/** Route destination resolved to a concrete pathname by the renderer's href(). */
	destination: Destination
	/** Content revision key enabling reuse; `null` always renders again. Must cover every data dependency of the page. */
	key: string | null
}

/** Build-time renderer, normally returned by createWebRenderer in a compiled server entry. */
export interface StaticRenderer<Destination, Page extends StaticPage> {
	/** Resolve a route destination to its public pathname. */
	href(destination: Destination): string
	/** Render page content for a request; may return a Response for redirects/errors. */
	render(request: Request): Promise<Page | Response>
	/** Assemble the final HTML document for a rendered page. */
	document(page: Page, request: Request): Promise<Response>
}

/** Node build options. outDir is exclusively owned; cacheFile must live outside it.
 * revision must change with route, loader, guard, App or renderer code. Content keys
 * must include every data dependency. Reuse skips preparation, guards and rendering. */
export interface PrerenderOptions<Destination> {
	/** Output directory — exclusively owned by the prerenderer and replaced atomically. */
	outDir: string
	/** Content-key cache enabling reuse across runs; must live outside outDir. */
	cacheFile?: string
	/** HTTP(S) origin used to build request URLs — no path, query or credentials. */
	origin: string
	/** Renderer revision; must change with route, loader, guard, App or renderer code. */
	revision: string
	/** Concrete routes to emit, or an async enumerator for them. */
	paths:
		| Iterable<StaticPath<Destination>>
		| (() => Iterable<StaticPath<Destination>> | Promise<Iterable<StaticPath<Destination>>>)
}

const marker = '.xplat-prerender'
const ownership = 'xplat-prerender-v1\n'
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const inside = (parent: string, child: string) => {
	const path = relative(parent, child)
	return !path || (!path.startsWith('..') && !isAbsolute(path))
}

const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT'

function outputPath(path: string): string {
	if (!path.startsWith('/') || path.startsWith('//') || /[?#\\\x00-\x1f]/.test(path)) {
		throw new TypeError(`Static path must be an absolute pathname without search or hash: ${path}`)
	}
	const segments = path.slice(1).split('/')
	if (segments.at(-1) === '') {
		segments.pop()
	}
	for (const segment of segments) {
		const decoded = decodeURIComponent(segment)
		if (
			!decoded ||
			decoded === '.' ||
			decoded === '..' ||
			/[<>:"/\\|?*\x00-\x1f]/.test(decoded) ||
			/[. ]$/.test(decoded) ||
			/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(decoded)
		) {
			throw new TypeError(`Static path cannot be represented safely on disk: ${path}`)
		}
	}
	// Store decoded names: static HTTP hosts decode URL pathnames before filesystem lookup.
	return [...segments.map(decodeURIComponent), 'index.html'].join('/')
}

function assertPublic(page: StaticPage) {
	const headers = new Headers(page.headers)
	const cache = headers.get('cache-control') ?? ''
	if (
		page.version !== 1 ||
		page.status !== 200 ||
		!/(?:^|,)\s*public(?:\s*,|\s*$)/i.test(cache) ||
		/(?:private|no-store)/i.test(cache)
	) {
		throw new Error(
			`Prerender requires a 200 page explicitly marked Cache-Control: public (${page.url})`,
		)
	}
	headers.forEach((_, name) => {
		if (name !== 'content-type' && name !== 'cache-control') {
			throw new Error(
				`Static files cannot preserve response header ${name} (${page.url}); configure it on the static host instead`,
			)
		}
	})
	if (!/^text\/html(?:;|$)/i.test(headers.get('content-type') ?? '')) {
		throw new Error(`Prerender requires HTML (${page.url})`)
	}
}

/** Enumerate public routes into path/index.html and reuse unchanged page content.
 * Assets, bootstrap IDs and documents are rebuilt on every run. A failed render leaves
 * the previous owned output intact. Concurrent writes to the same outDir are rejected.
 * @example
 * await prerender(renderer, { origin: 'https://example.com', outDir: 'dist/static',
 *   revision: 'renderer-v1', paths: [{ destination: { to: '/' }, key: 'home-v1' }] })
 */
export async function prerender<Destination, Page extends StaticPage>(
	renderer: StaticRenderer<Destination, Page>,
	options: PrerenderOptions<NoInfer<Destination>>,
): Promise<{ rendered: number; reused: number; paths: string[] }> {
	if (!options.revision) {
		throw new TypeError('A renderer revision is required')
	}
	const origin = new URL(options.origin)
	if (
		!['http:', 'https:'].includes(origin.protocol) ||
		origin.username ||
		origin.password ||
		origin.href !== origin.origin + '/'
	) {
		throw new TypeError('origin must be an HTTP(S) origin without a path, query or credentials')
	}
	const outDir = resolve(options.outDir)
	const cacheFile = options.cacheFile ? resolve(options.cacheFile) : undefined
	if (cacheFile && (inside(outDir, cacheFile) || inside(cacheFile, outDir))) {
		throw new TypeError('cacheFile must live outside outDir')
	}
	await mkdir(dirname(outDir), { recursive: true })
	const lock = outDir + '.lock'
	await mkdir(lock)
	let stage: string | undefined
	let backup: string | undefined
	try {
		let existed = false
		try {
			const stat = await lstat(outDir)
			if (
				!stat.isDirectory() ||
				stat.isSymbolicLink() ||
				(await readFile(join(outDir, marker), 'utf8')) !== ownership
			) {
				throw new Error('outDir is not an owned Xplat prerender directory')
			}

			existed = true
		} catch (error) {
			// An existing directory without the ownership marker is never replaced.
			if (
				!missing(error) ||
				(await lstat(outDir).then(
					() => true,
					() => false,
				))
			) {
				throw error
			}
		}

		const entries = typeof options.paths === 'function' ? await options.paths() : options.paths
		const pages = []
		const outputs = new Set<string>()
		for (const entry of entries) {
			if (entry.key !== null && typeof entry.key !== 'string') {
				throw new TypeError('Every static path needs a string content key or null')
			}

			const path = renderer.href(entry.destination)
			const file = outputPath(path)
			const normalized = file.normalize('NFC').toLowerCase()
			if (
				outputs.has(normalized) ||
				[...outputs].some(
					(other) => other.startsWith(normalized + '/') || normalized.startsWith(other + '/'),
				)
			) {
				throw new Error(`Static output collision: ${path}`)
			}

			outputs.add(normalized)
			pages.push({
				path,
				file,
				key:
					entry.key === null
						? null
						: hash(JSON.stringify([1, origin.origin, path, options.revision, entry.key])),
			})
		}

		let previous: Record<string, { content: string; checksum: string }> = {}
		if (cacheFile) {
			try {
				const cache = JSON.parse(await readFile(cacheFile, 'utf8'))
				if (
					cache?.version === 1 &&
					cache.pages &&
					typeof cache.pages === 'object' &&
					!Array.isArray(cache.pages)
				) {
					previous = cache.pages
				}
			} catch (error) {
				if (!(error instanceof SyntaxError) && !missing(error)) {
					throw error
				}
			}
		}

		stage = await mkdtemp(outDir + '.stage-')
		const next: typeof previous = {}
		const result = { rendered: 0, reused: 0, paths: pages.map((page) => page.path) }
		for (const { path, file, key } of pages) {
			const request = new Request(new URL(path, origin))
			let page: Page | undefined
			const cached = key ? previous[key] : undefined
			if (
				cached &&
				typeof cached.content === 'string' &&
				hash(cached.content) === cached.checksum
			) {
				try {
					const candidate = JSON.parse(cached.content)
					assertPublic(candidate)
					if (candidate.url === path) {
						page = candidate
					}
				} catch {
					/* Corrupt entries are cache misses. */
				}
			}

			if (page) {
				result.reused++
			} else {
				const rendered = await renderer.render(request)
				if (rendered instanceof Response) {
					throw new Error(`Cannot prerender ${path}: HTTP ${rendered.status}`)
				}

				page = rendered
				assertPublic(page)
				if (page.url !== path) {
					throw new Error(`Rendered URL differs from enumerated path: ${path}`)
				}

				result.rendered++
			}

			if (key) {
				const content = JSON.stringify(page)
				next[key] = { content, checksum: hash(content) }
			}

			const response = await renderer.document(page, request)
			const responseHeaders: [string, string][] = []
			response.headers.forEach((value, name) => responseHeaders.push([name, value]))
			assertPublic({ version: 1, url: path, status: response.status, headers: responseHeaders })
			const output = join(stage, file)
			await mkdir(dirname(output), { recursive: true })
			await writeFile(output, await response.text())
		}

		await writeFile(join(stage, marker), ownership)
		if (cacheFile) {
			await mkdir(dirname(cacheFile), { recursive: true })
			const temporary = await mkdtemp(join(dirname(cacheFile), '.xplat-cache-'))
			try {
				await writeFile(join(temporary, 'cache.json'), JSON.stringify({ version: 1, pages: next }))
				await rename(join(temporary, 'cache.json'), cacheFile)
			} finally {
				await rm(temporary, { recursive: true, force: true })
			}
		}

		if (existed) {
			backup = stage + '.previous'
			await rename(outDir, backup)
		}

		try {
			await rename(stage, outDir)
			stage = undefined
		} catch (error) {
			if (backup) {
				await rename(backup, outDir)
				backup = undefined
			}

			throw error
		}

		if (backup) {
			await rm(backup, { recursive: true, force: true })
			backup = undefined
		}

		return result
	} finally {
		if (stage) {
			await rm(stage, { recursive: true, force: true })
		}

		await rm(lock, { recursive: true, force: true })
	}
}

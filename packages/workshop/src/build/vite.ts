// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
/**
 * xplatWorkshop — the workshop dev-server plugin.
 *
 * Emits a virtual catalog module whose metadata comes from static discovery
 * (never module evaluation), a virtual entry that boots the adaptive shell,
 * and a virtual index.html. Story modules stay lazily imported per selection;
 * loaders exist only for stories applicable to the build target, so a
 * platform-specific leaf is never imported into an incompatible bundle.
 */
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverStories, normalizeInclude } from './discover.ts'

const CATALOG_ID = '\0xplat-workshop-catalog'
const ENTRY_ID = '\0xplat-workshop-entry'
const STORY_FILE_RE =
	/\.stories(?:\.(?:web|mobile|ios|android|macos|windows|linux))?\.(?:[cm]?[jt]s|[jt]sx|[jt]srx)$/

const WEB_EXTENSIONS = [
	'.web.tsrx',
	'.tsrx',
	'.web.tsx',
	'.tsx',
	'.web.ts',
	'.ts',
	'.mts',
	'.ts',
	'.jsx',
	'.js',
	'.json',
]

// Per-target resolution for DOM-rendering hosts — web only. The Linux
// workshop renders on the GTK renderer (src/build/gtk-node.ts), not a webview.
const TARGET_RESOLUTION = {
	web: { conditions: ['web'], extensions: WEB_EXTENSIONS },
}

const fsUrl = (file) => `/@fs/${file.split(sep).join('/')}`

function catalogCode(root, config, target) {
	const storiesConfig = config?.stories ?? {}
	const { entries, diagnostics } = discoverStories(root, {
		include: storiesConfig.include,
		exclude: storiesConfig.exclude,
		target,
	})

	const include = JSON.stringify(normalizeInclude(storiesConfig.include))
	const loaders = entries
		.filter((entry) => entry.applicable && diagnostics.length === 0)
		.map(
			(entry) => `\t${JSON.stringify(entry.id)}: (stamp) => stamp === undefined
\t\t? import(${JSON.stringify(fsUrl(entry.file))})
\t\t: import(/* @vite-ignore */ ${JSON.stringify(fsUrl(entry.file))} + '?t=' + encodeURIComponent(String(stamp))),`,
		)
		.join('\n')

	return `import { catalogDidUpdate } from '@octane-xplat/workshop/web'

export const catalogMeta = ${JSON.stringify(entries)}
export const diagnostics = ${JSON.stringify(diagnostics)}
export const includePatterns = ${include}

const loaders = {
${loaders}
}

export const catalog = catalogMeta.map((entry) =>
	loaders[entry.id] ? { ...entry, load: loaders[entry.id] } : entry,
)

export function loadStory(id, stamp) {
	const entry = catalog.find((item) => item.id === id)
	if (!entry?.load) {
		return Promise.reject(
			new Error(
				entry
					? 'story "' + id + '" is not supported on this target'
					: 'story "' + id + '" is not in the catalog',
			),
		)
	}
	return entry.load(stamp)
}

catalogDidUpdate(catalog, diagnostics)
if (import.meta.hot) {
	import.meta.hot.accept((next) => catalogDidUpdate(next?.catalog ?? catalog, next?.diagnostics ?? diagnostics))
}
`
}

function entryCode(config, target, story, packageDir, root) {
	const providerModules = config?.providerModules ?? []
	const imports = providerModules
		.map((specifier, index) => {
			const abs = resolve(root, specifier)
			return `import * as __workshopPreset${index} from ${JSON.stringify(fsUrl(abs))}`
		})
		.join('\n')

	const providers = providerModules
		.map(
			(_, index) =>
				`...(__workshopPreset${index}.providers ?? __workshopPreset${index}.default ?? [])`,
		)
		.join(', ')

	// Both src/build and dist/build resolve the shipped runtime source here.
	const shellCss = fsUrl(join(packageDir, '../../src/web/shell.css'))

	return `import { catalog, loadStory, diagnostics } from ${JSON.stringify(CATALOG_ID)}
import { startWorkshop } from '@octane-xplat/workshop/web'
import '@octane-xplat/ui/theme/tokens.css'
import ${JSON.stringify(shellCss)}
${imports}

startWorkshop({
	catalog,
	diagnostics,
	loadStory,
	target: ${JSON.stringify(target)},
	initialStoryId: ${JSON.stringify(story ?? null)},
	globalProviders: [${providers}],
	hot: import.meta.hot,
})
`
}

const WORKSHOP_HTML = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>octane-xplat workshop</title>
		<style>html,body{margin:0;height:100%}#workshop-root{height:100%}</style>
	</head>
	<body>
		<div id="workshop-root"></div>
		<script type="module" src="/@id/__x00__xplat-workshop-entry"></script>
	</body>
</html>
`

/**
 * @param {object} [options]
 * @param {string} options.cwd - consumer project root
 * @param {object} [options.config] - resolved workshop.config.* contents
 * @param {string} [options.target] - launch target (DOM hosts: 'web' | 'linux')
 * @param {string} [options.story] - initial stable story id
 */
export function xplatWorkshop(options = {}) {
	const target = options.target ?? 'web'
	const story = options.story ?? null
	const resolution = TARGET_RESOLUTION[target] ?? TARGET_RESOLUTION.web
	let root = options.cwd ?? process.cwd()
	let config = options.config ?? {}

	const virtualModules = {
		name: 'xplat-workshop-virtual',
		configResolved(resolved) {
			root = options.cwd ?? resolved.root
		},
		resolveId(id) {
			if (id === CATALOG_ID || id === ENTRY_ID) {
				return id
			}

			return null
		},
		load(id) {
			if (id === CATALOG_ID) {
				return catalogCode(root, config, target)
			}

			if (id === ENTRY_ID) {
				return entryCode(config, target, story, dirname(fileURLToPath(import.meta.url)), root)
			}

			return null
		},
	}

	const shell = {
		name: 'xplat-workshop-shell',
		config() {
			return {
				optimizeDeps: {
					exclude: ['@octane-xplat/workshop'],
					// The packed workshop is excluded from compilation, so explicitly
					// optimize its portable composition dependency and CJS transitive graph.
					include: ['@octane-xplat/workshop > storybook/preview-api'],
				},
				resolve: {
					conditions: [...resolution.conditions],
				},
			}
		},
		configResolved(resolved) {
			// The octane plugin's extension list merges first, which would let the
			// unsuffixed .tsrx leaf shadow the target's leaf. Environments carry
			// their own resolved lists — rewrite every one.
			const apply = (scope) => {
				scope.resolve.extensions = [
					...resolution.extensions,
					...scope.resolve.extensions.filter((ext) => !resolution.extensions.includes(ext)),
				]

				scope.resolve.conditions = [
					...resolution.conditions,
					...scope.resolve.conditions.filter((cond) => !resolution.conditions.includes(cond)),
				]
			}

			apply(resolved)
			for (const env of Object.values(resolved.environments ?? {})) {
				apply(env)
			}
		},
		hotUpdate: {
			// 'pre' plus registration ahead of the octane plugin: octane's own
			// hotUpdate full-reloads every octane file whose modules are not all
			// self-accepting, which would reset the workshop page on every story
			// save. Answering with the accepting catalog alone makes octane's
			// every-self-accepting early return match, while the catalog update
			// re-discovers metadata and remounts the story through a fresh
			// stamped loader import.
			order: 'pre',
			handler(ctx) {
				if (this.environment.name !== 'client' || !STORY_FILE_RE.test(ctx.file)) {
					return
				}

				const catalog = this.environment.moduleGraph.getModuleById(CATALOG_ID)
				if (!catalog) {
					return
				}

				this.environment.moduleGraph.invalidateModule(catalog)
				// The environment-aware hook includes create/delete. Stamped story
				// nodes carry no graph importer edge (@vite-ignore loader import),
				// so seeding them would dead-end propagation into a full reload.
				return [catalog]
			},
		},
		configureServer(s) {
			// The workshop page is a separate dev entry — intercept '/' before
			// vite's own index fallback can serve the consumer app's document.
			s.middlewares.use((req, res, next) => {
				const url = (req.url ?? '').split('?')[0]
				if (url === '/' || url === '/index.html') {
					res.statusCode = 200
					res.setHeader('content-type', 'text/html; charset=utf-8')
					res.end(WORKSHOP_HTML)
					return
				}

				if (url.startsWith('/@workshop-assets/')) {
					return serveAsset(config, root, url, res, next)
				}

				next()
			})
		},
	}

	return [virtualModules, shell]
}

function serveAsset(config, root, url, res, next) {
	const assets = config?.assets ?? {}
	const rest = url.slice('/@workshop-assets/'.length)
	const name = rest.split('/')[0]
	const dir = assets[name] ? resolve(root, assets[name]) : null
	if (!dir) {
		next()
		return
	}

	const file = resolve(dir, rest.slice(name.length + 1))
	let content
	if (file === dir || file.startsWith(dir + sep)) {
		try {
			// Resolve both sides so a configured symlink root works, but an
			// asset alias cannot expose files outside that root.
			const realDir = realpathSync(dir)
			const realFile = realpathSync(file)
			if (
				(realFile === realDir || realFile.startsWith(realDir + sep)) &&
				statSync(realFile).isFile()
			) {
				content = readFileSync(realFile)
			}
		} catch {
			// Missing/broken links and files removed during a request are 404s.
		}
	}

	res.statusCode = content === undefined ? 404 : 200
	res.end(content ?? 'not found')
}

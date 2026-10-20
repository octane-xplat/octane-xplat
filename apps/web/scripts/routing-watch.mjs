// Actual dev-server/browser qualification. No screenshots or visual analysis.
import assert from 'node:assert/strict'
import {
	mkdtemp,
	mkdir,
	readFile,
	realpath,
	rename,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises'

import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { chromium } from 'playwright'
import { generateRoutes } from '../../../packages/cli/src/commands/routes.ts'
import { createRouteWatcher } from '../../../packages/cli/src/route-watch.ts'

const shell = fileURLToPath(new URL('../', import.meta.url))
const root = await realpath(await mkdtemp(join(tmpdir(), 'xplat-routing-watch-browser-')))
const checks = []
const errors = []
const generationErrors = []
let watcher
let server
let browser
let generations = 0
let documentLoads = 0
const screen = (label) => `/** @jsxImportSource @octane-xplat/jsx/dom */
export default function Screen() { return <p id="route">${label}</p> }\n`

async function put(path, source) {
	await mkdir(dirname(join(root, path)), { recursive: true })
	await writeFile(join(root, path), source)
}

try {
	await symlink(join(shell, 'node_modules'), join(root, 'node_modules'), 'dir')
	await put('package.json', JSON.stringify({ private: true, type: 'module' }))
	await put(
		'xplat.routes.json',
		JSON.stringify({
			context: { module: './context.ts', export: 'context' },
			manifests: [{ module: './extra.tsx', export: 'extra' }],
		}),
	)

	await put('context.ts', "export const context = { account: 'a' }\n")
	const extra = (path, label) => `/** @jsxImportSource @octane-xplat/jsx/dom */
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
export const extra = defineRoutes([defineRoute({
  path: '${path}',
  loader: ({ context }) => ({ label: context.account }),
}).screen(({ data }) => <p id="route">${label}:{data.label}</p>)])
`

	await put('extra.tsx', extra('/extra', 'Extra'))
	await put('app/index.tsx', screen('Home'))
	await put('app/first.tsx', screen('First'))
	await put(
		'index.html',
		'<!doctype html><html><body><div id="app"></div><script type="module" src="/client.web.tsx"></script></body></html>',
	)

	await put(
		'client.web.tsx',
		`/** @jsxImportSource @octane-xplat/jsx/dom */
import './routes.gen.web'
import { createRoot } from 'octane'
import { RouteOutlet } from '@octane-xplat/ui'
import { router } from '@octane-xplat/ui/routing'
function App() { return <RouteOutlet /> }
window.__routingWatch = {
  resolve: (url: string) => router.resolveUrl(url).status,
  go: async (url: string) => (await router.navigateUrl(url)).status,
}
createRoot(document.getElementById('app')!).render(App, {})
`,
	)

	watcher = createRouteWatcher({
		cwd: root,
		generate: (signal, inputs) =>
			generateRoutes(root, inputs.directory, inputs.out, { signal, bake: false }),
		onGenerated: () => {
			generations++
		},
		onError: (error) => {
			generationErrors.push(String(error))
		},
	})

	await watcher.ready
	server = await createServer({
		configFile: false,
		root,
		logLevel: 'warn',
		plugins: [...octane()],
		resolve: {
			conditions: ['web'],
			extensions: ['.web.tsx', '.tsx', '.web.tsrx', '.tsrx', '.web.ts', '.ts', '.js'],
		},
		server: {
			host: '127.0.0.1',
			port: 0,
			fs: { allow: [root, fileURLToPath(new URL('../../../', import.meta.url))] },
		},
	})

	await server.listen()
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	page.setDefaultTimeout(20000)
	page.on('pageerror', (error) => errors.push(error.message))
	page.on('load', () => {
		documentLoads++
	})

	await page.goto(server.resolvedUrls.local[0])
	await page.locator('#route').filter({ hasText: 'Home' }).waitFor()
	async function available(path, status = 'matched') {
		await page.waitForFunction(
			({ path, status }) => window.__routingWatch?.resolve(path) === status,
			{ path, status },
		)
	}

	async function go(path, text) {
		await available(path)
		assert.equal(await page.evaluate((path) => window.__routingWatch.go(path), path), 'committed')
		assert.equal(await page.locator('#route').textContent(), text)
	}

	async function generatedContains(path, present = true) {
		const deadline = Date.now() + 20000
		while (
			(await readFile(join(root, 'routes.gen.contracts.ts'), 'utf8')).includes(path) !== present
		) {
			assert.ok(
				Date.now() < deadline,
				`Generated contracts did not ${present ? 'add' : 'remove'} ${path}`,
			)

			await new Promise((resolve) => setTimeout(resolve, 20))
		}
	}

	await go('/first', 'First')
	checks.push('generated startup renders a file route')
	await put('app/first.tsx', screen('First edited'))
	await page.waitForFunction(() => document.getElementById('route')?.textContent === 'First edited')
	checks.push('editing the active screen reaches its rendered DOM')
	await put('app/added.tsx', screen('Added'))
	await generatedContains('/added')
	await go('/added', 'Added')
	checks.push('a newly generated file route resolves and renders without restarting the server')
	await go('/first', 'First edited')
	await rename(join(root, 'app/added.tsx'), join(root, 'app/renamed.tsx'))
	await generatedContains('/renamed')
	await generatedContains('/added', false)
	await available('/added', 'not-found')
	await go('/renamed', 'Added')
	checks.push('renaming a route removes the old runtime path and renders the new one')
	await go('/first', 'First edited')
	await rm(join(root, 'app/renamed.tsx'))
	await generatedContains('/renamed', false)
	await available('/renamed', 'not-found')
	checks.push('removing a route updates the running runtime catalog')
	await go('/extra', 'Extra:a')
	await put('context.ts', "export const context = { account: 'b' }\n")
	await page.waitForFunction(() => document.getElementById('route')?.textContent === 'Extra:b')
	checks.push('editing configured context refreshes loaded screen data')
	await go('/first', 'First edited')
	await put('extra.tsx', extra('/new-extra', 'New extra'))
	await available('/extra', 'not-found')
	await go('/new-extra', 'New extra:b')
	checks.push('editing a configured programmatic manifest replaces its runtime routes')
	assert.deepEqual(errors, [], 'Unexpected browser errors')
	assert.deepEqual(generationErrors, [], 'Unexpected generation failures')
	console.log(
		JSON.stringify(
			{ checks, generations, documentLoads, browserErrors: errors, generationErrors },
			null,
			2,
		),
	)
} finally {
	await browser?.close()
	await server?.close()
	await watcher?.close()
	await rm(root, { recursive: true, force: true })
}

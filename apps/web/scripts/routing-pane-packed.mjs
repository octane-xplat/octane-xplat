import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, preview } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { chromium } from 'playwright'
// Manual packed-runtime check; no browser engine belongs in the lightweight PR gate.
assert.equal(
	process.argv.length,
	3,
	'Usage: node scripts/routing-pane-packed.mjs EXTRACTED_UI_PACKAGE_DIRECTORY',
)

const repository = fileURLToPath(new URL('../../../', import.meta.url))
const distribution = await realpath(resolve(process.argv[2]))
const require = createRequire(import.meta.url)
const workspaceUi = await realpath(join(repository, 'packages/ui'))
const directory = await mkdtemp(join(tmpdir(), 'xplat-packed-pane-'))
let browser, server
const errors = []
const modules = []
try {
	await mkdir(join(directory, 'node_modules/@octane-xplat'), { recursive: true })
	await symlink(distribution, join(directory, 'node_modules/@octane-xplat/ui'), 'dir')
	let octaneRoot = dirname(require.resolve('octane'))
	while (
		JSON.parse(
			await readFile(join(octaneRoot, 'package.json'), 'utf8').catch(() => '{"name":null}'),
		).name !== 'octane'
	) {
		const parent = dirname(octaneRoot)
		assert.notEqual(parent, octaneRoot, 'Cannot locate the Octane package root')
		octaneRoot = parent
	}

	await symlink(octaneRoot, join(directory, 'node_modules/octane'), 'dir')
	await writeFile(join(directory, 'package.json'), '{"private":true,"type":"module"}')
	const consumer = createRequire(join(directory, 'entry.mjs'))
	const resolved = await realpath(consumer.resolve('@octane-xplat/ui/routing'))
	assert.ok(resolved.startsWith(distribution + sep), 'Consumer must resolve the supplied archive')
	await writeFile(
		join(directory, 'example.tsrx'),
		await readFile(join(repository, 'packages/ui/tests/pane-router-example.tsrx'), 'utf8'),
	)

	await writeFile(
		join(directory, 'index.html'),
		'<html><head><meta charset="utf-8"></head><body><div id="app"></div><script type="module" src="/entry.tsrx"></script></body></html>',
	)

	await writeFile(
		join(directory, 'entry.tsrx'),
		`
import {createRoot} from 'octane'
import {qualifyPaneRouterExample} from './example.tsrx'
const container=document.getElementById('app')!
const checks:string[]=[]
const href=location.href, length=history.length
void qualifyPaneRouterExample({
 mount(Component,props){const root=createRoot(container);root.render(Component,props);return()=>root.unmount()},
 find:id=>container.querySelector('#'+id),
 check(name,pass){if(!pass)throw new Error(name);checks.push(name)},
 async wait(name,predicate){const deadline=Date.now()+10000;while(!predicate()){if(Date.now()>deadline)throw new Error(name);await new Promise(resolve=>setTimeout(resolve,10))}},
}).then(()=>{(window as any).__paneReport={checks,urlUnchanged:location.href===href,historyUnchanged:history.length===length}},error=>{(window as any).__paneReport={error:String(error)}})
`,
	)

	const configuration = {
		configFile: false,
		root: directory,
		logLevel: 'error',
		plugins: [
			...octane(),
			{
				name: 'assert-packed-pane-modules',
				generateBundle() {
					for (const id of this.getModuleIds()) {
						if (id.startsWith(workspaceUi + '/src/')) {
							throw new Error('Workspace UI leaked into packed runtime: ' + id)
						}

						if (id.startsWith(distribution + '/src/')) {
							modules.push(id)
						}
					}
				},
			},
		],
		resolve: {
			conditions: ['web'],
			extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.tsx', '.mjs', '.js', '.json'],
		},
		build: { outDir: join(directory, 'dist') },
	}

	await build(configuration)
	for (const name of [
		'RouterPane.tsrx',
		'pane-router-client.ts',
		'client-route-outlet.shared.tsrx',
		'routing/index.web.ts',
	]) {
		assert.ok(
			modules.some((id) => id.endsWith('/' + name)),
			'Missing archive module ' + name,
		)
	}

	server = await preview({ ...configuration, preview: { host: '127.0.0.1', port: 0 } })
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto('http://127.0.0.1:' + server.httpServer.address().port)
	await page.waitForFunction(() => window.__paneReport !== undefined)
	const report = await page.evaluate(() => window.__paneReport)
	assert.equal(report.error, undefined, report.error)
	assert.equal(report.checks.length, 11)
	assert.equal(report.urlUnchanged, true)
	assert.equal(report.historyUnchanged, true)
	assert.deepEqual(errors, [])
	console.log(
		JSON.stringify({
			target: 'packed-chromium',
			productionBuild: true,
			archiveEntry: resolved,
			browserEntry: modules.find((id) => id.endsWith('/routing/index.web.ts')),
			uiModules: modules.length,
			workspaceUiModules: 0,
			screenshots: false,
			...report,
		}),
	)
} finally {
	await browser?.close()
	if (server) {
		await new Promise((resolve, reject) =>
			server.httpServer.close((error) => (error ? reject(error) : resolve())),
		)
	}

	await rm(directory, { recursive: true, force: true })
}

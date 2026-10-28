/** Packed Linux-target acceptance, outside the workspace with no source
 * aliases. Requires built UI/workshop artifacts. Covers everything checkable
 * without a real GTK host: doctor's linux row (GTK runtime checks), catalog
 * applicability with .stories.gtk.* leaves, the .stories.linux.* discovery
 * diagnostic, and packed export resolution. The GJS window, GTK input/focus
 * and story reload semantics are exercised by apps/workshop-demo e2e:gtk —
 * this is not that evidence. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const work = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-workshop-packed-linux-')))
const consumer = join(work, 'consumer')
const pack = join(work, 'pack')
mkdirSync(consumer)
mkdirSync(pack)
let succeeded = false
function run(command, args, cwd = consumer) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	assert.equal(
		result.status,
		0,
		`${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`,
	)

	return result.stdout
}

function write(name, content) {
	writeFileSync(join(consumer, name), content)
}

try {
	const tarballs = {}
	for (const dir of [
		'create',
		'cli',
		'lib',
		'ui',
		'workshop',
		'linux-gtk-renderer',
		'css-engine',
		'jsx',
	]) {
		const root = join(repo, 'packages', dir)
		const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
		run('pnpm', ['--config.ignore-scripts=true', 'pack', '--pack-destination', pack], root)
		tarballs[manifest.name] =
			`file:${join(pack, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
	}

	write(
		'package.json',
		JSON.stringify(
			{
				name: 'workshop-packed-linux-acceptance',
				private: true,
				type: 'module',
				dependencies: { '@octane-xplat/ui': tarballs['@octane-xplat/ui'], octane: '0.14.0' },
				devDependencies: {
					'@octane-xplat/workshop': tarballs['@octane-xplat/workshop'],
					'@octane-xplat/cli': tarballs['@octane-xplat/cli'],
					'@octane-xplat/linux-gtk': tarballs['@octane-xplat/linux-gtk'],
					'@octanejs/vite-plugin': '0.1.61',
					'@tsrx/oxc': '0.20.0',
					'@tsrx/core': '0.2.4',
					typescript: '5.9.3',
					vite: '8.3.0',
				},
			},
			null,
			2,
		),
	)

	write(
		'pnpm-workspace.yaml',
		`packages: []\noverrides:\n${Object.entries(tarballs)
			.map(([name, path]) => `  '${name}': '${path}'`)
			.join('\n')}\n`,
	)

	run('pnpm', ['install', '--ignore-scripts'])
	for (const name of ['ui', 'workshop', 'cli', 'linux-gtk']) {
		assert.ok(
			realpathSync(join(consumer, 'node_modules/@octane-xplat', name)).startsWith(work),
			`${name} must come from a tarball`,
		)
	}

	run('pnpm', ['exec', 'xplat', 'workshop', 'init'])
	// The maintained acceptance catalog, without the init example.
	rmSync(join(consumer, 'src/workshop'), { recursive: true })
	cpSync(join(repo, 'apps/workshop-demo/src'), join(consumer, 'src'), { recursive: true })

	const doctor = run('pnpm', ['exec', 'xplat', 'workshop', 'doctor', '--json'])
	const report = JSON.parse(doctor.slice(doctor.indexOf('{')))
	const linux = report.targets.linux
	assert.ok(linux, 'doctor reports a linux row')
	assert.match(linux.backend, /gtk/i, 'linux backend is the GTK renderer')
	assert.ok(
		'gjs' in linux.requirements || linux.status === 'unsupported-host',
		'doctor checks the GTK runtime, not WebKitGTK',
	)

	assert.doesNotMatch(JSON.stringify(linux.requirements), /webkit|adwaita|ui linux export/i)
	console.log(`PASS packed doctor linux row: ${linux.status} on ${process.platform}`)

	const req = createRequire(join(consumer, 'package.json'))
	const gtkShell = req.resolve('@octane-xplat/workshop/node')
	assert.ok(gtkShell.endsWith('.js'), 'node entry resolves to dist build')
	console.log('PASS packed node entry resolves')
	for (const entry of ['', '/host', '/compat/native-core', '/compat/escape-props']) {
		assert.match(req.resolve(`@octane-xplat/linux-gtk${entry}`), /\/dist\/.*\.js$/)
	}

	// Exercise the actual CLI preset against this tarball's dist exports.
	write(
		'src/gtk-entry.ts',
		`import { runGtkApp } from '@octane-xplat/linux-gtk/host'
import { App } from './App.gtk'
runGtkApp({ applicationId: 'dev.xplat.packedgtk', title: 'Packed GTK' }, ({ root }) => root.render(App, {}))
`,
	)

	write(
		'src/App.gtk.tsx',
		`/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '@octane-xplat/ui'
export function App() {
  return <masonview><Text>GTK consumer</Text><button text="Save" accessibilityLabel="Save draft" /></masonview>
}
`,
	)

	write(
		'vite.gtk.config.mjs',
		`import { xplatLinuxGtk } from '@octane-xplat/cli/linux-gtk/vite'
export default env => xplatLinuxGtk(env, { entry: 'src/gtk-entry.ts', outDir: 'dist-gtk' })
`,
	)

	run('pnpm', ['exec', 'vite', 'build', '--config', 'vite.gtk.config.mjs'])
	assert.ok(readFileSync(join(consumer, 'dist-gtk/app.js'), 'utf8').includes('gi://Gtk'))
	console.log('PASS packed renderer and CLI preset build')
	write(
		'gtk-types.ts',
		`import type { GtkAppOptions } from '@octane-xplat/linux-gtk/host'
import type { GtkContainer } from '@octane-xplat/linux-gtk'
const options: GtkAppOptions = { applicationId: 'dev.xplat.consumer', title: 'Consumer' }
// @ts-expect-error applicationId is required and must be a string.
const invalid: GtkAppOptions = { applicationId: 42 }
declare const container: GtkContainer
container.nodes.get(1)?.view?.get_name()
void options; void invalid
`,
	)

	write(
		'tsconfig.gtk.json',
		JSON.stringify({
			compilerOptions: {
				module: 'NodeNext',
				moduleResolution: 'NodeNext',
				target: 'ES2022',
				strict: true,
				skipLibCheck: true,
				noEmit: true,
				types: [],
			},
			files: ['gtk-types.ts'],
		}),
	)

	run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.gtk.json'])
	console.log('PASS packed GTK declarations')

	// Catalog: .stories.gtk.* leaves apply on the linux target; .stories.linux.*
	// produces a discovery diagnostic pointing at the GTK rename.
	const listRun = spawnSync(
		'pnpm',
		['exec', 'xplat', 'workshop', 'list', '--target', 'linux', '--json'],
		{ cwd: consumer, encoding: 'utf8' },
	)

	const listText = listRun.stdout
	const list = JSON.parse(listText.slice(listText.indexOf('{')))
	const entries = list.entries
	const linuxLeaf = entries.find((e) => e.id === 'platform/linux-gtk')
	const iosLeaf = entries.find((e) => e.id === 'platform/ios-only')
	assert.equal(linuxLeaf?.applicable, true, 'gtk leaf applicable on linux target')
	assert.equal(iosLeaf?.applicable, false, 'ios leaf never applicable on linux')
	assert.equal(entries.find((e) => e.id === 'counter/basic')?.applicable, true)
	// A .stories.linux.* file produces the GTK migration diagnostic and keeps
	// the story out of the linux catalog.
	write(
		'src/stories/legacy.stories.linux.ts',
		`export const Legacy = { id: 'platform/legacy-linux', title: 'Platform / Legacy linux', targets: ['linux'] }
`,
	)

	const diagRun = spawnSync(
		'pnpm',
		['exec', 'xplat', 'workshop', 'list', '--target', 'linux', '--json'],
		{ cwd: consumer, encoding: 'utf8' },
	)

	assert.match(
		diagRun.stdout + diagRun.stderr,
		/renders with GTK|stories\.gtk/i,
		'the diagnostic tells the author the Linux workshop renders with GTK',
	)

	const diagList = JSON.parse(diagRun.stdout.slice(diagRun.stdout.indexOf('{')))
	assert.equal(
		diagList.entries.find((e) => e.id === 'platform/legacy-linux'),
		undefined,
		'a .stories.linux.* file stays out of the linux catalog',
	)

	console.log('PASS packed linux catalog: gtk leaf applies, .stories.linux.* diagnosed')

	succeeded = true
} finally {
	// Keep failure artifacts for diagnosis; successful fixtures are owned and temporary.
	if (succeeded) {
		rmSync(work, { recursive: true, force: true })
	}
}

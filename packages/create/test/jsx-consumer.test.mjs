import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { applyTarget } from '../dist/scaffold.js'
import { expandEnvPrograms, loadEnvManifest } from '../../cli/src/tsconfig-envs.ts'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const creator = join(repo, 'packages/create/dist/index.js')

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
	assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
}

// These files join the generated program without overriding its JSX source.
// Expect-error assertions fail if the program silently falls back to DOM or any.
const native = `
import type { HostElement } from '@octane-xplat/jsx/jsx-runtime'
export const tree = <gridlayout><label text="Ready" ref={view => {
 const host: HostElement | null = view
 // @ts-expect-error the combined program deliberately has an opaque host
 view?.getViewById('child')
 void host
}} onTap={event => {
 const host: HostElement = event.object
 // @ts-expect-error host events do not expose DOM nodes
 const dom: HTMLElement = event.object
 void host; void dom
}} /></gridlayout>
// @ts-expect-error DOM vocabulary is not native
const dom = <div />
// @ts-expect-error wrong native property type
const bad = <label whiteSpace="invalid" />
// @ts-expect-error arbitrary properties are rejected
const extra = <label inventedProp="no" />
void dom; void bad; void extra
`
const dom = `/** @jsxImportSource @octane-xplat/jsx/dom */
export const tree = <div><button onClick={event => {
 const element: HTMLButtonElement = event.currentTarget
 void element
}}>Ready</button></div>
// @ts-expect-error native vocabulary is not DOM
const native = <gridlayout />
// @ts-expect-error native text property is not a DOM button property
const bad = <button text="Ready" />
void native; void bad
`
const concreteNative = `
import type { View } from '@nativescript/core/ui/core/view/index.js'
import type { HostElement } from '@octane-xplat/jsx/jsx-runtime'
export const tree = <gridlayout ref={view => {
 const native: View | null = view
 const host: HostElement | null = native
 view?.getViewById('child')
 // @ts-expect-error NativeScript host is not a DOM element
 const dom: HTMLElement | null = view
 void host; void dom
}} onTap={event => {
 const native: View = event.object
 native.getViewById('child')
}} />
// @ts-expect-error conditions must not change intrinsic membership
const dom = <div />
void dom
`

for (const targets of ['web', 'ios', 'android', 'web,ios,android', 'web+add-ios']) {
	test(`creator output checks shared native and explicit DOM JSX: ${targets}`, (t) => {
		const root = mkdtempSync(join(tmpdir(), 'xplat-jsx-scaffold-'))
		t.after(() => rmSync(root, { recursive: true, force: true }))
		const app = join(root, 'app')
		run(process.execPath, [creator, app, '--no-install', '--targets', targets.split('+')[0]], root)
		if (targets.includes('+')) {
			applyTarget(app, 'ios')
		}
		const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
		assert.ok(
			manifest.dependencies['@octane-xplat/jsx'],
			'the JSX source must be a direct dependency',
		)
		for (const file of [
			'.agents/skills/xplat/SKILL.md',
			'.agents/skills/xplat/references/components.md',
			'.agents/skills/xplat/references/platform.md',
		]) {
			assert.doesNotMatch(
				readFileSync(join(app, file), 'utf8'),
				/@jsxImportSource @nativescript-community\/octane/,
			)
		}
		const config = JSON.parse(readFileSync(join(app, 'tsconfig.json'), 'utf8'))
		assert.equal(config.compilerOptions.jsxImportSource, '@octane-xplat/jsx')
		assert.equal(config.compilerOptions.customConditions, undefined)
		if (targets.startsWith('web')) {
			assert.match(
				readFileSync(join(app, 'src/main.web.tsrx'), 'utf8'),
				/^\/\*\* @jsxImportSource @octane-xplat\/jsx\/dom \*\//,
			)
		}

		// Isolated consumer: only declared JSX dependencies are available. Copy
		// the facade payload to prevent its workspace peers masking missing deps.
		const modules = join(app, 'node_modules')
		mkdirSync(join(modules, '@octane-xplat'), { recursive: true })
		const jsx = join(modules, '@octane-xplat/jsx')
		mkdirSync(jsx)
		for (const name of ['src', 'package.json']) {
			cpSync(join(repo, 'packages/jsx', name), join(jsx, name), { recursive: true })
		}
		for (const name of [
			'octane',
			...(manifest.dependencies['@nativescript/core'] ? ['@nativescript/core'] : []),
		]) {
			assert.ok(manifest.dependencies[name])
			const destination = join(modules, name)
			mkdirSync(dirname(destination), { recursive: true })
			symlinkSync(join(repo, 'packages/ui/node_modules', name), destination, 'dir')
		}
		writeFileSync(join(app, 'native.tsx'), native)
		writeFileSync(join(app, 'dom.web.tsx'), dom)
		const probe = {
			extends: './tsconfig.json',
			compilerOptions: { types: [] },
			files: ['native.tsx', 'dom.web.tsx'],
			include: [],
			exclude: [],
		}
		writeFileSync(join(app, 'tsconfig.probe.json'), JSON.stringify(probe))
		const tsc = join(repo, 'node_modules/typescript/bin/tsc')
		run(process.execPath, [tsc, '-p', 'tsconfig.probe.json'], app)

		// Manifest-based apps must preserve the same explicitly selected facade.
		// Their fixed suffix order can include targets beyond the app starter.
		const envOptions = { ...config.compilerOptions }
		delete envOptions.moduleSuffixes
		writeFileSync(
			join(app, 'tsconfig.envs.json'),
			JSON.stringify({
				extends: './tsconfig.probe.json',
				compilerOptions: { ...envOptions, types: [] },
				environments: { web: { files: ['native.tsx', 'dom.web.tsx'] } },
			}),
		)
		const [program] = expandEnvPrograms(app, loadEnvManifest(app))
		run(process.execPath, [tsc, '-p', program.configPath], app)

		if (manifest.dependencies['@nativescript/core']) {
			writeFileSync(join(app, 'native.tsx'), concreteNative)
			probe.compilerOptions.customConditions = ['native']
			writeFileSync(join(app, 'tsconfig.probe.json'), JSON.stringify(probe))
			run(process.execPath, [tsc, '-p', 'tsconfig.probe.json'], app)
		}
	})
}

test('library creator keeps declaration and environment programs on the facade', (t) => {
	const root = mkdtempSync(join(tmpdir(), 'xplat-jsx-library-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const app = join(root, 'library')
	run(process.execPath, [creator, app, '--no-install', '--template', 'library'], root)
	const read = (file) => JSON.parse(readFileSync(join(app, file), 'utf8'))
	const source = read('tsconfig.json').compilerOptions.jsxImportSource
	const manifest = read('package.json')
	assert.equal(source, '@octane-xplat/jsx')
	assert.ok(manifest.devDependencies[source])
	assert.ok(manifest.peerDependencies[source])
	assert.equal(read('tsrx-typegen.json').targets.octane.renderer, source)
	const [program] = expandEnvPrograms(app, loadEnvManifest(app))
	assert.equal(
		JSON.parse(readFileSync(program.configPath, 'utf8')).compilerOptions.jsxImportSource,
		source,
	)
	assert.match(
		readFileSync(join(app, 'src/Badge.tsx'), 'utf8'),
		/^\/\*\* @jsxImportSource @octane-xplat\/jsx \*\//,
	)
	assert.match(
		readFileSync(join(app, 'src/Badge.web.tsx'), 'utf8'),
		/^\/\*\* @jsxImportSource @octane-xplat\/jsx\/dom \*\//,
	)
})

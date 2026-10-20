import { loadSource } from '../../../scripts/load-source.ts'
/** Packed native compiler/launch configuration checks. Never launches a host. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	mkdtempSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
	realpathSync,
	readdirSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
const repo = resolve(new URL('../../..', import.meta.url).pathname)
const work = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-mobile-packed-')))
const consumer = join(work, 'consumer')
const packs = join(work, 'packs')
mkdirSync(consumer)
mkdirSync(packs)
function run(command, args, cwd = consumer) {
	const r = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	assert.equal(r.status, 0, `${command} ${args.join(' ')}: ${r.stdout}\n${r.stderr}`)
	return r.stdout
}

const write = (file, body) => writeFileSync(join(consumer, file), body)
const tarballs = {}
for (const dir of ['cli', 'lib', 'ui', 'workshop']) {
	const root = join(repo, 'packages', dir)
	const p = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	run('pnpm', ['--config.ignore-scripts=true', 'pack', '--pack-destination', packs], root)
	tarballs[p.name] =
		`file:${join(packs, `${p.name.replace('@', '').replace('/', '-')}-${p.version}.tgz`)}`
}

write(
	'package.json',
	JSON.stringify({
		name: 'mobile-workshop-packed-check',
		private: true,
		type: 'module',
		main: 'main.ts',
		dependencies: {
			'@octane-xplat/ui': tarballs['@octane-xplat/ui'],
			'@nativescript/core': '9.1.3',
			'@nativescript-community/octane': '0.2.4',
			octane: '0.14.0',
		},
		devDependencies: {
			'@octane-xplat/workshop': tarballs['@octane-xplat/workshop'],
			'@octane-xplat/cli': tarballs['@octane-xplat/cli'],
			'@octanejs/vite-plugin': '0.1.61',
			'@tsrx/oxc': '0.20.0',
			'@tsrx/core': '0.2.4',
			'@nativescript/types': '9.1.4',
			typescript: '5.9.3',
			vite: '8.3.0',
		},
	}),
)

write(
	'pnpm-workspace.yaml',
	`packages: []\noverrides:\n${Object.entries(tarballs)
		.map(([name, path]) => `  '${name}': '${path}'`)
		.join('\n')}\n`,
)

run('pnpm', ['install', '--ignore-scripts'])
const req = createRequire(join(consumer, 'package.json'))
for (const name of ['ui', 'workshop', 'cli']) {
	assert.ok(realpathSync(join(consumer, 'node_modules/@octane-xplat', name)).startsWith(work))
}

for (const name of [
	'@octane-xplat/workshop',
	'@nativescript-community/octane',
	'@octanejs/vite-plugin',
]) {
	assert.equal(
		realpathSync(createRequire(req.resolve(name)).resolve('octane')),
		realpathSync(req.resolve('octane')),
	)
}

const load = (name) => import(pathToFileURL(req.resolve(name)).href)
const { build } = await load('vite')
const { octane } = await load('@octanejs/vite-plugin')
const { nativeScriptRenderer } = await load('@nativescript-community/octane/config')
const { withWorkshopMobile } = await load('@octane-xplat/workshop/vite-mobile')
const { WORKSHOP_CONTRACT_VERSION } = await loadSource(
	pathToFileURL(req.resolve('@octane-xplat/workshop')),
)

assert.equal(WORKSHOP_CONTRACT_VERSION, 1)
write('main.ts', `export const production = 'PRODUCTION_APP_ONLY'`)
write(
	'shared.stories.tsrx',
	`import { defineStory } from '@octane-xplat/workshop'
function Demo(p: {value: number}) { return <label text={'SHARED_NATIVE_STORY:' + p.value} /> }
export const Basic = defineStory({id:'shared/basic',title:'Shared / Basic',targets:'all',component:Demo,args:{value:1},controls:{value:{type:'number'}}})`,
)

write(
	'ios.stories.ios.tsrx',
	`import { defineStory } from '@octane-xplat/workshop'
function Demo() { return <label text="IOS_LEAF_ONLY" /> }
export const Basic = defineStory({id:'ios/only',title:'iOS only',targets:['ios'],component:Demo,args:{}})`,
)

write(
	'android.stories.android.tsrx',
	`import { defineStory } from '@octane-xplat/workshop'
function Demo() { return <label text="ANDROID_LEAF_ONLY" /> }
export const Basic = defineStory({id:'android/only',title:'Android only',targets:['android'],component:Demo,args:{}})`,
)

write(
	'web.stories.web.tsrx',
	`throw new Error('FOREIGN_WEB_MUST_NOT_LOAD'); export const Basic = defineStory({id:'web/only',title:'Web only',targets:['web'],component:C,args:{}})`,
)

const base = (target) => ({
	root: consumer,
	configFile: false,
	logLevel: 'error',
	plugins: octane({
		renderers: {
			registry: { nativescript: nativeScriptRenderer },
			rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
		},
	}),
	resolve: {
		conditions: ['native'],
		alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }],
	},
	build: {
		outDir: `out-${target}`,
		minify: false,
		lib: { entry: join(consumer, 'main.ts'), formats: ['es'] },
		rollupOptions: {
			external: [
				/^@nativescript(?:-community)?\//,
				/^@octane-xplat\/(?!workshop(?:\/|$))/,
				/^octane(?:\/|$)/,
				/^storybook(?:\/|$)/,
			],
		},
	},
})

const allJs = (dir) =>
	readdirSync(dir)
		.filter((p) => p.endsWith('.js'))
		.map((p) => readFileSync(join(dir, p), 'utf8'))
		.join('\n')

for (const target of ['ios', 'android']) {
	await build(withWorkshopMobile(base(target), { cwd: consumer, target, story: 'shared/basic' }))
	const code = allJs(join(consumer, `out-${target}`))
	assert.match(code, /SHARED_NATIVE_STORY/)
	assert.match(code, /defineUniversalComponent/)
	assert.match(code, new RegExp(target === 'ios' ? 'IOS_LEAF_ONLY' : 'ANDROID_LEAF_ONLY'))
	assert.doesNotMatch(code, new RegExp(target === 'ios' ? 'ANDROID_LEAF_ONLY' : 'IOS_LEAF_ONLY'))
	assert.doesNotMatch(code, /FOREIGN_WEB_MUST_NOT_LOAD/)
	assert.doesNotMatch(code, /PRODUCTION_APP_ONLY/)
	assert.doesNotMatch(
		code,
		/from ["']octane["']|document\.|window\./,
		'native source compiles without DOM runtime imports',
	)

	console.log(
		`PASS packed ${target} entry, actual NativeScript compiler branding, static leaf filtering (no host execution)`,
	)
}

await build(withWorkshopMobile(base('production')))
const production = allJs(join(consumer, 'out-production'))
assert.match(production, /PRODUCTION_APP_ONLY/)
assert.doesNotMatch(production, /SHARED_NATIVE_STORY|IOS_LEAF_ONLY|ANDROID_LEAF_ONLY|workshop/)
write(
	'typing.contract.ts',
	readFileSync(join(repo, 'packages/workshop/tests/typing.contract.ts'), 'utf8').replace(
		"'../src/contract'",
		"'@octane-xplat/workshop'",
	),
)

write(
	'mobile-types.ts',
	`import type { MobileWorkshopOptions, MobileWorkshopRuntime } from '@octane-xplat/workshop/mobile'
import { withWorkshopMobile } from '@octane-xplat/workshop/vite-mobile'
const options: MobileWorkshopOptions = {catalog: [], target: 'android'}
withWorkshopMobile({}, {target: options.target})
// @ts-expect-error browser is not a mobile host
const invalid: MobileWorkshopOptions = {catalog: [], target: 'web'}
let runtime!: MobileWorkshopRuntime
runtime.controller.control('value', 1)
`,
)

write(
	'tsconfig.json',
	JSON.stringify({
		compilerOptions: {
			strict: true,
			noEmit: true,
			module: 'ESNext',
			moduleResolution: 'Bundler',
			target: 'ES2022',
			skipLibCheck: true,
			types: ['@nativescript/types'],
		},
		files: ['typing.contract.ts', 'mobile-types.ts'],
	}),
)

run('pnpm', ['exec', 'tsc', '--noEmit'])
console.log(
	'PASS packed v1/negative types, single Octane, native source compilation without DOM imports, production excludes tooling/stories',
)

console.log('NO DEVICE LAUNCH: iOS and Android actual-host acceptance remains blocked')

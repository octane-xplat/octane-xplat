import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(root, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'xplat-bamboo-consumer-'))
const run = (cmd, args, cwd) => {
	const result = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
	if (result.status !== 0) {
		throw new Error(result.stdout + result.stderr)
	}
}

try {
	mkdirSync(join(temporary, 'pack'))
	mkdirSync(join(temporary, 'unpacked'))
	run('pnpm', ['pack', '--pack-destination', join(temporary, 'pack')], root)
	const tarball = readdirSync(join(temporary, 'pack')).find((name) => name.endsWith('.tgz'))
	run('tar', ['-xzf', join(temporary, 'pack', tarball), '-C', join(temporary, 'unpacked')], root)
	const packed = join(temporary, 'unpacked/package')
	const manifest = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'))

	// The published tarball must carry a typed surface for every export.
	for (const file of ['types/generated/config.d.ts', 'types/generated/vite.d.ts']) {
		assert.ok(existsSync(join(packed, file)), `packed tarball is missing ${file}`)
	}

	for (const subpath of ['.', './config', './vite']) {
		assert.equal(typeof manifest.exports[subpath], 'object', `${subpath} needs conditions`)
		assert.ok(manifest.exports[subpath].types, `${subpath} has no types condition`)
		assert.ok(manifest.exports[subpath].default, `${subpath} has no default condition`)
	}

	// Typecheck a consumer under bundler and nodenext resolution — the package
	// declarations stay separate from the executable JavaScript surface.
	for (const resolution of ['bundler', 'nodenext']) {
		const app = join(temporary, resolution)
		const modules = join(app, 'node_modules')
		mkdirSync(join(modules, '@octane-xplat'), { recursive: true })
		cpSync(packed, join(modules, '@octane-xplat/bamboo'), { recursive: true })
		for (const dep of ['preset-base', 'types', 'vite']) {
			cpSync(join(root, 'node_modules/@bamboocss', dep), join(modules, '@bamboocss', dep), {
				recursive: true,
				dereference: true,
			})
		}

		cpSync(join(root, 'node_modules/vite'), join(modules, 'vite'), {
			recursive: true,
			dereference: true,
		})

		writeFileSync(join(app, 'package.json'), '{"type":"module"}')
		writeFileSync(
			join(app, 'consumer.ts'),
			`import { xplatBambooConfig } from '@octane-xplat/bamboo'
import { xplatBamboo, type XplatBambooOptions } from '@octane-xplat/bamboo/vite'

const options: XplatBambooOptions = { native: true }
const plugins = xplatBamboo(options)
const layers: Record<string, string> = xplatBambooConfig.layers
void plugins; void layers
`,
		)

		writeFileSync(
			join(app, 'tsconfig.json'),
			JSON.stringify({
				compilerOptions: {
					strict: true,
					noEmit: true,
					module: resolution === 'nodenext' ? 'nodenext' : 'esnext',
					moduleResolution: resolution,
					target: 'esnext',
					types: [],
					skipLibCheck: true,
				},
				include: ['*.ts'],
			}),
		)

		run(
			process.execPath,
			[join(repo, 'node_modules/typescript/bin/tsc'), '-p', join(app, 'tsconfig.json')],
			app,
		)
	}

	// Install tarballs outside the workspace. A symlink back to src/ would
	// bypass Node's refusal to strip TypeScript below node_modules.
	const app = join(temporary, 'runtime')
	mkdirSync(app)
	const dependencies = {
		'@octane-xplat/bamboo': `file:${join(temporary, 'pack', tarball)}`,
		vite: '8.3.0',
		'@bamboocss/dev': '1.56.2',
	}
	const overrides = {}
	// Pack lib too: cli's dist imports ./server-boundary, a subpath the last
	// published @octane-xplat/lib does not export.
	for (const directory of ['cli', 'create', 'lint', 'lib']) {
		const pack = join(temporary, directory)
		mkdirSync(pack)
		run('pnpm', ['pack', '--pack-destination', pack], join(repo, 'packages', directory))
		const archive = readdirSync(pack).find((name) => name.endsWith('.tgz'))
		const name = JSON.parse(readFileSync(join(repo, 'packages', directory, 'package.json'))).name
		overrides[name] = `file:${join(pack, archive)}`
	}
	dependencies['@octane-xplat/cli'] = overrides['@octane-xplat/cli']
	writeFileSync(
		join(app, 'package.json'),
		JSON.stringify({ private: true, dependencies, pnpm: { overrides } }),
	)
	// pnpm overrides do not reach into file:-packed dependency graphs — rewrite
	// the packed cli's lib spec through the readPackage hook instead.
	writeFileSync(
		join(app, '.pnpmfile.cjs'),
		`module.exports = { hooks: { readPackage(pkg) {
			if (pkg.dependencies?.['@octane-xplat/lib']) {
				pkg.dependencies['@octane-xplat/lib'] = '${overrides['@octane-xplat/lib']}'
			}
			return pkg
		} } }\n`,
	)
	run('pnpm', ['install', '--ignore-scripts', '--config.auto-install-peers=false'], app)
	writeFileSync(
		join(app, 'vite.config.native.mts'),
		`
import { xplatBamboo } from '@octane-xplat/bamboo/vite'
import { xplatNative } from '@octane-xplat/cli/vite'
import { xplatBambooConfig } from '@octane-xplat/bamboo'
import { xplatPortablePreset } from '@octane-xplat/bamboo/config'
export default {
  plugins: xplatBamboo({ native: true }),
  define: {
    __packedNativePreset__: JSON.stringify(typeof xplatNative),
    __packedLayer__: JSON.stringify(xplatBambooConfig.layers.utilities),
    __packedPortable__: JSON.stringify(xplatPortablePreset.name),
  },
}
`,
	)
	writeFileSync(
		join(app, 'check.mjs'),
		`
import assert from 'node:assert/strict'
import { realpathSync } from 'node:fs'
import { loadConfigFromFile } from 'vite'
for (const specifier of ['@octane-xplat/bamboo', '@octane-xplat/bamboo/config', '@octane-xplat/bamboo/vite', '@octane-xplat/cli/vite']) {
  const resolved = import.meta.resolve(specifier)
  assert.match(realpathSync(new URL(resolved)), /node_modules/)
  assert.match(resolved, /\\.js$/)
  await import(specifier)
}
for (const loader of ['bundle', 'native', 'runner']) {
  const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, 'vite.config.native.mts', process.cwd(), 'silent', undefined, loader)
  assert.ok(loaded, loader)
  assert.equal(loaded.config.define.__packedNativePreset__, JSON.stringify('function'))
  assert.equal(loaded.config.define.__packedLayer__, JSON.stringify('xplat.utilities'))
  assert.equal(loaded.config.define.__packedPortable__, JSON.stringify('@octane-xplat/bamboo/portable'))
  assert.ok(loaded.config.plugins.some(plugin => plugin.name === 'xplat-bamboo:nativescript-entry-graph'))
}
`,
	)
	run(process.execPath, ['check.mjs'], app)

	console.log(
		'bamboo packed consumer: declarations, Node imports, and bundle/native/runner Vite config loading passed',
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

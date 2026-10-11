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
	// sources stay .ts, so the types condition is the only typed surface for
	// consumers that cannot resolve TypeScript entry points.
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

	console.log('bamboo packed declarations: types conditions resolve under bundler and nodenext')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

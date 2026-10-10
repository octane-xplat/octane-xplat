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
const temporary = mkdtempSync(join(tmpdir(), 'xplat-updates-consumer-'))
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
	for (const file of [
		'native/boot.java',
		'native/boot.m',
		'prepare.cjs',
		'types/generated/index.web.d.ts',
	]) {
		assert.ok(existsSync(join(packed, file)))
	}

	assert.equal(manifest.exports['.'].native, './src/index.ts')
	for (const target of ['web', 'ios', 'android', 'macos', 'linux', 'windows']) {
		const app = join(temporary, target)
		const modules = join(app, 'node_modules')
		mkdirSync(join(modules, '@octane-xplat'), { recursive: true })
		cpSync(packed, join(modules, '@octane-xplat/updates'), { recursive: true })
		writeFileSync(join(app, 'package.json'), '{"type":"module"}')
		cpSync(join(repo, 'examples/updates/startup.mobile.ts'), join(app, 'maintained-example.ts'))
		const guide = readFileSync(join(repo, 'docs/app/updates.md'), 'utf8')
		const snippets = [...guide.matchAll(/```ts\n([\s\S]*?)\n```/g)].map((match) => match[1])
		snippets.forEach((source, index) => writeFileSync(join(app, `snippet-${index}.ts`), source))
		writeFileSync(
			join(app, 'updates.ts'),
			snippets.find((source) => source.includes('export const updates')),
		)

		writeFileSync(
			join(app, 'startup.ts'),
			snippets.find((source) => source.includes('export function confirmStartup')),
		)

		writeFileSync(
			join(app, 'example.ts'),
			`import { createUpdates, type UpdateManifest } from '@octane-xplat/updates'
const client = createUpdates({ endpoint: 'https://updates.example.com', embeddedVersion: '1.0.0' })
const supported: boolean = client.supported
const check = client.check()
const install = (manifest: UpdateManifest) => client.install(manifest)
const status: string = client.status().currentVersion
void supported; void check; void install; void status
`,
		)

		writeFileSync(
			join(app, 'tsconfig.json'),
			JSON.stringify({
				compilerOptions: {
					strict: true,
					noEmit: true,
					module: 'esnext',
					moduleResolution: 'bundler',
					target: 'esnext',
					types: [],
					skipLibCheck: false,
					customConditions: [target === 'ios' || target === 'android' ? 'native' : target],
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

	console.log(
		'updates packed declarations: all six target conditions passed without native ambient types',
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

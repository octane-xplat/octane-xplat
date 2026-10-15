import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const temporary = mkdtempSync(join(tmpdir(), 'octane-library-consumer-'))

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	if (result.stdout) {
		process.stdout.write(result.stdout)
	}

	if (result.stderr) {
		process.stderr.write(result.stderr)
	}

	if (result.error) {
		throw result.error
	}

	assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`)
}

function installDirectory(root, name, destination) {
	const segments = name.split('/')
	const path = join(destination, 'node_modules', ...segments)
	mkdirSync(dirname(path), { recursive: true })
	cpSync(root, path, { recursive: true })
}

try {
	const pack = join(temporary, 'pack')
	const extracted = join(temporary, 'extracted')
	mkdirSync(pack)
	mkdirSync(extracted)
	run('pnpm', ['pack', '--pack-destination', pack], packageRoot)
	const tarball = readdirSync(pack).find((name) => name.endsWith('.tgz'))
	assert.ok(tarball)
	run('tar', ['-xzf', join(pack, tarball), '-C', extracted], temporary)
	const packed = join(extracted, 'package')
	const manifest = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'))
	assert.ok(manifest.exports['.'].web.default.startsWith('./src/'))
	assert.ok(manifest.exports['.'].native.default.startsWith('./src/'))
	assert.ok(manifest.exports['.'].web.types)
	assert.ok(manifest.exports['.'].native.types)

	for (const target of ['web', 'native']) {
		for (const mode of ['bundler', 'nodenext']) {
			const consumer = join(temporary, `${target}-${mode}`)
			mkdirSync(consumer)
			mkdirSync(join(consumer, 'node_modules'), { recursive: true })
			installDirectory(packed, sourceManifest.name, consumer)
			for (const dependency of [
				'octane',
				'@octane-xplat/ui',
				...(target === 'native'
					? ['@nativescript-community/octane', '@nativescript/core', '@nativescript/types']
					: []),
			]) {
				const source = join(packageRoot, 'node_modules', ...dependency.split('/'))
				const destination = join(consumer, 'node_modules', ...dependency.split('/'))
				mkdirSync(dirname(destination), { recursive: true })
				symlinkSync(source, destination, 'dir')
			}

			writeFileSync(join(consumer, 'package.json'), '{"type":"module"}')
			writeFileSync(
				join(consumer, 'consumer.tsx'),
				`import { Badge, type BadgeProps } from '${sourceManifest.name}'
const props: BadgeProps = { label: 'Ready' }
const element = <Badge {...props} />
// @ts-expect-error label is required
const missing = <Badge />
// @ts-expect-error label must be a string
const invalid = <Badge label={1} />
void element; void missing; void invalid
`,
			)

			writeFileSync(
				join(consumer, 'tsconfig.json'),
				JSON.stringify(
					{
						compilerOptions: {
							strict: true,
							noEmit: true,
							skipLibCheck: true,
							target: 'esnext',
							types: [],
							module: mode === 'bundler' ? 'esnext' : 'nodenext',
							moduleResolution: mode,
							jsx: 'react-jsx',
							jsxImportSource: target === 'native' ? '@nativescript-community/octane' : 'octane',
							customConditions: [target],
							moduleSuffixes: target === 'web' ? ['.web', ''] : ['.mobile', ''],
						},
						files: ['consumer.tsx'],
					},
					null,
					'\t',
				),
			)

			run(
				process.execPath,
				[join(packageRoot, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'],
				consumer,
			)

			const listed = spawnSync(
				process.execPath,
				[
					join(packageRoot, 'node_modules/typescript/bin/tsc'),
					'-p',
					'tsconfig.json',
					'--listFilesOnly',
				],
				{ cwd: consumer, encoding: 'utf8' },
			)

			assert.equal(listed.status, 0, listed.stderr)
			const implementation = listed.stdout
				.split('\n')
				.filter(
					(file) =>
						file.includes(`/node_modules/${sourceManifest.name}/src/`) && !file.endsWith('.d.ts'),
				)

			assert.deepEqual(
				implementation,
				[],
				'consumer types use declarations without package implementation',
			)
		}
	}

	console.log('packed consumer: web/native declarations pass Bundler and NodeNext')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

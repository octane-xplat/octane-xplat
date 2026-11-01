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
const temporary = mkdtempSync(join(tmpdir(), 'octane-icons-consumer-'))

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

try {
	const pack = join(temporary, 'pack')
	const extracted = join(temporary, 'extracted')
	mkdirSync(pack)
	mkdirSync(extracted)
	run('bun', ['pm', 'pack', '--destination', pack], packageRoot)
	const tarball = readdirSync(pack).find((name) => name.endsWith('.tgz'))
	assert.ok(tarball)
	run('tar', ['-xzf', join(pack, tarball), '-C', extracted], temporary)
	const packed = join(extracted, 'package')
	const manifest = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'))
	assert.equal(manifest.dependencies['@octane-xplat/ui'].startsWith('workspace:'), false)
	for (const condition of ['web', 'native', 'macos']) {
		const conditionExport = manifest.exports['.'][condition]
		const conditionTarget =
			typeof conditionExport === 'string' ? conditionExport : conditionExport?.default
		assert.ok(conditionTarget.startsWith('./src/'))
	}
	const macosComponent = readFileSync(join(packed, 'src/Icon.macos.tsrx'), 'utf8')
	assert.equal(
		macosComponent,
		readFileSync(join(packageRoot, 'src/Icon.macos.tsrx'), 'utf8'),
		'packed components retain authored source',
	)

	for (const target of ['web', 'native', 'macos']) {
		for (const mode of ['bundler', 'nodenext']) {
			const consumer = join(temporary, `${target}-${mode}`)
			const modules = join(consumer, 'node_modules')
			mkdirSync(join(modules, '@octane-xplat'), { recursive: true })
			cpSync(packed, join(modules, '@octane-xplat/icons'), { recursive: true })
			for (const dependency of [
				'octane',
				'@iconify/types',
				...(target === 'native' ? ['@nativescript-community/octane'] : []),
				...(target === 'macos' ? ['@octane-xplat/jsx', '@octane-xplat/macos-renderer'] : []),
			]) {
				const destination = join(modules, dependency)
				mkdirSync(dirname(destination), { recursive: true })
				symlinkSync(join(packageRoot, 'node_modules', dependency), destination, 'dir')
			}

			writeFileSync(join(consumer, 'package.json'), '{"type":"module"}')
			writeFileSync(
				join(consumer, 'consumer.tsx'),
				`
import { Icon, addCollection, addIcon, addIcons, resolveIcon, iconToSvg, type IconProps, type IconifyIcon, type IconifyJSON } from '@octane-xplat/icons'
const collection: IconifyJSON = { prefix: 'app', icons: { arrow: { body: '<path d="M0 0h16"/>' } } }
addCollection(collection)
const data = resolveIcon('app:arrow')
if (data) iconToSvg(data, { size: 20, color: 'red', rotate: 1 })
const props: IconProps = { name: 'app:arrow', size: 20, label: 'Next', hFlip: true }
const element = <Icon {...props} />
const byValue: IconifyIcon = { body: '<path d="M0 0h8"/>' }
addIcon('app:direct', byValue)
addIcons({ 'app:bulk': byValue })
const valueElement = <Icon icon={byValue} label="Direct" />
const bothElement = <Icon name="app:arrow" icon={byValue} />
// @ts-expect-error a name or icon value is required
const missing = <Icon size={20} />
// @ts-expect-error icon takes IconifyIcon data, not a name string
const badIcon = <Icon icon="app:arrow" />
// @ts-expect-error dimensions are numbers on every target
const invalid = <Icon name="app:arrow" size="1em" />
void element; void missing; void invalid; void valueElement; void bothElement; void badIcon
`,
			)

			writeFileSync(
				join(consumer, 'tsconfig.json'),
				JSON.stringify({
					compilerOptions: {
						strict: true,
						noEmit: true,
						skipLibCheck: true,
						target: 'esnext',
						types: [],
						module: mode === 'bundler' ? 'esnext' : 'nodenext',
						moduleResolution: mode,
						jsx: 'react-jsx',
						jsxImportSource:
							target === 'native'
								? '@nativescript-community/octane'
								: target === 'macos'
									? '@octane-xplat/jsx'
									: 'octane',
						customConditions: [target],
						moduleSuffixes:
							target === 'web'
								? ['.web', '']
								: target === 'macos'
									? ['.macos', '']
									: ['.mobile', ''],
					},
					files: ['consumer.tsx'],
				}),
			)

			run(
				process.execPath,
				[join(packageRoot, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'],
				consumer,
			)
		}
	}

	console.log('icons packed consumer: web/native/macos declarations pass Bundler and NodeNext')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

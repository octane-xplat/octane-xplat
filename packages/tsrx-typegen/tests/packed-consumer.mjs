import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdtempSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../typegen-fixture')
const root = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'tsrx-typegen-packed-'))
const packageOutput = join(temporary, 'package')
const consumerRoot = join(temporary, 'consumer')
const packOutput = join(temporary, 'pack')
mkdirSync(packageOutput, { recursive: true })
mkdirSync(consumerRoot, { recursive: true })
mkdirSync(packOutput, { recursive: true })

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
	if (result.stdout) {process.stdout.write(result.stdout)}
	if (result.stderr) {process.stderr.write(result.stderr)}
	if (result.status !== 0) {throw new Error(`${command} exited with ${result.status}`)}
}

try {
	run('pnpm', ['pack', '--pack-destination', packOutput], packageRoot)
	const tarball = readdirSync(packOutput).find((name) => name.endsWith('.tgz'))
	assert.ok(tarball, 'pnpm pack produced a tarball')
	run('tar', ['-xzf', join(packOutput, tarball), '-C', packageOutput], temporary)
	const extracted = join(packageOutput, 'package')
	const packedManifest = JSON.parse(readFileSync(join(extracted, 'package.json'), 'utf8'))
	const typeEntry = packedManifest.exports['.'].types
	assert.ok(readFileSync(join(extracted, typeEntry), 'utf8'), 'the public type entry is packed')

	const modules = join(consumerRoot, 'node_modules')
	mkdirSync(modules, { recursive: true })
	const packageLink = join(modules, packedManifest.name)
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(extracted, packageLink, { recursive: true })
	symlinkSync(join(packageRoot, 'node_modules/octane'), join(modules, 'octane'), 'dir')
	writeFileSync(
		join(consumerRoot, 'consumer.ts'),
		`
import { Badge, Box, Card, createBadge, decode, type BoxProps } from '${packedManifest.name}'
import { format } from '${packedManifest.name}/format'
const props: BoxProps<number> = { value: 42 }
Box(props)
Badge({ label: 'ready', tone: 'quiet' })
Card({ title: 'surface' })
Card.Header({ text: 'title' })
createBadge('fallback')({ label: 'explicit' })
decode(42).value.toFixed()
format(props.value).toFixed()
// @ts-expect-error value is required
Box({})
// @ts-expect-error inline label prop is required
Badge({})
// @ts-expect-error compound member keeps its own props
Card.Header({ text: 42 })
// @ts-expect-error factory component keeps its prop contract
createBadge('fallback')({ label: 42 })
// @ts-expect-error overloads preserve accepted inputs
decode(false)
// @ts-expect-error generic result stays numeric
const value: string = format(props.value)
void value
`,
	)

	for (const mode of [
		{ name: 'bundler', module: 'esnext', moduleResolution: 'bundler' },
		{ name: 'nodenext', module: 'nodenext', moduleResolution: 'nodenext' },
	]) {
		const configPath = join(consumerRoot, `tsconfig.${mode.name}.json`)
		writeFileSync(
			configPath,
			JSON.stringify(
				{
					compilerOptions: {
						strict: true,
						noEmit: true,
						module: mode.module,
						moduleResolution: mode.moduleResolution,
						target: 'esnext',
						skipLibCheck: false,
					},
					files: ['consumer.ts'],
				},
				null,
				2,
			),
		)

		run(
			process.execPath,
			[join(root, 'node_modules/typescript/bin/tsc'), '--project', configPath],
			consumerRoot,
		)
	}

	const generatedEntry = join(packageRoot, 'types/generated/index.d.ts')
	const generatedOriginal = readFileSync(generatedEntry, 'utf8')
	const stale = `${generatedOriginal}\n// stale output probe\n`
	try {
		writeFileSync(generatedEntry, stale)
		const check = spawnSync(
			process.execPath,
			[
				join(root, 'packages/tsrx-typegen/src/cli.mjs'),
				'--project',
				'tsconfig.types.json',
				'--check',
			],
			{ cwd: packageRoot, encoding: 'utf8' },
		)

		assert.notEqual(check.status, 0, 'check mode rejects stale declarations')
		assert.match(check.stderr, /index\.d\.ts is stale/)
		assert.equal(readFileSync(generatedEntry, 'utf8'), stale, 'check mode does not rewrite output')
	} finally {
		writeFileSync(generatedEntry, generatedOriginal)
	}

	run('pnpm', ['typegen:check'], packageRoot)
	run('pnpm', ['exec', 'tsrx-typegen', '--target', 'octane', '--check'], packageRoot)

	const collidingSources = [
		join(packageRoot, 'src/Collision.ts'),
		join(packageRoot, 'src/Collision.tsrx'),
	]

	try {
		for (const source of collidingSources) {writeFileSync(source, 'export {}\n')}
		const collision = spawnSync(
			process.execPath,
			[
				join(root, 'packages/tsrx-typegen/src/cli.mjs'),
				'--project',
				'tsconfig.types.json',
			],
			{ cwd: packageRoot, encoding: 'utf8' },
		)

		assert.notEqual(collision.status, 0, 'same-name source files cannot overwrite declarations')
		assert.match(collision.stderr, /source output collision/)
	} finally {
		for (const source of collidingSources) {rmSync(source, { force: true })}
	}

	const overrideConfigPath = join(packageRoot, 'tsrx-typegen.json')
	const originalConfig = readFileSync(overrideConfigPath, 'utf8')
	const overrideSource = join(packageRoot, 'types/overrides/Collision.d.ts')
	const overrideText = "export interface CollisionContract { kind: 'override' }\n"
	try {
		for (const source of collidingSources) {writeFileSync(source, 'export {}\n')}
		mkdirSync(dirname(overrideSource), { recursive: true })
		writeFileSync(overrideSource, overrideText)
		const config = JSON.parse(originalConfig)
		config.overrides = { 'Collision.d.ts': 'types/overrides/Collision.d.ts' }
		writeFileSync(overrideConfigPath, JSON.stringify(config, null, 2) + '\n')
		run(
			process.execPath,
			[
				join(root, 'packages/tsrx-typegen/src/cli.mjs'),
				'--project',
				'tsconfig.types.json',
			],
			packageRoot,
		)

		assert.equal(
			readFileSync(join(packageRoot, 'types/generated/Collision.d.ts'), 'utf8'),
			overrideText,
		)

		run('pnpm', ['typegen:check'], packageRoot)
	} finally {
		writeFileSync(overrideConfigPath, originalConfig)
		for (const source of collidingSources) {rmSync(source, { force: true })}
		rmSync(overrideSource, { force: true })
	}

	run('pnpm', ['typegen'], packageRoot)

	const invalidSource = join(packageRoot, 'src/Invalid.tsrx')
	const generatedBeforeFailure = readFileSync(generatedEntry, 'utf8')
	try {
		writeFileSync(invalidSource, 'export function Invalid( {\n')
		const failedTransform = spawnSync(
			process.execPath,
			[
				join(root, 'packages/tsrx-typegen/src/cli.mjs'),
				'--project',
				'tsconfig.types.json',
			],
			{ cwd: packageRoot, encoding: 'utf8' },
		)

		assert.notEqual(failedTransform.status, 0, 'transform diagnostics prevent declaration output')
		assert.match(failedTransform.stderr, /tsrx compiler reported transform diagnostics/)
		assert.equal(readFileSync(generatedEntry, 'utf8'), generatedBeforeFailure)
	} finally {
		rmSync(invalidSource, { force: true })
	}

	run('pnpm', ['typegen:check'], packageRoot)

	const factorySource = join(packageRoot, 'src/Factory.tsrx')
	const factoryConsumer = join(consumerRoot, 'factory-consumer.ts')
	const factoryConfig = join(consumerRoot, 'tsconfig.factory.json')
	try {
		writeFileSync(
			factorySource,
			`export function createBadge(defaultLabel: string) {
	return function Badge(props: { label?: string }) @{
		<span>{props.label ?? defaultLabel}</span>
	}
}
`,
		)

		const factoryResult = spawnSync(
			process.execPath,
			[
				join(root, 'packages/tsrx-typegen/src/cli.mjs'),
				'--project',
				'tsconfig.types.json',
			],
			{ cwd: packageRoot, encoding: 'utf8' },
		)

		if (factoryResult.status === 0) {
			writeFileSync(
				factoryConsumer,
				`import { createBadge } from ${JSON.stringify(join(packageRoot, 'types/generated/Factory.js'))}
const Badge = createBadge('fallback')
Badge({ label: 'explicit' })
// @ts-expect-error factory component keeps its prop contract
Badge({ label: 42 })
`,
			)

			writeFileSync(
				factoryConfig,
				JSON.stringify(
					{
						compilerOptions: {
							strict: true,
						noEmit: true,
						module: 'esnext',
						moduleResolution: 'bundler',
						target: 'esnext',
						skipLibCheck: false,
						},
						files: ['factory-consumer.ts'],
					},
					null,
					2,
				),
			)

			run(
				process.execPath,
				[join(root, 'node_modules/typescript/bin/tsc'), '--project', factoryConfig],
				consumerRoot,
			)
		} else {
			assert.match(factoryResult.stderr, /explicit declaration override/)
		}
	} finally {
		rmSync(factoryConsumer, { force: true })
		rmSync(factoryConfig, { force: true })
	}

	run('pnpm', ['typegen'], packageRoot)

	console.log('packed consumer: declarations resolve with plain TypeScript in bundler and NodeNext modes')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

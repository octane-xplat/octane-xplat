import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
	mkdtempSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
	symlinkSync,
	rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const temporary = mkdtempSync(join(tmpdir(), 'xplat-shortcuts-consumer-'))
const run = (command, args, cwd = temporary) =>
	execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: 90_000,
		maxBuffer: 4 * 1024 * 1024,
	})
try {
	run('pnpm', ['pack', '--config.ignore-scripts=true', '--pack-destination', temporary], root)
	const tarball = readdirSync(temporary).find((name) => name.endsWith('.tgz'))
	run('tar', ['-xzf', join(temporary, tarball), '-C', temporary])
	const scope = join(temporary, 'node_modules/@octane-xplat')
	mkdirSync(scope, { recursive: true })
	symlinkSync(join(temporary, 'package'), join(scope, 'shortcuts'), 'dir')
	mkdirSync(join(temporary, 'package/node_modules/@casbin'), { recursive: true })
	symlinkSync(
		join(root, 'node_modules/@casbin/expression-eval'),
		join(temporary, 'package/node_modules/@casbin/expression-eval'),
		'dir',
	)
	writeFileSync(join(temporary, 'package.json'), JSON.stringify({ type: 'module' }))
	writeFileSync(
		join(temporary, 'consumer.ts'),
		`
import { createShortcuts, type ShortcutEvent, type ShortcutRuntime } from '@octane-xplat/shortcuts'
export function install(target: object): ShortcutRuntime {
 const shortcuts = createShortcuts({target, platform:'mac'})
 const set = shortcuts.createBindingSet()
 set.replace([{combo:'Mod+KeyK', handler: match => console.log(match.matchedScope)}])
 shortcuts.setContext('editor.ready',true)
 shortcuts.isAvailable({scope:'editor',when:'editor.ready'})
 return shortcuts
}
export function inspect(shortcuts: ShortcutRuntime, event: ShortcutEvent) {return shortcuts.explain(event)}
`,
	)
	for (const condition of ['web', 'browser', 'macos', 'gtk', 'windows', 'native']) {
		for (const mode of ['Bundler', 'NodeNext']) {
			writeFileSync(
				join(temporary, 'tsconfig.json'),
				JSON.stringify({
					compilerOptions: {
						strict: true,
						noEmit: true,
						target: 'ES2022',
						lib: ['ES2022'],
						types: [],
						module: mode === 'Bundler' ? 'ESNext' : 'NodeNext',
						moduleResolution: mode,
						customConditions: [condition],
						skipLibCheck: false,
					},
					files: ['consumer.ts'],
				}),
			)
			// The consumer intentionally has no DOM or platform ambient types.
			writeFileSync(
				join(temporary, 'console.d.ts'),
				'declare const console: { log(...args: unknown[]): void }\n',
			)
			const config = JSON.parse(readFileSync(join(temporary, 'tsconfig.json')))
			config.files.push('console.d.ts')
			writeFileSync(join(temporary, 'tsconfig.json'), JSON.stringify(config))
			run(process.execPath, [
				join(root, 'node_modules/typescript/bin/tsc'),
				'-p',
				join(temporary, 'tsconfig.json'),
			])
		}
		const resolved = run(process.execPath, [
			`--conditions=${condition}`,
			'--input-type=module',
			'-e',
			"console.log(import.meta.resolve('@octane-xplat/shortcuts'))",
		])
		assert.match(
			resolved,
			new RegExp(
				`index${condition === 'native' ? '' : condition === 'browser' ? '\\.web' : `\\.${condition}`}\\.js`,
			),
		)
	}
	for (const condition of ['macos', 'gtk', 'windows']) {
		const resolved = run(process.execPath, [
			'--conditions=browser',
			`--conditions=${condition}`,
			'--input-type=module',
			'-e',
			"console.log(import.meta.resolve('@octane-xplat/shortcuts'))",
		])
		assert.ok(
			resolved.trim().endsWith(`index.${condition}.js`),
			'Native host must win over Vite browser defaults',
		)
	}
	run(process.execPath, [
		'--input-type=module',
		'-e',
		`
import {createShortcuts} from '@octane-xplat/shortcuts'
try { createShortcuts({target:{}}); throw Error('unexpected support') }
catch(error) { if(!error.message.includes('host condition')) throw error }
`,
	])
	console.log(
		'Packed consumer: six conditions × Bundler/NodeNext, closed ambient-free declarations, ESM resolution and unsupported-host failure passed.',
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

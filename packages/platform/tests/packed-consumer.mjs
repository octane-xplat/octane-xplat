// Exercise the published package with the same esbuild version Vite vendors.
// No workspace aliases or .tsrx loaders are available in this consumer.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, readFileSync, renameSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporary = mkdtempSync(join(tmpdir(), 'xplat-platform-vendor-'))
const modules = join(temporary, 'node_modules/@octane-xplat')
mkdirSync(modules, { recursive: true })

try {
	execFileSync('pnpm', ['pack', '--pack-destination', temporary], { cwd: root, stdio: 'pipe' })
	const tarball = readdirSync(temporary).find((file) => file.endsWith('.tgz'))
	execFileSync('tar', ['-xzf', join(temporary, tarball), '-C', modules])
	renameSync(join(modules, 'package'), join(modules, 'platform'))
	for (const target of ['native', 'web', 'linux', 'macos']) {
		const subpaths = ['', '/host', '/host/web', '/host/services']
		if (target === 'native') {
			subpaths.push('/testing')
		}

		if (target !== 'macos') {
			for (const service of ['screen', 'safe-area', 'lifecycle', 'breakpoints']) {
				subpaths.push(`/${service}`, `/${service}.ts`, `/${service}.tsrx`)
				if (target === 'web') {
					subpaths.push(`/${service}.web`, `/${service}.web.ts`, `/${service}.web.tsrx`)
				}
			}
		}

		const result = await build({
			stdin: {
				contents: subpaths
					.map(
						(subpath, index) =>
							`import * as entry${index} from '@octane-xplat/platform${subpath}'; console.log(entry${index});`,
					)
					.join('\n'),
				resolveDir: temporary,
			},
			bundle: true,
			write: false,
			format: 'esm',
			platform: 'neutral',
			conditions: [target, 'import', 'default'],
			external: ['octane', 'octane/*', '@nativescript/*', '@nativescript-community/*', 'vitest'],
			metafile: true,
		})

		assert.ok(
			Object.keys(result.metafile.inputs).every(
				(file) => file === '<stdin>' || file.endsWith('.js'),
			),
			'vendor pass consumes only compiled JavaScript',
		)

		if (target === 'native') {
			assert.match(result.outputFiles[0].text, /@nativescript-community\/octane/)
			assert.ok(
				!result.metafile.outputs['stdin.js'].imports.some((entry) => entry.path === 'octane'),
				'native hook entries never import the DOM runtime',
			)
		}

		const manifest = JSON.parse(readFileSync(join(modules, 'platform/package.json'), 'utf8'))
		assert.ok(manifest.exports['.'])
		console.log(`platform packed vendor: ${target} root, host and hook entries bundle`)
	}
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(readFileSync(join(cli, 'package.json'), 'utf8'))
const root = mkdtempSync(join(tmpdir(), 'xplat-postcss-consumer-'))
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2))
const run = (command, args) =>
	execFileSync(command, args, { cwd: root, stdio: 'pipe', timeout: 120_000 })

try {
	// Install only the shipped CSS type surface and its dependencies. Copy the
	// actual public declaration entry, not a synthetic signature of xplatCss.
	const fixture = join(root, 'cli')
	mkdirSync(join(fixture, 'src'), { recursive: true })
	for (const file of ['vite.d.ts', 'css-platform.types.ts', 'css-platform.ts']) {
		copyFileSync(join(cli, 'src', file), join(fixture, 'src', file))
	}

	writeJson(join(fixture, 'package.json'), {
		name: manifest.name,
		version: manifest.version,
		type: 'module',
		exports: { './vite': manifest.exports['./vite'] },
		dependencies: {
			postcss: manifest.dependencies.postcss,
			'postcss-load-config': manifest.dependencies['postcss-load-config'],
		},
	})

	writeJson(join(root, 'package.json'), {
		private: true,
		type: 'module',
		dependencies: {
			'@octane-xplat/cli': 'file:./cli',
			vite: '8.3.0',
			postcss: '8.5.31',
			typescript: '5.9.3',
			'@types/node': '24.10.1',
		},
	})

	writeFileSync(join(root, 'pnpm-workspace.yaml'), 'nodeLinker: isolated\n')
	run('pnpm', ['install', '--ignore-scripts'])
	const consumer = createRequire(join(root, 'package.json'))
	const vite = createRequire(consumer.resolve('vite'))
	const installedCli = realpathSync(join(root, 'node_modules/@octane-xplat/cli'))
	const cliRequire = createRequire(join(installedCli, 'src/css-platform.ts'))
	assert.equal(cliRequire('postcss/package.json').version, '8.5.28')
	assert.equal(vite('postcss/package.json').version, '8.5.31')
	assert.notEqual(cliRequire.resolve('postcss'), vite.resolve('postcss'))
	writeFileSync(
		join(root, 'consumer.ts'),
		`
import { defineConfig } from 'vite'
import { xplatCss, type CssPlatform } from '@octane-xplat/cli/vite'
const target: CssPlatform = 'web'
xplatCss()
// @ts-expect-error invalid build targets must still be rejected
xplatCss('typo')
export default defineConfig({
  plugins: [xplatCss(target)],
  css: { postcss: { map: { inline: false, annotation: false }, plugins: [
    { postcssPlugin: 'consumer', Declaration(decl) { decl.value = decl.value.trim() } }
  ] } }
})
`,
	)

	writeJson(join(root, 'tsconfig.json'), {
		compilerOptions: {
			target: 'ESNext',
			module: 'NodeNext',
			moduleResolution: 'NodeNext',
			strict: true,
			noEmit: true,
			skipLibCheck: false,
			types: ['node'],
			allowImportingTsExtensions: true,
		},
		files: ['consumer.ts'],
	})

	const tsc = join(dirname(consumer.resolve('typescript/package.json')), 'bin/tsc')
	// Negative control: the former public source re-export must expose the
	// reported comparison failure in this exact split-version installation.
	writeFileSync(
		join(root, 'source-reexport.ts'),
		`export { xplatCss } from ${JSON.stringify(join(installedCli, 'src/css-platform.ts'))}\n`,
	)

	writeJson(join(root, 'tsconfig.source-reexport.json'), {
		extends: './tsconfig.json',
		files: ['source-reexport.ts'],
	})

	assert.throws(
		() => run(process.execPath, [tsc, '-p', 'tsconfig.source-reexport.json']),
		(error) => {
			assert.match(error.stdout.toString(), /css-platform\.ts.*TS2321/)
			assert.match(error.stdout.toString(), /css-platform\.ts.*TS2322/)
			return true
		},
	)

	console.log('Former source re-export reproduces TS2321/TS2322')
	run(process.execPath, [tsc, '-p', 'tsconfig.json'])
	const files = run(process.execPath, [tsc, '-p', 'tsconfig.json', '--listFilesOnly']).toString()
	assert.match(files, /cli\/src\/vite\.d\.ts/)
	assert.doesNotMatch(files, /cli\/src\/css-platform\.ts/)
	console.log(
		'Consumer typecheck passed: CLI PostCSS 8.5.28; Vite PostCSS 8.5.31; skipLibCheck=false',
	)
} catch (error) {
	if (error.stdout) {
		process.stderr.write(error.stdout)
	}

	if (error.stderr) {
		process.stderr.write(error.stderr)
	}

	throw error
} finally {
	rmSync(root, { recursive: true, force: true })
}

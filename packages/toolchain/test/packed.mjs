import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('../../../', import.meta.url))
const scratch = join(homedir(), 'agent-scratch/octane-xplat/toolchain')
mkdirSync(scratch, { recursive: true })
const root = mkdtempSync(join(scratch, 'consumer-'))
const json = (file) => JSON.parse(readFileSync(file, 'utf8'))
const write = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
const run = (cmd, args, cwd = root) => {
	try {
		return execFileSync(cmd, args, { cwd, encoding: 'utf8', timeout: 180_000 })
	} catch (error) {
		process.stderr.write(error.stdout ?? '')
		process.stderr.write(error.stderr ?? '')
		throw error
	}
}

try {
	const workspaces = new Map(
		readdirSync(join(repo, 'packages')).map((directory) => {
			const path = join(repo, 'packages', directory)
			return [json(join(path, 'package.json')).name, path]
		}),
	)

	const overrides = {}
	const pack = (name) => {
		if (overrides[name]) {
			return
		}
		const path = workspaces.get(name)
		const pkg = json(join(path, 'package.json'))
		const tarball = join(root, `${name.replaceAll(/[@/]/g, '-')}.tgz`)
		run('bun', ['pm', 'pack', '--ignore-scripts', '--filename', tarball], path)
		overrides[name] = `file:${tarball}`
		for (const dependency of Object.keys(pkg.dependencies ?? {})) {
			if (workspaces.has(dependency)) {
				pack(dependency)
			}
		}
	}

	pack('octane-xplat')
	const { composeTargets } = await import('../../create/dist/scaffold.js')
	const app = join(root, 'app')
	composeTargets(['web'], app)
	const template = json(join(app, 'package.json'))
	const pins = template.workspaces.catalogs.xplat
	// A minimal app isolates the development toolchain from framework UI features.
	write(join(app, 'package.json'), {
		name: 'toolchain-consumer',
		private: true,
		type: 'module',
		packageManager: template.packageManager,
		dependencies: { octane: pins.octane },
		devDependencies: {
			'octane-xplat': overrides['octane-xplat'],
			'@tsrx/oxc': pins['@tsrx/oxc'],
			'@tsrx/content-mapper': pins['@tsrx/content-mapper'],
			vite: pins.vite,
		},
		overrides: { ...template.overrides, ...overrides },
		patchedDependencies: template.patchedDependencies,
	})

	writeFileSync(join(app, 'bunfig.toml'), '[install]\nlinker = "isolated"\n')
	writeFileSync(
		join(app, 'index.html'),
		'<div id="root"></div><script type="module" src="/main.web.tsrx"></script>',
	)

	writeFileSync(
		join(app, 'main.web.tsrx'),
		`import { createRoot } from 'octane'
function App() @{ <h1>Toolchain ready</h1> }
createRoot(document.getElementById('root')!).render(<App />)
`,
	)

	write(join(app, 'tsconfig.json'), {
		contentMappers: [{ package: '@tsrx/content-mapper', extensions: ['.tsrx'] }],
		compilerOptions: {
			strict: true,
			target: 'ESNext',
			module: 'ESNext',
			moduleResolution: 'bundler',
			jsx: 'preserve',
			jsxImportSource: 'octane',
			skipLibCheck: true,
			noEmit: true,
			types: ['vite/client'],
		},
		files: ['main.web.tsrx', 'vite.config.ts'],
	})

	writeFileSync(
		join(app, 'vite.config.ts'),
		`import { defineConfig, octane, xplatCss, xplatBoundary } from 'octane-xplat/vite'
export default defineConfig({ plugins: [xplatCss('web'), ...octane(), xplatBoundary('web')] })
`,
	)

	run('bun', ['install', '--ignore-scripts'], app)
	// These tools must work without direct app declarations or top-level links.
	for (const name of [
		'typescript',
		'@tsrx/typescript-plugin',
		'@octanejs/vite-plugin',
		'@octane-xplat/cli',
	]) {
		assert.throws(() => readFileSync(join(app, 'node_modules', name, 'package.json')))
	}

	assert.match(run('bun', ['run', 'xplat', '--help'], app), /typecheck/)
	run('bun', ['run', 'xplat', 'typecheck'], app)
	run('bun', ['run', 'xplat', 'lint'], app)
	run('bun', ['run', 'xplat', 'fmt'], app)
	run('bun', ['run', 'xplat', 'fmt', '--check'], app)
	run('bun', ['run', 'xplat', 'build', '--targets', 'web'], app)
	assert.match(readFileSync(join(app, 'dist/index.html'), 'utf8'), /assets/)
	writeFileSync(join(app, 'main.web.tsrx'), 'const broken: number = "wrong"\n')
	const failure = spawnSync('bun', ['run', 'xplat', 'typecheck'], {
		cwd: app,
		encoding: 'utf8',
		timeout: 30_000,
	})

	assert.notEqual(failure.status, 0)
	assert.match(failure.stdout + failure.stderr, /TS2322/)
	const starter = join(root, 'starter')
	composeTargets(['web'], starter)
	const starterManifest = json(join(starter, 'package.json'))
	for (const section of ['dependencies', 'devDependencies']) {
		for (const name of Object.keys(starterManifest[section] ?? {})) {
			if (workspaces.has(name)) {
				pack(name)
			}
		}
	}

	starterManifest.overrides = { ...starterManifest.overrides, ...overrides }
	write(join(starter, 'package.json'), starterManifest)
	writeFileSync(join(starter, 'bunfig.toml'), '[install]\nlinker = "isolated"\n')
	run('bun', ['install', '--ignore-scripts'], starter)
	run('bun', ['run', 'lint'], starter)
	run('bun', ['run', 'typecheck'], starter)
	run('bun', ['run', 'build'], starter)
	console.log('Generated packed web starter: install, lint, typecheck and build passed')
	console.log(
		'Packed isolated consumer: CLI, TSRX typecheck (positive and negative), lint, format, and web production build passed',
	)
} finally {
	rmSync(root, { recursive: true, force: true })
}

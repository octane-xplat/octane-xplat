#!/usr/bin/env node
// Packed-artifact consumer verification — proves a scaffolded starter app
// installs, lints, typechecks, and builds against the PACKED packages, not
// the workspace symlinks. This is the release-evidence path: whatever the
// starter exercises here is what `pnpm create octane-xplat` users get.
//
// Phases (each is a gate — the first failure stops the run):
//   build    pnpm -r build for every workspace package that defines one
//            (skip with --no-build; CI builds earlier in the same job)
//   pack     pnpm pack every publishable package into <work>/pack
//   scaffold run the PACKED create-octane-xplat bin with --no-install, then
//            rewrite every @octane-xplat/* specifier (dependencies,
//            devDependencies, pnpm-workspace.yaml configDependencies) to
//            file: tarballs
//   install  pnpm install in the consumer — isolated, outside the workspace
//   checks   pnpm lint, pnpm typecheck (web + native), pnpm build (web),
//            pnpm exec xplat doctor
//   smoke    --smoke web: playwright drives `vite preview` of the built app
//   native   --native ios,android: `ns build <platform>` inside the consumer
//   sim      --smoke-ios: install + launch the built .app on an iOS sim,
//            fail on crash or JS error output (debug-simulator artifact —
//            NOT evidence of signed store distribution)
//
// Env:
//   VERIFY_CONSUMER_DIR — reuse a work dir instead of a mkdtemp (kept afterwards)
//   PLAYWRIGHT_REQUIRED=0 — downgrade a missing playwright install to a skip
//
// Usage: node scripts/verify-consumer.mjs [--no-build] [--smoke web]
//        [--native ios,android] [--smoke-ios] [--keep]
import assert from 'node:assert/strict'
import { spawnSync, spawn } from 'node:child_process'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { lockstepPackages } from './publishable.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const flagValue = (name) => {
	const index = args.indexOf(`--${name}`)
	return index >= 0 ? args[index + 1] : undefined
}

const doBuild = !flag('no-build')
const smokeTargets = (flagValue('smoke') ?? '').split(',').filter(Boolean)
const nativeTargets = (flagValue('native') ?? '').split(',').filter(Boolean)
const smokeIos = flag('smoke-ios')
const keep = flag('keep') || Boolean(process.env.VERIFY_CONSUMER_DIR)

const work = process.env.VERIFY_CONSUMER_DIR
	? resolve(process.env.VERIFY_CONSUMER_DIR)
	: mkdtempSync(join(tmpdir(), 'xplat-consumer-'))

const packDir = join(work, 'pack')
// The dir basename becomes the Xcode project/target name — 'app' would
// collide with the platforms/ios/<name>/app JS payload dir inside the
// produced .app (xcodebuild "Multiple commands produce .../app.app/app").
const appDir = join(work, 'consumer-app')
const extractDir = join(work, 'create')
// A reused VERIFY_CONSUMER_DIR may hold a previous attempt's app/scaffold —
// reset those (the pack dir is rewritten in place anyway).
for (const dir of [appDir, extractDir]) {
	rmSync(dir, { recursive: true, force: true })
}

mkdirSync(packDir, { recursive: true })
mkdirSync(extractDir, { recursive: true })

const results = []
const record = (name, ok, detail = '') => {
	results.push({ name, ok, detail })
	console.log(`[verify] ${name}: ${ok ? 'OK' : 'FAIL'}${detail ? ` — ${detail}` : ''}`)
}

function run(command, argv, cwd, env = {}) {
	const result = spawnSync(command, argv, {
		cwd,
		env: { ...process.env, ...env },
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
	})

	if (result.stdout) {
		process.stdout.write(result.stdout)
	}

	if (result.stderr) {
		process.stderr.write(result.stderr)
	}

	if (result.error) {
		throw result.error
	}

	// A silent nonzero exit (e.g. a shim spawning a missing binary) is
	// undebuggable from CI logs — surface the process result itself.
	if (result.status !== 0) {
		console.error(
			`[verify] ${command} ${argv.join(' ')} → status=${result.status} signal=${result.signal} ` +
				`stdout=${result.stdout?.length ?? 0}B stderr=${result.stderr?.length ?? 0}B`,
		)
	}

	return result
}

async function gate(name, timeoutMs, fn) {
	try {
		const detail = await Promise.race([
			fn(),
			new Promise((_, reject) =>
				setTimeout(
					() => reject(new Error(`gate timed out after ${timeoutMs / 60000}m`)),
					timeoutMs,
				),
			),
		])

		record(name, true, detail ?? '')
	} catch (error) {
		record(name, false, String(error?.message ?? error).split('\n')[0])
		console.error(`[verify] ${name} failed:`, error)
		report()
		console.error(`[verify] work dir kept for inspection: ${work}`)
		// Drain piped stdout before exiting — process.exit drops queued async
		// writes, which lost the failing subprocess's output in CI logs.
		await Promise.all([
			new Promise((r) => process.stdout.write('', r)),
			new Promise((r) => process.stderr.write('', r)),
		])

		process.exit(1)
	}
}

function report() {
	const failed = results.filter((r) => !r.ok)
	console.log(
		`\n[verify] ${results.length - failed.length}/${results.length} gates passed` +
			(failed.length ? ` — FAILED: ${failed.map((f) => f.name).join(', ')}` : ''),
	)
}

const tarballName = (pkg) => `${pkg.name.replace(/^@/, '').replace('/', '-')}-${pkg.version}.tgz`

try {
	// ---- build ------------------------------------------------------------
	if (doBuild) {
		await gate('packages build (dist payloads the tarballs must carry)', 20 * 60 * 1000, () => {
			const r = run(
				'pnpm',
				['-r', '--filter', './packages/*', '--if-present', 'run', 'build'],
				repoRoot,
			)

			assert.equal(r.status, 0, 'pnpm -r build failed')
		})
	}

	// ---- pack -------------------------------------------------------------
	const tarballs = new Map()
	await gate('pnpm pack — publishable packages produce tarballs', 20 * 60 * 1000, () => {
		for (const pkg of lockstepPackages(repoRoot)) {
			const r = run('pnpm', ['pack', '--pack-destination', packDir], join(repoRoot, pkg.dir))
			assert.equal(r.status, 0, `pnpm pack failed for ${pkg.name}`)
			const expected = join(packDir, tarballName(pkg))
			assert.ok(existsSync(expected), `expected tarball ${tarballName(pkg)} for ${pkg.name}`)
			tarballs.set(pkg.name, expected)
		}

		return `${tarballs.size} tarballs`
	})

	// ---- scaffold via the packed create bin --------------------------------
	await gate('packed create-octane-xplat scaffolds a starter app', 60 * 1000, () => {
		const createTarball = tarballs.get('create-octane-xplat')
		assert.ok(createTarball, 'create-octane-xplat tarball missing')
		const r = run('tar', ['-xzf', createTarball, '-C', extractDir], work)
		assert.equal(r.status, 0, 'tar extract failed')
		const binPath = join(extractDir, 'package', 'index.mjs')
		assert.ok(existsSync(binPath), 'packed create bin missing')
		const runResult = run('node', [binPath, appDir, '--no-install'], work)
		assert.equal(runResult.status, 0, 'create bin exited nonzero')
		assert.ok(existsSync(join(appDir, 'package.json')), 'scaffold produced no package.json')
		assert.ok(existsSync(join(appDir, '.gitignore')), 'scaffold dropped gitignore rename')
	})

	// ---- repoint @octane-xplat/* at the tarballs ---------------------------
	const consumerManifestPath = join(appDir, 'package.json')
	await gate('consumer manifest rewritten to file: tarballs', 60 * 1000, () => {
		const manifest = JSON.parse(readFileSync(consumerManifestPath, 'utf8'))
		let rewritten = 0
		for (const section of ['dependencies', 'devDependencies']) {
			for (const dep of Object.keys(manifest[section] ?? {})) {
				if (!dep.startsWith('@octane-xplat/')) {
					continue
				}

				const tarball = tarballs.get(dep)
				assert.ok(tarball, `no tarball for consumer dep ${dep}`)
				manifest[section][dep] = `file:${tarball}`
				rewritten++
			}
		}

		writeFileSync(consumerManifestPath, JSON.stringify(manifest, null, 2) + '\n')

		// @octane-xplat/patches travels as a pnpm configDependency — that path
		// demands an exact registry semver (file: tarballs carry no integrity),
		// so the packed tarball can't stand in there. Materialize the tarball's
		// contents into node_modules/.pnpm-config instead and drop the
		// configDependencies entry; patchedDependencies then resolves the same
		// files a registry install would produce.
		const patchesTarball = tarballs.get('@octane-xplat/patches')
		assert.ok(patchesTarball, 'no tarball for @octane-xplat/patches')
		const configDir = join(appDir, 'node_modules', '.pnpm-config', '@octane-xplat', 'patches')
		mkdirSync(configDir, { recursive: true })
		const untar = run(
			'tar',
			['-xzf', patchesTarball, '-C', configDir, '--strip-components=1'],
			work,
		)

		assert.equal(untar.status, 0, 'patches tarball extraction failed')

		const workspaceFile = join(appDir, 'pnpm-workspace.yaml')
		const workspaceYaml = readFileSync(workspaceFile, 'utf8')
		const updated = workspaceYaml.replace(
			/\n?configDependencies:\n(\s+"[^"]+":\s*[^\n]+\n?)+/,
			'\n',
		)

		assert.notEqual(updated, workspaceYaml, 'configDependencies rewrite found no entry')
		writeFileSync(workspaceFile, updated)
		return `${rewritten} deps + materialized .pnpm-config`
	})

	// ---- install ------------------------------------------------------------
	await gate('pnpm install — consumer resolves registry + packed artifacts', 15 * 60 * 1000, () => {
		const r = run('pnpm', ['install'], appDir)
		assert.equal(r.status, 0, 'pnpm install failed')
	})

	await gate(
		'installed @octane-xplat/ui is the packed payload, not a workspace link',
		60 * 1000,
		() => {
			const installed = join(appDir, 'node_modules', '@octane-xplat', 'ui')
			assert.ok(existsSync(installed), '@octane-xplat/ui not installed')
			const resolved = realpathSync(installed)
			assert.ok(
				!resolved.startsWith(join(repoRoot, 'packages')),
				`ui resolves into the workspace: ${resolved}`,
			)

			// publishConfig swaps exports to dist — the packed artifact must carry it.
			assert.ok(existsSync(join(installed, 'dist')), 'packed ui has no dist/')
			assert.ok(existsSync(join(installed, 'dist', 'native')), 'packed ui has no dist/native')
		},
	)

	// ---- consumer gates ------------------------------------------------------
	for (const [name, argv] of [
		['pnpm lint', ['lint']],
		['pnpm typecheck (web + native)', ['typecheck']],
		['pnpm build — web bundle from packed ui', ['build']],
		['pnpm xplat doctor', ['exec', 'xplat', 'doctor']],
	]) {
		await gate(name, 10 * 60 * 1000, () => {
			const r = run('pnpm', argv, appDir)
			assert.equal(r.status, 0, `${name} exited ${r.status}`)
		})
	}

	// ---- optional browser smoke ---------------------------------------------
	if (smokeTargets.includes('web')) {
		await gate('browser smoke — packed ui renders the starter', 3 * 60 * 1000, async () => {
			// Grab a free port — stale previews from other runs hold fixed ports.
			const { createServer } = await import('node:net')
			const port = await new Promise((resolve) => {
				const server = createServer()
				server.listen(0, () => {
					const p = server.address().port
					server.close(() => resolve(p))
				})
			})

			const preview = spawn(
				'pnpm',
				['exec', 'vite', 'preview', '--port', String(port), '--strictPort'],
				{
					cwd: appDir,
					detached: true,
					stdio: ['ignore', 'pipe', 'pipe'],
				},
			)

			try {
				await new Promise((resolve, reject) => {
					const timer = setTimeout(
						() => reject(new Error('vite preview never printed Local')),
						30000,
					)

					preview.stdout.on('data', (chunk) => {
						if (String(chunk).includes('Local')) {
							clearTimeout(timer)
							resolve()
						}
					})

					preview.on('error', reject)
					preview.on('exit', (code) => reject(new Error(`vite preview exited ${code}`)))
				})

				await new Promise((resolve) => setTimeout(resolve, 500))

				const { createRequire } = await import('node:module')
				const require = createRequire(join(repoRoot, 'apps/web/package.json'))
				const { chromium } = require('playwright')
				const browser = await chromium.launch()
				const page = await browser.newPage()
				const errors = []
				page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
				page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`))

				await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle', timeout: 30000 })
				await page.waitForSelector('.title', { timeout: 10000 })
				assert.equal(await page.locator('.title').innerText(), 'octane-xplat')
				assert.equal(await page.locator('.count').innerText(), '0')
				await page.click('.btn:has-text("+")')
				assert.equal(await page.locator('.count').innerText(), '1')
				assert.equal(errors.length, 0, errors.join('; '))
				await browser.close()
			} finally {
				try {
					process.kill(-preview.pid, 'SIGTERM')
				} catch {
					preview.kill('SIGTERM')
				}
			}
		})
	}

	// ---- optional native builds + iOS sim smoke ------------------------------
	for (const platform of nativeTargets) {
		await gate(
			`ns build ${platform} — packed artifacts produce a native app`,
			30 * 60 * 1000,
			() => {
				const r = run(
					'pnpm',
					['exec', 'ns', 'build', platform],
					appDir,
					platform === 'android' && process.env.VERIFY_JAVA_HOME
						? { JAVA_HOME: process.env.VERIFY_JAVA_HOME }
						: {},
				)

				assert.equal(r.status, 0, `ns build ${platform} exited ${r.status}`)
			},
		)
	}

	if (smokeIos) {
		await gate(
			'iOS simulator smoke — packed build installs, launches, stays alive',
			5 * 60 * 1000,
			async () => {
				const buildDir = join(appDir, 'platforms', 'ios', 'build')
				assert.ok(existsSync(buildDir), 'no ios build output')
				const find = run('find', [buildDir, '-name', '*.app', '-type', 'd'], work)
				const appPath = find.stdout.trim().split('\n').find(Boolean)
				assert.ok(appPath, 'no .app under platforms/ios/build')

				const list = run('xcrun', ['simctl', 'list', 'devices', 'available', '-j'], work)
				const sim = Object.values(JSON.parse(list.stdout).devices)
					.flat()
					.find((d) => d.isAvailable && /iPhone/.test(d.name))

				assert.ok(sim, 'no available iPhone simulator')

				run('xcrun', ['simctl', 'bootstatus', sim.udid, '-b'], work) // waits; ok if already booted
				const install = run('xcrun', ['simctl', 'install', sim.udid, appPath], work)
				assert.equal(install.status, 0, `simctl install failed: ${install.stderr}`)

				const idMatch = readFileSync(join(appDir, 'nativescript.config.ts'), 'utf8').match(
					/id:\s*'([^']+)'/,
				)

				assert.ok(idMatch, 'could not read app id from nativescript.config.ts')
				const bundleId = idMatch[1]

				const launch = run('xcrun', ['simctl', 'launch', sim.udid, bundleId], work)
				assert.equal(launch.status, 0, `simctl launch failed: ${launch.stderr}`)
				const pid = Number(launch.stdout.match(/:\s*(\d+)/)?.[1] ?? 0)
				assert.ok(pid > 0, `no pid in launch output: ${launch.stdout}`)

				// Let the app run, then read its log — fatal/JS-error signatures fail.
				await new Promise((resolve) => setTimeout(resolve, 12000))
				const log = run(
					'xcrun',
					[
						'simctl',
						'spawn',
						sim.udid,
						'log',
						'show',
						'--last',
						'20s',
						'--style',
						'compact',
						'--predicate',
						`processID == ${pid}`,
					],
					work,
				)

				const services = run('xcrun', ['simctl', 'spawn', sim.udid, 'launchctl', 'list'], work)
				assert.ok(
					services.stdout.includes(bundleId),
					'app is not in launchctl list after 12s — it crashed or was killed',
				)

				assert.ok(
					!/fatal|Terminating|JavaScript error|JS ERROR|unhandled/i.test(log.stdout),
					`app log shows an error:\n${log.stdout.slice(-2000)}`,
				)

				run('xcrun', ['simctl', 'terminate', sim.udid, bundleId], work)
				return `booted ${sim.name}, pid ${pid}`
			},
		)
	}

	report()
} finally {
	if (!keep) {
		rmSync(work, { recursive: true, force: true })
	} else {
		console.log(`[verify] work dir kept at ${work}`)
	}
}

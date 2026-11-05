import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	readdirSync,
	realpathSync,
	cpSync,
	existsSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const binary = join(work, 'xplat-go-darwin-arm64-cli')
const commands = []
function put(file, value) {
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value))
}

function run(command, args, cwd, environment = {}) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: 240000,
		maxBuffer: 16 << 20,
		env: {
			...process.env,
			...environment,
			NODE_OPTIONS: '',
			NODE_PATH: '',
			MACOS_SIGNING_IDENTITY: '',
			MACOS_NOTARY_PROFILE: '',
			XPLAT_MACOS_SKIP_SIGNING: '0',
		},
	})
	assert.equal(result.status, 0, result.stdout + result.stderr + (result.error?.message ?? ''))
	commands.push({
		command,
		args,
		exitCode: result.status,
		stdout: result.stdout,
		stderr: result.stderr,
	})
	return result.stdout
}

test(
	'actual macOS worker produces a verified native app/DMG with a compiled C leaf',
	{ skip: process.platform !== 'darwin' || process.arch !== 'arm64', timeout: 600000 },
	async () => {
		const build = JSON.parse(readFileSync(binary + '.json'))
		const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
		assert.equal(sha(readFileSync(binary)), build.sha256)
		for (const [file, hash] of Object.entries(build.inputs)) {
			assert.equal(sha(readFileSync(join(root, file))), hash, file)
		}
		const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge')
		mkdirSync(base, { recursive: true })
		const scratch = realpathSync(mkdtempSync(join(base, 'macos-build-')))
		let complete = false
		let ownerCleanupFailure
		const runtimeCache = join(scratch, 'runtime-owner-cache')
		try {
			const packs = join(scratch, 'packs')
			mkdirSync(packs)
			const pack = (path) => {
				const dir = join(root, path)
				const manifest = JSON.parse(readFileSync(join(dir, 'package.json')))
				run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], dir)
				return join(
					packs,
					manifest.name.replace('@', '').replace('/', '-') + '-' + manifest.version + '.tgz',
				)
			}

			const worker = pack('packages/macos-build'),
				leaf = pack('packages/cli/test/fixtures/macos-native-leaves/c')

			const app = join(scratch, 'app')
			mkdirSync(app)
			const catalog = JSON.parse(readFileSync(join(root, 'package.json'))).workspaces.catalog
			put(join(app, 'package.json'), {
				name: 'go-macos-package-fixture',
				private: true,
				type: 'module',
				dependencies: {
					octane: catalog.octane,
					'@nativescript/macos-node-api': catalog['@nativescript/macos-node-api'],
					'xplat-native-c-fixture': 'file:' + leaf,
				},
				devDependencies: { vite: catalog.vite, '@octane-xplat/macos-build': 'file:' + worker },
				xplat: {
					targets: {
						macos: {
							runtime: 'appkit-node-api',
							package: {
								productName: 'Go CLI fixture',
								bundleIdentifier: 'org.octane.xplat.go-worker',
								executableName: 'previous',
								version: '0.1.0',
								minimumSystemVersion: '13.5',
								viteConfig: 'vite.config.mjs',
								bundleFile: 'dist/main.cjs',
							},
						},
					},
				},
			})

			put(
				join(app, 'src/main.macos.js'),
				`import '@nativescript/macos-node-api';console.log('GO_MACOS_VALUE='+xplat_c_value());`,
			)

			put(
				join(app, 'vite.config.mjs'),
				`export default{build:{outDir:'dist',lib:{entry:'src/main.macos.js',formats:['cjs'],fileName:'main'},rollupOptions:{external:['@nativescript/macos-node-api',/^node:/]}}}`,
			)

			run('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], app)
			const output = run(binary, ['build', '--targets', 'macos'], app)
			assert.match(output, /Build complete/)
			const runtimeEnvironment = {
				XPLAT_MCP_CACHE: runtimeCache,
				XPLAT_AGENT_HOST_IDLE_MS: '20000',
				XPLAT_AGENT_APP: '',
				XPLAT_AGENT_CLIENT: '',
				XPLAT_PERMISSIONS: '',
			}

			const runtimeArgs = ['--project', app, '--app', '.', '--json']
			const accepted = JSON.parse(
				run(
					binary,
					['runtime', 'build', '--platform', 'macos', ...runtimeArgs],
					app,
					runtimeEnvironment,
				),
			)

			assert.equal(accepted.ok, true)
			let job
			const deadline = Date.now() + 240000
			for (;;) {
				job = JSON.parse(
					run(
						binary,
						['job', 'status', accepted.data.job.jobId, ...runtimeArgs],
						app,
						runtimeEnvironment,
					),
				).data.job

				if (['succeeded', 'failed', 'cancelled'].includes(job.state)) {
					break
				}

				assert.ok(Date.now() < deadline, 'native macOS build job timed out')
				await delay(500)
			}

			assert.equal(job.state, 'succeeded', JSON.stringify(job))
			const release = join(app, 'artifacts/macos-universal'),
				bundle = join(release, 'previous.app'),
				image = join(release, 'previous-macos-universal.dmg')

			assert.ok(existsSync(join(bundle, 'Contents/MacOS/previous')))
			assert.ok(existsSync(image))
			run('codesign', ['--verify', '--deep', '--strict', bundle], app)
			run('plutil', ['-lint', join(bundle, 'Contents/Info.plist')], app)
			run('hdiutil', ['verify', image], app)
			cpSync(worker, join(work, 'macos-worker-' + sha(readFileSync(worker)) + '.tgz'))
			const executable = join(bundle, 'Contents/MacOS/previous')
			const architectures = run('lipo', ['-archs', executable], app)
			assert.match(architectures, /arm64/)
			assert.match(architectures, /x86_64/)
			put(join(work, 'build-macos-real-qualification.json'), {
				source: build.inputs,
				binarySha256: build.sha256,
				workerTarballBytes: readFileSync(worker).length,
				workerTarballSha256: sha(readFileSync(worker)),
				workerTarballFile: join(work, 'macos-worker-' + sha(readFileSync(worker)) + '.tgz'),
				executableBytes: readFileSync(executable).length,
				executableSha256: sha(readFileSync(executable)),
				architectures: architectures.trim(),
				dmgBytes: readFileSync(image).length,
				dmgSha256: sha(readFileSync(image)),
				commands,
				runtimeJob: job,
				scope:
					'Actual native C leaf compilation and universal app/DMG packaging through both foreground build and persistent runtime build/job status; no app launch or visual analysis.',
			})

			assert.equal(
				readdirSync(release).some((name) => name.startsWith('.xplat-macos-')),
				false,
			)

			console.info(
				'Actual macOS worker: compiled C leaf, signed app, verified DMG; no app launch or visual analysis.',
			)

			complete = true
		} finally {
			const ownerBase = join(runtimeCache, 'cli-go/owner-go-v1')
			if (existsSync(ownerBase)) {
				for (const name of readdirSync(ownerBase)) {
					const descriptor = join(ownerBase, name, 'owner.json')
					if (!existsSync(descriptor)) {
						continue
					}

					try {
						const value = JSON.parse(readFileSync(descriptor))
						const reply = await fetch(value.address, {
							method: 'POST',
							headers: {
								Authorization: 'Bearer ' + value.token,
								'X-Octane-Owner': value.generation,
							},
							body: JSON.stringify({ method: 'host.shutdown' }),
							signal: AbortSignal.timeout(5000),
						})

						assert.equal(reply.status, 200)
						const deadline = Date.now() + 10000
						while (existsSync(descriptor) && Date.now() < deadline) {
							await delay(50)
						}

						assert.equal(existsSync(descriptor), false, 'macOS native owner cleanup unconfirmed')
					} catch (error) {
						complete = false
						ownerCleanupFailure = error
						console.error('macOS runtime owner cleanup unconfirmed: ' + error)
					}
				}
			}

			if (complete) {
				rmSync(scratch, { recursive: true, force: true })
			} else {
				console.error('Failed macOS build fixture retained at ' + scratch)
			}

			if (ownerCleanupFailure) {
				throw ownerCleanupFailure
			}
		}
	},
)

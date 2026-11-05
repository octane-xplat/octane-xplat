// Run the maintained offscreen, text-protocol journey in an owned app copy.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	readdirSync,
	rmSync,
	symlinkSync,
	realpathSync,
} from 'node:fs'
import { join, resolve, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { scratchRun } from './scratch.mjs'
const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli/workshop-service')
test(
	'actual Go CLI runs the maintained macOS workshop journey without visual capture',
	{ skip: process.platform !== 'darwin' },
	() => {
		const binary = join(
			root,
			'research/go-cli/xplat-go-darwin-' +
				(process.arch === 'x64' ? 'amd64' : process.arch) +
				'-cli',
		)
		const build = JSON.parse(readFileSync(binary + '.json'))
		const sha = (b) => createHash('sha256').update(b).digest('hex')
		assert.equal(sha(readFileSync(binary)), build.sha256)
		for (const [file, hash] of Object.entries(build.inputs)) {
			assert.equal(sha(readFileSync(join(root, file))), hash, file)
		}
		const scratch = realpathSync(scratchRun(root, 'go-workshop-macos')),
			app = join(scratch, 'app π')
		const source = join(root, 'apps/workshop-demo')
		const inventory = {}
		mkdirSync(app)
		function copy(dir) {
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				if (['node_modules', 'dist', 'artifacts', '.git', '.cache'].includes(entry.name)) {
					continue
				}
				const file = join(dir, entry.name),
					dest = join(app, relative(source, file))
				if (entry.isDirectory()) {
					mkdirSync(dest, { recursive: true })
					copy(file)
				} else if (entry.isFile()) {
					const bytes = readFileSync(file)
					writeFileSync(dest, bytes)
					inventory[relative(source, file)] = sha(bytes)
				}
			}
		}
		try {
			copy(source)
			symlinkSync(realpathSync(join(source, 'node_modules')), join(app, 'node_modules'), 'dir')
			const journey = spawnSync(
				process.execPath,
				[join(root, 'apps/workshop-demo/scripts/e2e-macos.ts'), app],
				{
					cwd: app,
					encoding: 'utf8',
					timeout: 480000,
					maxBuffer: 8 * 1024 * 1024,
					env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '', XPLAT_WORKSHOP_CLI: binary },
				},
			)
			writeFileSync(join(work, 'macos-journey-output.txt'), journey.stdout + journey.stderr)
			writeFileSync(
				join(work, 'macos-journey-inputs.json'),
				JSON.stringify(
					{
						source,
						inventory,
						binarySha256: build.sha256,
						status: journey.status,
						signal: journey.signal,
					},
					null,
					2,
				),
			)
			assert.ifError(journey.error)
			assert.equal(journey.status, 0, (journey.stdout + journey.stderr).slice(-10000))
			assert.match(journey.stdout, /checks passed/)
			assert.deepEqual(
				readdirSync(app).filter((name) => name.startsWith('.xplat-go-profile-')),
				[],
			)
		} finally {
			rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
		}
	},
)

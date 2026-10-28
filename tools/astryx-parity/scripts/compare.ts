/** Parity entry point — builds and previews both sides, runs sameframe and
 *  the behavior probes, then writes artifacts/. Exits 1 on parity findings
 *  (expected until gaps close), 4 on capture/internal errors. */

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { build, preview, type PreviewServer } from 'vite'
import { runBehaviorProbes } from './behavior.ts'

const appDir = fileURLToPath(new URL('..', import.meta.url))
const artifacts = `${appDir}/artifacts`

const SIDES = [
	{ name: 'reference', config: `${appDir}/reference/vite.config.ts`, port: 4310 },
	{ name: 'candidate', config: `${appDir}/candidate/vite.config.ts`, port: 4311 },
] as const

async function serveSide(side: (typeof SIDES)[number]): Promise<PreviewServer> {
	await build({ configFile: side.config, logLevel: 'warn' })

	return preview({
		configFile: side.config,
		logLevel: 'warn',
		preview: { host: '127.0.0.1', port: side.port, strictPort: true },
	})
}

function runSameframe(): Promise<{ result: unknown; exitCode: number }> {
	// Async spawn is required: the vite preview servers live in this process,
	// and a synchronous spawn would freeze the event loop so Chromium's
	// requests to them never get answered.
	return new Promise((resolvePromise, reject) => {
		const child = spawn(
			'pnpm',
			['exec', 'sameframe', 'compare', '--config', 'sameframe.yaml', '--json'],
			{ cwd: appDir },
		)
		const stdout: Buffer[] = []
		const stderr: Buffer[] = []
		child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk))
		child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk))
		child.on('error', reject)
		child.on('close', (code) => {
			const out = Buffer.concat(stdout).toString('utf8')
			const err = Buffer.concat(stderr).toString('utf8')
			try {
				resolvePromise({ result: JSON.parse(out), exitCode: code ?? 4 })
			} catch {
				reject(
					new Error(`sameframe did not emit JSON on stdout (exit ${code}): ${err.slice(-2000)}`),
				)
			}
		})
	})
}

async function main() {
	const servers: PreviewServer[] = []
	let exitCode = 0

	try {
		for (const side of SIDES) {
			servers.push(await serveSide(side))
		}

		mkdirSync(`${artifacts}/behavior`, { recursive: true })

		const sameframe = await runSameframe()
		if (sameframe.exitCode > 1) {
			console.error(`sameframe capture/internal failure (exit ${sameframe.exitCode})`)
			writeFileSync(
				`${artifacts}/summary.json`,
				JSON.stringify({ sameframe, behavior: null }, null, '\t'),
			)

			exitCode = 4
			return
		}

		const behavior = await runBehaviorProbes(
			`http://127.0.0.1:${SIDES[0].port}`,
			`http://127.0.0.1:${SIDES[1].port}`,
		)

		writeFileSync(`${artifacts}/behavior/button.json`, JSON.stringify(behavior, null, '\t'))
		writeFileSync(
			`${artifacts}/summary.json`,
			JSON.stringify({ sameframe, behavior: { diffCount: behavior.diffs.length } }, null, '\t'),
		)

		const status = (sameframe.result as { status?: string })?.status
		if (status !== 'pass' || behavior.diffs.length > 0) {
			console.error(
				`parity findings: sameframe status=${status ?? 'unknown'}, ` +
					`behavior diffs=${behavior.diffs.length} — see artifacts/`,
			)

			exitCode = 1
		}
	} catch (error) {
		console.error(`astryx-parity internal error: ${error instanceof Error ? error.stack : error}`)
		exitCode = 4
	} finally {
		for (const server of servers) {
			await server.httpServer.close()
		}
	}

	process.exit(exitCode)
}

await main()

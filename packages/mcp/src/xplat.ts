// Thin transport over the Go `xplat` CLI: one implementation, two transports.
// The Go commands own discovery, sessions, diagnostics, actions and evidence;
// this module only spawns `xplat ... --json` and translates the contract
// envelope into the ToolOutcome shape the MCP tools already expose.

import { spawn } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { contractError } from './contracts/errors.ts'
import type { ContractError, ToolOutcome } from '../types/contracts/errors'

export interface XplatCall {
	/** Command path, e.g. ['session', 'status'] → `xplat session status`. */
	command: string[]
	/** `--flag value` entries; `true` emits the bare flag, undefined/false skips it. */
	flags?: Record<string, string | number | boolean | undefined>
	positionals?: string[]
	timeoutMs?: number
}

export interface XplatTransport {
	call(call: XplatCall): Promise<ToolOutcome<unknown>>
}

export interface XplatTransportOptions {
	workspaceRoot: string
	/** Bound app id — forwarded as `--app` on every call. */
	appId?: () => string | null
	/** Granted permission scopes forwarded via XPLAT_PERMISSIONS. */
	grants?: () => string[]
	/** Executable override (tests and development); default resolves the CLI bin. */
	executable?: () => string[] | null
	timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 60_000

/**
 * Resolve the `xplat` executable as argv prefix: an explicit
 * XPLAT_MCP_XPLAT path wins, then the installed @octane-xplat/cli bin
 * (native `bin/xplat.exe` after install, `bin/xplat.mjs` under Node in the
 * repo), then a bare `xplat` lookup on PATH.
 */
function resolveXplatArgv(): string[] {
	const explicit = process.env.XPLAT_MCP_XPLAT
	if (explicit) {
		return [explicit]
	}

	try {
		const require = createRequire(import.meta.url)
		const cliPackage = require.resolve('@octane-xplat/cli/package.json')
		const bin = join(dirname(cliPackage), 'bin')
		const native = join(bin, 'xplat.exe')
		if (existsSync(native) && statSync(native).size > 0 && statSync(native).isFile()) {
			return [native]
		}
		if (existsSync(join(bin, 'xplat.mjs'))) {
			return [process.execPath, join(bin, 'xplat.mjs')]
		}
	} catch {
		// Fall through to PATH resolution.
	}

	return ['xplat']
}

/** Build the full argv for one call; selection/workspace flags are appended here, not by callers. */
function argv(options: XplatTransportOptions, call: XplatCall): string[] {
	const argv = [...call.command]
	for (const [name, value] of Object.entries(call.flags ?? {})) {
		if (value === undefined || value === false) {
			continue
		}
		argv.push(`--${name}`)
		if (value !== true) {
			argv.push(String(value))
		}
	}
	for (const positional of call.positionals ?? []) {
		argv.push(positional)
	}
	argv.push('--json', '--project', options.workspaceRoot, '--client', 'xplat-mcp')
	const app = options.appId?.()
	if (app) {
		argv.push('--app', app)
	}
	return argv
}

/**
 * Parse the single contract envelope on stdout. A non-envelope payload or a
 * missing binary is a transport failure — never fabricated data.
 */
function parseEnvelope(stdout: string, stderr: string, exit: number | null): ToolOutcome<unknown> {
	let envelope: any
	try {
		envelope = JSON.parse(stdout)
	} catch {
		const detail = stderr.trim() || stdout.trim() || `exit ${exit ?? 'unknown'}`
		return {
			ok: false,
			error: contractError(
				'unavailable',
				`The xplat CLI did not produce a contract response: ${detail.slice(0, 400)}`,
				{
					recovery: {
						action: 'Check that the installed @octane-xplat/cli provides a working `xplat` executable.',
					},
				},
			),
		}
	}

	if (envelope.ok === true) {
		return { ok: true, data: envelope.data }
	}

	const error = envelope.error
	if (error && typeof error === 'object' && typeof error.code === 'string') {
		return { ok: false, error: error as ContractError }
	}
	return { ok: false, error: contractError('execution_failure', 'The xplat CLI failed without a contract error.') }
}

export function createXplatTransport(options: XplatTransportOptions): XplatTransport {
	const executable = options.executable ?? resolveXplatArgv

	return {
		call(call) {
			return new Promise((resolve) => {
				const prefix = executable()
				if (!prefix || prefix.length === 0) {
					resolve({
						ok: false,
						error: contractError('unavailable', 'No xplat executable is configured.', {
							recovery: { action: 'Install @octane-xplat/cli or set XPLAT_MCP_XPLAT.' },
						}),
					})
					return
				}

				const env = { ...process.env }
				const grants = options.grants?.()
				if (grants && grants.length > 0) {
					env.XPLAT_PERMISSIONS = grants.join(',')
				}

				const child = spawn(prefix[0], [...prefix.slice(1), ...argv(options, call)], {
					env,
					stdio: ['ignore', 'pipe', 'pipe'],
				})

				let stdout = ''
				let stderr = ''
				let finished = false
				const limit = 8 << 20
				const timer = setTimeout(() => {
					if (!finished) {
						finished = true
						child.kill('SIGKILL')
						resolve({
							ok: false,
							error: contractError('timeout', `xplat ${call.command.join(' ')} exceeded its time bound.`, {
								retryable: true,
							}),
						})
					}
				}, call.timeoutMs ?? options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

				child.stdout.setEncoding('utf8')
				child.stderr.setEncoding('utf8')
				child.stdout.on('data', (chunk: string) => {
					if (stdout.length < limit) {
						stdout += chunk
					}
				})
				child.stderr.on('data', (chunk: string) => {
					if (stderr.length < limit) {
						stderr += chunk
					}
				})
				child.on('error', (error: Error & { code?: string }) => {
					if (finished) {
						return
					}
					finished = true
					clearTimeout(timer)
					const missing = error.code === 'ENOENT'
					resolve({
						ok: false,
						error: contractError(
							missing ? 'unavailable' : 'execution_failure',
							missing
								? `The xplat executable is not installed: ${prefix[0]}`
								: `The xplat executable failed to start: ${error.message}`,
							{
								recovery: {
									action: missing
										? 'Install @octane-xplat/cli or point XPLAT_MCP_XPLAT at a built binary.'
										: 'Check the xplat installation.',
								},
							},
						),
					})
				})
				child.on('close', (code) => {
					if (finished) {
						return
					}
					finished = true
					clearTimeout(timer)
					resolve(parseEnvelope(stdout, stderr, code))
				})
			})
		},
	}
}

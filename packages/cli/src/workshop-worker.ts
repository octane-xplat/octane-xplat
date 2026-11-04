// Selected-project workshop inspection; no CLI parser or service lifetime here.
import { Console } from 'node:console'
import { lstatSync, realpathSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, sep } from 'node:path'
import { Writable } from 'node:stream'
import { pathToFileURL } from 'node:url'

function workshopEntry(project: string): string {
	const require = createRequire(join(project, 'package.json'))
	for (let at = project; ; at = dirname(at)) {
		const candidate = join(at, 'node_modules/@octane-xplat/workshop')
		let found = false
		try {
			lstatSync(candidate)
			found = true
		} catch (error) {
			if (error.code !== 'ENOENT') {
				throw error
			}
		}
		if (found) {
			const root = realpathSync(candidate)
			const entry = realpathSync(require.resolve('@octane-xplat/workshop/node'))
			if (!entry.startsWith(root + sep) || !statSync(entry).isFile()) {
				throw new Error(
					'Reinstall @octane-xplat/workshop: its Node entry must remain inside the selected package',
				)
			}
			return entry
		}
		if (dirname(at) === at) {
			break
		}
	}
	throw new Error(
		'Install @octane-xplat/workshop in the selected project: bun add -D @octane-xplat/workshop',
	)
}

export async function workshopInspection(request: Record<string, any>) {
	if (
		typeof request.json !== 'boolean' ||
		!['workshop-list', 'workshop-doctor'].includes(request.operation)
	) {
		throw new Error('Invalid workshop inspection request')
	}
	if (
		request.operation === 'workshop-list' &&
		(typeof request.target !== 'string' || request.target.length > 128)
	) {
		throw new Error('Expected workshop target string')
	}
	const project = realpathSync(process.cwd())
	const api = await import(pathToFileURL(workshopEntry(project)).href)
	const previous = globalThis.console
	const chunks: Buffer[] = []
	let size = 0
	const output = new Writable({
		write(chunk, _encoding, callback) {
			size += chunk.length
			if (size <= 8 * 1024 * 1024) {
				chunks.push(Buffer.from(chunk))
			}
			callback()
		},
	})
	globalThis.console = new Console({ stdout: output, stderr: process.stderr })
	try {
		const result =
			request.operation === 'workshop-list'
				? await api.workshopList({ cwd: project, target: request.target, json: request.json })
				: await api.workshopDoctor({ cwd: project, json: request.json })
		if (size > 8 * 1024 * 1024) {
			throw new Error('Workshop inspection output exceeds 8 MiB')
		}
		const resultJSON =
			request.operation === 'workshop-list' ? { target: request.target, ...result } : result
		if (request.json) {
			// The API prints its JSON as its final log. Preserve earlier loader/config
			// diagnostics on stderr without replaying the machine result there.
			const text = Buffer.concat(chunks).toString('utf8')
			const printed = JSON.stringify(resultJSON, null, 2) + '\n'
			process.stderr.write(text.endsWith(printed) ? text.slice(0, -printed.length) : text)
		}
		return {
			version: 1,
			project,
			operation: request.operation,
			exitCode: 0,
			stdout: request.json ? '' : Buffer.concat(chunks).toString('utf8'),
			result: resultJSON,
		}
	} catch (error) {
		if (request.json || error?.name !== 'WorkshopUsageError') {
			process.stderr.write(Buffer.concat(chunks).toString('utf8'))
		}
		if (error?.name !== 'WorkshopUsageError') {
			throw error
		}
		if (size > 8 * 1024 * 1024) {
			throw new Error('Workshop inspection output exceeds 8 MiB')
		}
		return {
			version: 1,
			project,
			operation: request.operation,
			exitCode: 1,
			stdout: request.json ? '' : Buffer.concat(chunks).toString('utf8'),
			error: error.message,
			result: null,
		}
	} finally {
		globalThis.console = previous
	}
}

export async function workshopInitPlan(request: Record<string, any>) {
	if (typeof request.scripts !== 'boolean') {
		throw new Error('Expected scripts boolean')
	}
	const project = realpathSync(process.cwd())
	const api = await import(pathToFileURL(workshopEntry(project)).href)
	if (typeof api.planWorkshopInit !== 'function') {
		throw new Error(
			'Update @octane-xplat/workshop in the selected project to provide initialization plan v1',
		)
	}
	return api.planWorkshopInit({ cwd: project, scripts: request.scripts })
}

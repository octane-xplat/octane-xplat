import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { windowsLaunchBlocker, windowsPreflight } from '../src/windows/preflight.mjs'
import { workshopDev, workshopDoctor } from '../src/node.mjs'

const roots = []
afterEach(() => {
	for (const root of roots.splice(0)) {
		rmSync(root, { recursive: true, force: true })
	}
})

function consumer({ complete = false, runtime = '0.1.0-alpha.144' } = {}) {
	const root = mkdtempSync(join(tmpdir(), 'workshop-windows-'))
	roots.push(root)
	writeFileSync(
		join(root, 'package.json'),
		JSON.stringify({ type: 'module', devDependencies: { '@nativescript/windows': runtime } }),
	)

	// This config must never evaluate during doctor or a blocked launch.
	writeFileSync(
		join(root, 'workshop.config.mjs'),
		'throw new Error("unexpected config evaluation")',
	)

	if (complete) {
		writeFileSync(join(root, 'nativescript.config.ts'), 'export default {}')
		mkdirSync(join(root, 'App_Resources/Windows'), { recursive: true })
		writeFileSync(join(root, 'App_Resources/Windows/Package.appxmanifest'), '<Package/>')
		for (const name of [
			'@nativescript/windows',
			'@nativescript/core',
			'@nativescript-community/octane',
			'@nativescript/vite',
			'nativescript',
			'vite',
		]) {
			const dir = join(root, 'node_modules', name)
			mkdirSync(dir, { recursive: true })
			writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version: '1.0.0' }))
		}
	}

	return root
}

describe('Windows setup evidence (simulated prerequisites, no WinUI runtime)', () => {
	it('requires a Windows host and skips all machine probes elsewhere', () => {
		const run = vi.fn(() => {
			throw new Error('must not execute')
		})

		const report = windowsPreflight(consumer({ complete: true }), { platform: 'darwin', run })
		expect(report.status).toBe('remote-host-required')
		expect(report.executionHost.reachable).toBe(false)
		expect(report.requirements).not.toHaveProperty('.NET SDK >= 10')
		expect(report.qualification).toBe('unverified')
		expect(run).not.toHaveBeenCalled()
		expect(windowsLaunchBlocker(report)).toMatch(/real Windows host.*No web fallback/)
	})

	it('separates setup failure from story failure', () => {
		const report = windowsPreflight(consumer(), { platform: 'win32', run: () => null })
		expect(report.status).toBe('missing-prerequisites')
		expect(report.requirements['.NET SDK >= 10']).toBe(false)
		expect(report.requirements['Developer Mode (development launch)']).toBe(false)
		expect(windowsLaunchBlocker(report)).toMatch(
			/prerequisites missing.*mounting, shell and reload remain unimplemented/,
		)
	})

	it('does not claim availability when every prerequisite passes', () => {
		const run = vi.fn((command) => (command === 'dotnet' ? '10.0.100' : '1'))
		const report = windowsPreflight(consumer({ complete: true }), { platform: 'win32', run })
		expect(Object.values(report.requirements).every(Boolean)).toBe(true)
		expect(report.status).toBe('unqualified-backend')
		expect(report.qualification).toBe('unverified')
		expect(run.mock.calls.map(([command]) => command)).toEqual(['dotnet', 'powershell'])
		expect(run.mock.calls[1][1]).toContain('-NonInteractive')
		expect(run.mock.calls[1][1].join(' ')).not.toMatch(/Set-ItemProperty/)
		expect(windowsLaunchBlocker(report)).toMatch(/launch is blocked/)
	})

	it.each(['9.0.100', 'not a version', null])('rejects unsuitable or unreadable SDK %s', (sdk) => {
		const report = windowsPreflight(consumer({ complete: true }), {
			platform: 'win32',
			run: (command) => (command === 'dotnet' ? sdk : '1'),
		})

		expect(report.requirements['.NET SDK >= 10']).toBe(false)
		expect(report.status).toBe('missing-prerequisites')
	})

	it.each(['^0.1.0-alpha.144', '~0.1.0-alpha.144', 'latest', 'workspace:*'])(
		'rejects a non-exact runtime declaration %s',
		(runtime) => {
			const report = windowsPreflight(consumer({ complete: true, runtime }), {
				platform: 'win32',
				run: (command) => (command === 'dotnet' ? '10.0.100' : '1'),
			})

			expect(report.requirements['@nativescript/windows exact version']).toBe(false)
			expect(report.status).toBe('missing-prerequisites')
		},
	)

	it('doctor reports the actual execution host without evaluating consumer configuration', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})
		try {
			const report = await workshopDoctor({ cwd: consumer(), json: true })
			expect(report.targets.windows.executionHost.current).toBe(process.platform)
			expect(report.targets.windows.qualification).toBe('unverified')
			expect(report.targets.windows.status).not.toBe('available')
		} finally {
			log.mockRestore()
		}
	})

	it('blocks launch before evaluating config or starting a fallback server', async () => {
		await expect(workshopDev({ cwd: consumer(), target: 'windows' })).rejects.toMatchObject({
			name: 'WorkshopUsageError',
		})
	})
})

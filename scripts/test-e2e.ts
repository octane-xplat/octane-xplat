#!/usr/bin/env node
// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { spawnSync } from 'node:child_process'

const run = (args, env = {}) => {
	console.log(`\n$ bun run ${args.join(' ')}`)
	const result = spawnSync('bun', args[0].startsWith('--') ? args : ['run', ...args], {
		stdio: 'inherit',
		shell: process.platform === 'win32',
		env: { ...process.env, ...env },
	})

	if (result.error) {
		throw result.error
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1)
	}
}

const browsers = ['chromium', 'firefox', 'webkit']

run(['--cwd', 'apps/web', 'run', 'playwright', 'install', ...browsers])

for (const browser of browsers) {
	const env = { XPLAT_WEB_BROWSER: browser }
	run(['--filter', '@xplat/web', 'run', 'node', 'scripts/input-readiness.ts'], env)
	run(['--filter', '@xplat/web', 'run', 'node', 'scripts/test-id.ts'], env)
	run(['--filter', '@xplat/web', 'sqlite:readiness'], env)
	run(['--filter', '@xplat/web', 'run', 'node', 'scripts/sheet-readiness.ts'], env)
}

run(['--filter', '@xplat/web', 'smoke'])
for (const browser of ['firefox', 'webkit']) {
	run(['--cwd', 'apps/web', 'run', 'node', 'scripts/smoke.ts'], {
		XPLAT_WEB_BROWSER: browser,
	})
}

for (const browser of browsers) {
	run(['--cwd', 'packages/lightbox', 'test:e2e'], { env: { XPLAT_WEB_BROWSER: browser } })
}

run(['check:optional-services', '--browser'])
run(['check:consumer', '--smoke', 'web'], {
	XPLAT_WEB_BROWSERS: browsers.join(','),
})

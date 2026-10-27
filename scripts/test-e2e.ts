#!/usr/bin/env node
// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { spawnSync } from 'node:child_process'

const run = (args, env = {}) => {
	console.log(`\n$ pnpm ${args.join(' ')}`)
	const result = spawnSync('pnpm', args, {
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

run(['--dir', 'apps/web', 'exec', 'playwright', 'install', ...browsers])

for (const browser of browsers) {
	const env = { XPLAT_WEB_BROWSER: browser }
	run(['--filter', '@xplat/web', 'exec', 'node', 'scripts/input-readiness.ts'], env)
	run(['--filter', '@xplat/web', 'exec', 'node', 'scripts/test-id.ts'], env)
	run(['--filter', '@xplat/web', 'sqlite:readiness'], env)
	run(['--filter', '@xplat/web', 'exec', 'node', 'scripts/sheet-readiness.ts'], env)
}

run(['--filter', '@xplat/web', 'smoke'])
for (const browser of ['firefox', 'webkit']) {
	run(['--dir', 'apps/web', 'exec', 'node', 'scripts/smoke.ts'], {
		XPLAT_WEB_BROWSER: browser,
	})
}

for (const browser of browsers) {
	run(['--dir', 'packages/lightbox', 'test:e2e'], { env: { XPLAT_WEB_BROWSER: browser } })
}

run(['check:optional-services', '--browser'])
run(['check:consumer', '--smoke', 'web'], {
	XPLAT_WEB_BROWSERS: browsers.join(','),
})

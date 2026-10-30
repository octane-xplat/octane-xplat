#!/usr/bin/env node
// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const app = fileURLToPath(new URL('../', import.meta.url))
if (process.platform !== 'linux') {
	throw new Error('Linux smoke requires the real Linux GTK/WebKit runtime.')
}

execFileSync('bun', ['build'], { cwd: app, stdio: 'inherit', shell: process.platform === 'win32' })
execFileSync(
	'xvfb-run',
	['-a', 'dbus-run-session', '--', `${app}/dist/linux/octane-xplat/octane-xplat`, '--self-test'],
	{
		cwd: '/tmp',
		stdio: 'inherit',
		timeout: 60000,
		env: {
			...process.env,
			GSK_RENDERER: 'cairo',
			LIBGL_ALWAYS_SOFTWARE: '1',
			XPLAT_SELFTEST_SCRIPT: `${app}/host/harness-selftest.web.js`,
		},
	},
)

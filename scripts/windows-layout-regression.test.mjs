import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const appRequire = createRequire(new URL('../apps/windows/package.json', import.meta.url))

test('installed Windows preview preserves percentage sizing and parent lifecycle', () => {
	const helper = fileURLToPath(
		new URL('../.agents/tests/windows-layout/percent-sizing.test.mjs', import.meta.url),
	)
	const view = appRequire.resolve('@nativescript/core/ui/core/view/index.windows.js')
	execFileSync(process.execPath, [helper, view], { stdio: 'pipe' })
})

import { spawn } from 'node:child_process'
import { utimesSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const appSource = join(appRoot, 'src/App.tsx')
const host = spawn(process.execPath, [join(appRoot, 'scripts/dev.mjs')], {
	cwd: appRoot,
	env: { ...process.env, OCTANE_MACOS_AUTOMATION: '0' },
	stdio: ['ignore', 'pipe', 'pipe'],
})

let output = ''
let touched = false
let updated = false
const deadline = setTimeout(() => host.kill('SIGTERM'), 60000)
for (const stream of [host.stdout, host.stderr]) {
	stream.on('data', (chunk) => {
		output += chunk.toString()
		if (!touched && output.includes('[macos] AppKit window ready')) {
			touched = true
			const now = new Date()
			utimesSync(appSource, now, now)
		}

		if (touched && !updated && output.includes('[macos] component rendered after hot edit')) {
			updated = true
			setTimeout(() => host.kill('SIGTERM'), 300)
		}
	})
}

const { code, signal } = await new Promise((resolve, reject) => {
	host.once('error', reject)
	host.once('close', (code, signal) => resolve({ code, signal }))
})

clearTimeout(deadline)
const count = (text) => output.split(text).length - 1
if (
	!updated ||
	count('NativeScript init completed') !== 1 ||
	count('[harness] App mounted') !== 1 ||
	count('[macos] component rendered after hot edit') !== 1
) {
	throw Error(`JavaScriptCore HMR failed (code=${code}, signal=${signal}):\n${output.slice(-4000)}`)
}

console.log('JavaScriptCore HMR: edit rebuilt, updated in process, and kept the mounted root')

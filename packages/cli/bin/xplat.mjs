#!/usr/bin/env node
// xplat is a native Go executable. In-repo runs spawn the local build from
// research/go-cli; published packages ship the binary for the install platform.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const platform = { darwin: 'darwin', linux: 'linux', win32: 'windows' }[process.platform]
const arch = { arm64: 'arm64', x64: 'amd64' }[process.arch]
const binary = resolve(
	import.meta.dirname,
	`../../../research/go-cli/xplat-go-${platform}-${arch}-cli${platform === 'windows' ? '.exe' : ''}`,
)
if (!existsSync(binary)) {
	console.error('build it with `bun run turbo run build:go --filter=@xplat/cli-go-probe`')
	process.exit(1)
}
const result = spawnSync(binary, process.argv.slice(2), { stdio: 'inherit' })
if (result.signal) {
	process.kill(process.pid, result.signal)
} else {
	process.exit(result.status ?? 1)
}

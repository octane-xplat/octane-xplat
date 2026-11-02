#!/usr/bin/env node
// The native checker reads an explicit unsuffixed TSRX contract; production
// platform resolution selects the implementation. Keep both halves in the
// maintained CLI regression suite rather than testing the retired Volar probe.
import { spawnSync } from 'node:child_process'

const result = spawnSync(
	'bun',
	['run', 'turbo', 'run', 'test:typescript', '--filter=@octane-xplat/cli'],
	{ stdio: 'inherit' },
)

process.exitCode = result.status ?? 1

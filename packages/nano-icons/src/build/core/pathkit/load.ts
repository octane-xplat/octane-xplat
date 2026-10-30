// Ported from react-native-nano-icons (MIT, © Software Mansion) — see
// packages/nano-icons/LICENSES.md for full attribution.
import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { PathKitModule } from './types'

const require = createRequire(import.meta.url)

let instance: PathKitModule | null = null

/** Load the PathKit WASM module — the instance is cached and shared across calls. */
export async function loadPathKit(): Promise<PathKitModule> {
	if (instance) {
		return instance
	}

	const PathKitInit = require('pathkit-wasm/bin/pathkit.js') as (opts: unknown) => any

	const pathkitJsPath = require.resolve('pathkit-wasm/bin/pathkit.js') as string

	const pathkitBinDir = path.dirname(pathkitJsPath)
	const pathkitWasmPath = path.join(pathkitBinDir, 'pathkit.wasm')

	const wasmBinary = await fs.readFile(pathkitWasmPath)

	const pkInit = PathKitInit({
		wasmBinary,
		locateFile: (file: string) => path.join(pathkitBinDir, file),
	})

	instance = await (typeof pkInit?.ready === 'function' ? pkInit.ready() : pkInit)

	return instance!
}

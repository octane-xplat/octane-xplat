#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
	createFingerprintAsync,
	diffFingerprintChangesAsync,
	NATIVE_FINGERPRINT_FORMAT,
} from './index.ts'
import type { Fingerprint, Options, Platform } from './types.ts'
const { values } = parseArgs({
	options: {
		dir: { type: 'string' },
		platform: { type: 'string' },
		diff: { type: 'string' },
		'build-record': { type: 'string' },
		help: { type: 'boolean' },
	},
})
if (values.help) {
	console.log(
		'xplat-fingerprint [--dir APP_ROOT] [--platform ios|android|macos|linux|windows] [--build-record FILE] [--diff FILE]\nPrint JSON only; a build record supplies the platform and recorded compiler context. Diff compares a saved fingerprint with the project.',
	)
} else {
	try {
		const root = resolve(values.dir ?? '.')
		const options: Options = values.platform ? { platforms: [values.platform as Platform] } : {}
		if (values['build-record']) {
			const record = JSON.parse(await readFile(resolve(values['build-record']), 'utf8'))
			if (
				!record ||
				record.format !== NATIVE_FINGERPRINT_FORMAT ||
				!['ios', 'android'].includes(record.platform) ||
				!record.toolchain ||
				typeof record.toolchain !== 'object' ||
				Array.isArray(record.toolchain) ||
				Object.values(record.toolchain).some((value) => typeof value !== 'string') ||
				(values.platform && values.platform !== record.platform)
			) {
				throw new Error('Invalid or mismatched native build record')
			}
			options.platforms = [record.platform]
			options.toolchain = record.toolchain
		}
		const result = values.diff
			? await diffFingerprintChangesAsync(
					JSON.parse(await readFile(resolve(values.diff), 'utf8')) as Fingerprint,
					root,
					options,
				)
			: await createFingerprintAsync(root, options)
		console.log(JSON.stringify(result, null, 2))
	} catch (error) {
		console.error(error instanceof Error ? error.message : 'Fingerprint failed')
		process.exitCode = 1
	}
}

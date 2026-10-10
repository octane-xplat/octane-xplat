import { unzipSync, strFromU8 } from 'fflate/browser'
import { sha256 } from '@noble/hashes/sha2.js'
import type { UpdateCheck, UpdateManifest, UpdatesClient, UpdatesOptions } from './types'

// Private adapter: all writes are synchronous, confined to app-private storage.
export interface Storage {
	exists(path: string): boolean
	read(path: string): string
	write(path: string, value: string | Uint8Array): void
	remove(path: string): void
	move(from: string, to: string): void
}

export interface Environment {
	platform: 'ios' | 'android'
	nativeVersion: string
	storage: Storage
	releaseBuild?: boolean
	request(url: string, timeout: number): Promise<{ status: number; bytes: Uint8Array }>
}

const version = (value: unknown): value is string =>
	typeof value === 'string' &&
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value) &&
	value.split('.').every((part) => Number.isSafeInteger(Number(part)))

const older = (a: string, b: string) => {
	const x = a.split('.').map(Number),
		y = b.split('.').map(Number)

	for (let i = 0; i < 3; i++) {
		if (x[i] !== y[i]) {
			return x[i] < y[i]
		}
	}

	return false
}

const digest = (bytes: Uint8Array) =>
	Array.from(sha256(bytes), (v) => v.toString(16).padStart(2, '0')).join('')

const decode = (bytes: Uint8Array) => JSON.parse(strFromU8(bytes))
const limit = (value: number | undefined, fallback: number) => {
	const result = value ?? fallback
	if (!Number.isSafeInteger(result) || result <= 0) {
		throw new Error('Update limits must be positive integers')
	}

	return result
}

export function createClient(options: UpdatesOptions, env: Environment): UpdatesClient {
	if (env.releaseBuild === false) {
		throw new Error('OTA installation requires a release binary; LiveSync builds are disabled')
	}

	const endpoint = options.endpoint.replace(/\/$/, '')
	if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(endpoint)) {
		throw new Error('Updates endpoint must be an HTTPS origin')
	}

	if (!version(options.embeddedVersion) || !version(env.nativeVersion)) {
		throw new Error('Updates require numeric x.y.z versions')
	}

	const channel = options.channel ?? 'stable'
	if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(channel)) {
		throw new Error('Invalid updates channel')
	}

	const downloadLimit = limit(options.maxDownloadBytes, 32 * 1024 * 1024)
	const expandedLimit = limit(options.maxExpandedBytes, 128 * 1024 * 1024)
	const timeout = limit(options.timeout, 30000)
	const fs = env.storage
	if (!fs.exists('native.txt')) {
		throw new Error('OTA boot wiring missing: run xplat updates init and rebuild the native binary')
	}

	let installing = false
	const release = (file: string): UpdateManifest | null =>
		fs.exists(file) ? JSON.parse(fs.read(file)) : null

	const current = () => release('current.json')
	const validate = (input: UpdateManifest): UpdateManifest => {
		if (
			!input ||
			!version(input.version) ||
			!version(input.minNativeVersion) ||
			typeof input.sha256 !== 'string' ||
			!/^[0-9a-f]{64}$/.test(input.sha256) ||
			!Number.isSafeInteger(input.size) ||
			input.size <= 0 ||
			input.size > downloadLimit ||
			input.url !== `${endpoint}/bundles/${input.sha256}`
		) {
			throw new Error('Invalid update manifest or download limit exceeded')
		}

		if (older(env.nativeVersion, input.minNativeVersion)) {
			throw new Error('Update requires a newer native binary')
		}

		return {
			version: input.version,
			sha256: input.sha256,
			size: input.size,
			minNativeVersion: input.minNativeVersion,
			url: input.url,
		}
	}

	const isRejected = (sha: string) =>
		fs.exists('rejected.txt') && fs.read('rejected.txt').trim() === sha

	const client: UpdatesClient = {
		supported: true,
		async check(): Promise<UpdateCheck> {
			const url = `${endpoint}/manifest?platform=${env.platform}&channel=${channel}&nativeVersion=${env.nativeVersion}&currentVersion=${client.status().currentVersion}`
			const response = await env.request(url, timeout)
			if (response.status === 404) {
				return { available: false, reason: 'no-release' }
			}

			if (response.status !== 200 || response.bytes.length > 65536) {
				throw new Error(`Update check failed (${response.status})`)
			}

			const data = decode(response.bytes)
			if (
				data.updateAvailable === false &&
				['up-to-date', 'min-native-version'].includes(data.reason)
			) {
				return { available: false, reason: data.reason }
			}

			if (
				data.updateAvailable !== true ||
				data.platform !== env.platform ||
				data.channel !== channel
			) {
				throw new Error('Invalid update response')
			}

			const manifest = validate(data)
			return isRejected(manifest.sha256)
				? { available: false, reason: 'rejected' }
				: { available: true, manifest }
		},
		async install(input) {
			if (
				installing ||
				fs.exists('pending.txt') ||
				fs.exists('rollback.txt') ||
				fs.exists('next')
			) {
				throw new Error('An update is already staged, unconfirmed, or being installed')
			}

			const manifest = validate(input)
			if (isRejected(manifest.sha256)) {
				throw new Error('This bundle failed a previous boot')
			}

			installing = true
			try {
				const response = await env.request(manifest.url, timeout)
				const bytes = response.bytes
				if (
					response.status !== 200 ||
					bytes.length !== manifest.size ||
					digest(bytes) !== manifest.sha256
				) {
					throw new Error('Update download failed integrity or size verification')
				}

				let expanded = 0,
					count = 0

				const names = new Set<string>()
				const files = unzipSync(bytes, {
					filter(entry) {
						const name = entry.name.replace(/\/$/, '')
						if (
							!name ||
							name.startsWith('/') ||
							/[\\:]/.test(name) ||
							name.includes(String.fromCharCode(0)) ||
							name.split('/').some((part) => !part || part === '..' || part === '.')
						) {
							throw new Error('Unsafe path in update archive')
						}

						if (names.has(name.toLowerCase())) {
							throw new Error('Duplicate path in update archive')
						}

						names.add(name.toLowerCase())
						if (!Number.isSafeInteger(entry.originalSize) || entry.originalSize < 0) {
							throw new Error('Invalid archive size')
						}

						expanded += entry.originalSize
						if (++count > 10000 || expanded > expandedLimit) {
							throw new Error('Expanded update exceeds storage limit')
						}

						return !entry.name.endsWith('/')
					},
				})

				if (!files['package.json']) {
					throw new Error('Update archive must contain app/package.json at its root')
				}

				const pkg = decode(files['package.json'])
				if (typeof pkg.main !== 'string' || !/^[a-zA-Z0-9_-]+(?:\.mjs)?$/.test(pkg.main)) {
					throw new Error('Invalid update entry point')
				}

				const main = pkg.main.endsWith('.mjs') ? pkg.main : `${pkg.main}.mjs`
				if (!files[main]) {
					throw new Error('Update entry point missing')
				}

				fs.remove('staging')
				for (const [name, data] of Object.entries(files)) {
					fs.write(`staging/app/${name}`, data)
				}

				fs.write('staging/release.json', JSON.stringify(manifest))
				// The native boot guard consumes only next/. The running app remains untouched.
				fs.move('staging', 'next')
			} finally {
				try {
					fs.remove('staging')
				} finally {
					installing = false
				}
			}
		},
		markHealthy() {
			if (fs.exists('pending.txt')) {
				if (current()?.sha256 !== fs.read('pending.txt').trim()) {
					throw new Error('Running update does not match boot journal')
				}

				fs.remove('pending.txt')
			}
		},
		rollback() {
			if (installing) {
				throw new Error('Wait for the current installation to finish')
			}

			fs.write('rollback.txt', '1')
		},
		status() {
			return {
				currentVersion: current()?.version ?? options.embeddedVersion,
				stagedVersion: release('next/release.json')?.version ?? null,
				needsConfirmation: fs.exists('pending.txt'),
			}
		},
	}

	return client
}

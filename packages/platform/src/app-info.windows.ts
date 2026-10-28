import { Windows } from '@octane-xplat/platform/windows'
import type { AppInfo } from './types'

const unavailable: AppInfo = { supported: false, version: null, build: null, bundleId: null }

function read(): AppInfo {
	try {
		const id = Windows?.ApplicationModel?.Package?.Current?.Id
		const name = id?.Name
		if (typeof name !== 'string' || !name.trim()) {
			return unavailable
		}

		let version: string | null = null
		let build: string | null = null
		try {
			const value = id.Version
			const parts = [value.Major, value.Minor, value.Build, value.Revision]
			if (parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 65535)) {
				version = parts.join('.')
				build = String(parts[2])
			}
		} catch {
			// Identity can be available even if this preview cannot project its version.
		}

		return { supported: true, version, build, bundleId: name }
	} catch {
		// Package.Current throws in a process without package identity.
		return unavailable
	}
}

/**
 * Windows package metadata, read lazily after host startup. The identifier is
 * Package.Id.Name; version retains all Major.Minor.Build.Revision components,
 * and build is the package's Build field. Unpackaged hosts report unavailable.
 *
 * @example
 * import { appInfo } from '@octane-xplat/platform'
 * const version = appInfo.supported ? appInfo.version : null
 */
export const appInfo: AppInfo = {
	get supported() {
		return read().supported
	},
	get version() {
		return read().version
	},
	get build() {
		return read().build
	},
	get bundleId() {
		return read().bundleId
	},
}

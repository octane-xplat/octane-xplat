import { Windows } from '@octane-xplat/platform/windows'
import { UnavailabilityError, type Service } from '@octane-xplat/lib/capability'
import type { SecureStore } from './types'

function host(): { credentials: any; resource: string } | null {
	try {
		const credentials = Windows?.Security?.Credentials
		const family = Windows?.ApplicationModel?.Package?.Current?.Id?.FamilyName
		if (
			typeof family !== 'string' ||
			!family ||
			typeof credentials?.PasswordVault !== 'function' ||
			typeof credentials?.PasswordCredential !== 'function'
		) {
			return null
		}

		return { credentials, resource: `octane-xplat:secure-storage:${family}` }
	} catch {
		// Unpackaged desktop apps have no stable package namespace.
		return null
	}
}

function requireHost() {
	const value = host()
	if (!value) {
		throw new UnavailabilityError('secureStorage')
	}
	return value
}

function userName(key: string): string {
	if (typeof key !== 'string') {
		throw new TypeError('Expected a string key')
	}
	// WinRT disallows empty user names; JSON also escapes control characters.
	return `key:${JSON.stringify(key)}`
}

function missing(error: unknown): boolean {
	// alpha.144 exposes the HRESULT as a suffix, without a numeric error field.
	return /\(HRESULT 0x80070490\)$/i.test(String((error as Error)?.message))
}

/** Windows Credential Locker, scoped by package family; never a plaintext fallback. */
export const secureStorage: Service<SecureStore> = {
	get supported() {
		return host() !== null
	},
	async isAvailable() {
		const value = host()
		if (!value) {
			return false
		}
		try {
			new value.credentials.PasswordVault()
			return true
		} catch {
			return false
		}
	},
	async get(key) {
		const { credentials, resource } = requireHost()
		try {
			const credential = new credentials.PasswordVault().Retrieve(resource, userName(key))
			credential.RetrievePassword()
			const value = JSON.parse(credential.Password)
			if (typeof value === 'string') {
				return value
			}
		} catch (error) {
			if (missing(error)) {
				return null
			}
		}
		// Native errors may include keys or credentials. Do not forward them.
		throw new Error('Credential Locker read failed')
	},
	async set(key, value) {
		const { credentials, resource } = requireHost()
		try {
			if (typeof value !== 'string') {
				return false
			}

			// A JSON string preserves empty passwords, which PasswordVault rejects.
			new credentials.PasswordVault().Add(
				new credentials.PasswordCredential(resource, userName(key), JSON.stringify(value)),
			)

			return true
		} catch {
			return false
		}
	},
	async remove(key) {
		const { credentials, resource } = requireHost()
		try {
			const vault = new credentials.PasswordVault()
			vault.Remove(vault.Retrieve(resource, userName(key)))
			return true
		} catch (error) {
			return missing(error)
		}
	},
}

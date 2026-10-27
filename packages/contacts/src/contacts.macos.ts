// Contacts — macOS leaf. CNContactStore is bridgeable through the AppKit host
// but not yet wired; report unsupported rather than leaving a hole.
import type { Contacts, PermissionResult } from './types'

const unsupported = () => Promise.reject(new Error('unsupported: contacts is not wired on macOS'))

export const contacts: Contacts = {
	supported: false,
	ensure: async (): Promise<PermissionResult> => 'unsupported',
	getAll: unsupported,
	getByName: unsupported,
	getById: unsupported,
	add: unsupported,
	update: unsupported,
	remove: unsupported,
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.contacts = () => contacts.ensure()

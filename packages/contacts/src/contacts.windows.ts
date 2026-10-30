// Windows leaf — @nativescript/contacts ships no windows backend; report
// unsupported rather than breaking the import graph.
import type { Contacts, PermissionResult } from './types'

const unsupported = () =>
	Promise.reject(new Error('unsupported: contacts is not available on windows'))

/** Contacts service — system address book. */
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

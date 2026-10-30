// Contacts — web leaf over the Contact Picker API. Chromium-only, picker UX
// (the user picks contacts per call — there is no store scan), read-only,
// and limited to name/email/tel fields. Everything the picker can't express
// reports unsupported rather than faking a store.
import type { Contact, Contacts, GetContactsOptions, NewContact, PermissionResult } from './types'

interface ContactPicker {
	select(properties: string[], options?: { multiple?: boolean }): Promise<any[]>
	getProperties(): Promise<string[]>
}

const picker = (): ContactPicker | null => {
	const nav = (globalThis as any).navigator
	return typeof nav?.contacts?.select === 'function' ? (nav.contacts as ContactPicker) : null
}

function asContact(native: any): Contact {
	return {
		id: '',
		name: Array.isArray(native?.name) ? native.name.join(' ') : (native?.name ?? ''),
		emails: (native?.email ?? []).map((e: string) => ({ email: e })),
		phoneNumbers: (native?.tel ?? []).map((t: string) => ({ number: t })),
	}
}

const unsupported = (what: string) => () =>
	Promise.reject(
		new Error(`unsupported: contact ${what} is not available through the web Contact Picker`),
	)

/** Contacts service — system address book. */
export const contacts: Contacts = {
	supported: picker() !== null,

	// The picker has no permission state to query — choosing contacts IS the
	// grant. Report granted when the API exists so apps don't gate on it.
	ensure(): Promise<PermissionResult> {
		return Promise.resolve(picker() ? 'granted' : 'unsupported')
	},

	async getAll(options?: GetContactsOptions): Promise<Contact[]> {
		const p = picker()
		if (!p) {
			throw new Error('unsupported: navigator.contacts.select is not available')
		}
		const selected = await p.select(['name', 'email', 'tel'], { multiple: true })
		return (selected ?? []).map(asContact)
	},

	getByName: unsupported('lookup'),
	getById: unsupported('lookup'),
	add: (_contact: NewContact) => unsupported('writes')(),
	update: (_id: string, _contact: NewContact) => unsupported('writes')(),
	remove: unsupported('writes'),
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.contacts = () => contacts.ensure()

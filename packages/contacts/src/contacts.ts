// Contacts — native leaf over @nativescript/contacts. The plugin's worker
// fetch is normalized into our Expo-shaped Contact; permission goes through
// the platform primitives directly (same rationale as media's ensureCamera:
// plugin-side request helpers can't drift).
import { Application } from '@nativescript/core'
import { Contact as NativeContact, Contacts as NativeContacts } from '@nativescript/contacts'
import { android } from '@octane-xplat/platform/android'
import type {
	Contact,
	ContactAddress,
	ContactField,
	Contacts,
	GetContactsOptions,
	NewContact,
	PermissionResult,
} from './types'

// iOS CNContactStore — outside the @nativescript/types default subset.
declare const CNContactStore: any
declare const CNEntityTypeContacts: number | undefined

const ALL_FIELDS: ContactField[] = [
	'name',
	'emails',
	'phoneNumbers',
	'addresses',
	'urls',
	'company',
	'note',
	'image',
	'nickname',
]

// Our field names → the plugin's contactFields vocabulary.
const PLUGIN_FIELDS: Record<ContactField, string> = {
	name: 'name',
	emails: 'emailAddresses',
	phoneNumbers: 'phoneNumbers',
	addresses: 'postalAddresses',
	urls: 'urls',
	company: 'organization',
	note: 'notes',
	image: 'photo',
	nickname: 'nickname',
}

function pluginFields(fields?: ContactField[]): string[] {
	const wanted = fields ?? ALL_FIELDS
	const mapped = wanted.map((f) => PLUGIN_FIELDS[f])
	// The plugin reads `name` for the display string regardless of selection.
	if (!mapped.includes('name')) {
		mapped.push('name')
	}
	return mapped
}

function iosEnsure(): Promise<PermissionResult> {
	const store = typeof CNContactStore === 'undefined' ? null : CNContactStore.new?.()
	if (!store || typeof CNEntityTypeContacts === 'undefined') {
		return Promise.resolve('unsupported')
	}
	// CNAuthorizationStatus: 0 notDetermined, 1 restricted, 2 denied, 3 authorized
	const status = CNContactStore.authorizationStatusForEntityType(CNEntityTypeContacts)
	if (status === 3) {
		return Promise.resolve('granted')
	}
	if (status === 1 || status === 2) {
		return Promise.resolve('denied')
	}
	return new Promise((resolve) => {
		store.requestAccessForEntityTypeCompletionHandler(CNEntityTypeContacts, (granted: boolean) =>
			resolve(granted ? 'granted' : 'denied'),
		)
	})
}

let contactRequestCode = 7719

function androidEnsure(): Promise<PermissionResult> {
	const perm = 'android.permission.READ_CONTACTS'
	const activity = Application.android.foregroundActivity ?? Application.android.startActivity
	try {
		if (
			activity?.checkSelfPermission?.(perm) === android.content.pm.PackageManager.PERMISSION_GRANTED
		) {
			return Promise.resolve('granted')
		}

		if (!activity) {
			return Promise.resolve('denied')
		}

		return new Promise<PermissionResult>((resolve) => {
			const requestCode = contactRequestCode++
			const event = Application.android.activityRequestPermissionsEvent
			const onResult = (args: any) => {
				if (args.requestCode !== requestCode) {
					return
				}
				Application.android.off(event, onResult)
				resolve(
					args.grantResults?.[0] === android.content.pm.PackageManager.PERMISSION_GRANTED
						? 'granted'
						: 'denied',
				)
			}
			Application.android.on(event, onResult)
			try {
				activity.requestPermissions([perm], requestCode)
			} catch {
				Application.android.off(event, onResult)
				resolve('denied')
			}
		})
	} catch {
		return Promise.resolve('denied')
	}
}

function asContact(native: any): Contact {
	const collection = (list: any, key: string) =>
		(list ?? []).map((c: any) => ({ label: c?.label, [key]: c?.value }))
	const address = (list: any): ContactAddress[] =>
		(list ?? []).map((c: any) => {
			const v = c?.value ?? {}
			return {
				label: c?.label,
				street: v.street ?? v.Street,
				city: v.city ?? v.City,
				region: v.state ?? v.State ?? v.region,
				postalCode: v.postalCode ?? v.postcode ?? v.PostalCode,
				country: v.country ?? v.Country,
			}
		})
	const given = native?.name?.given
	const family = native?.name?.family
	return {
		id: String(native?.id ?? ''),
		name: native?.name?.displayname ?? [given, family].filter(Boolean).join(' ') ?? '',
		firstName: given,
		middleName: native?.name?.middle,
		lastName: family,
		nickname: native?.nickname,
		emails: collection(native?.emailAddresses, 'email'),
		phoneNumbers: collection(native?.phoneNumbers, 'number'),
		addresses: address(native?.postalAddresses),
		urls: collection(native?.urls, 'url'),
		company: native?.organization?.name,
		jobTitle: native?.organization?.jobTitle,
		note: native?.notes,
		image: native?.photo,
	}
}

function applySort(list: Contact[], sort?: GetContactsOptions['sort']): Contact[] {
	if (!sort || sort === 'none') {
		return list
	}
	const key = sort === 'firstName' ? 'firstName' : 'lastName'
	return [...list].sort((a, b) => (a[key] ?? a.name).localeCompare(b[key] ?? b.name))
}

function applyPage(list: Contact[], options?: GetContactsOptions): Contact[] {
	const start = options?.pageOffset ?? 0
	const size = options?.pageSize
	return size === undefined ? list.slice(start) : list.slice(start, start + size)
}

function applyNewContact(target: any, source: NewContact): void {
	// The plugin's save() reads every name member incl. phonetic — unset
	// members are native crashes, not omissions.
	target.name = {
		given: source.firstName ?? '',
		middle: source.middleName ?? '',
		family: source.lastName ?? '',
		prefix: '',
		suffix: '',
		phonetic: { given: '', middle: '', family: '' },
	}
	target.nickname = source.nickname
	target.notes = source.note
	if (source.company || source.jobTitle) {
		target.organization = { name: source.company, jobTitle: source.jobTitle }
	}
	target.emailAddresses = (source.emails ?? []).map((e) => ({ label: e.label, value: e.email }))
	target.phoneNumbers = (source.phoneNumbers ?? []).map((p) => ({
		label: p.label,
		value: p.number,
	}))
	// save() also maps postalAddresses/urls unconditionally.
	target.postalAddresses = []
	target.urls = []
	target.photo = null
}

export const contacts: Contacts = {
	supported: true,

	ensure(): Promise<PermissionResult> {
		return Application.ios ? iosEnsure() : androidEnsure()
	},

	async getAll(options?: GetContactsOptions): Promise<Contact[]> {
		const result = await NativeContacts.getAllContacts(pluginFields(options?.fields))
		return applyPage(applySort((result?.data ?? []).map(asContact), options?.sort), options)
	},

	async getByName(predicate: string, fields?: ContactField[]): Promise<Contact[]> {
		const result = await NativeContacts.getContactsByName(predicate, pluginFields(fields))
		return (result?.data ?? []).map(asContact)
	},

	async getById(id: string, fields?: ContactField[]): Promise<Contact | null> {
		if (Application.ios) {
			const result = await NativeContacts.getContactById(id, pluginFields(fields))
			const native = result?.data ?? result
			return native ? asContact(native) : null
		}
		// Plugin ships getContactById for iOS only — full-store fetch + filter.
		const result = await NativeContacts.getAllContactsWithoutWorker(pluginFields(fields))
		const native = (result?.data ?? []).find((c: any) => String(c?.id) === id)
		return native ? asContact(native) : null
	},

	async add(contact: NewContact): Promise<string> {
		const native = new (NativeContact as any)()
		applyNewContact(native, contact)
		native.save()
		return String(native.id ?? '')
	},

	async update(id: string, contact: NewContact): Promise<string> {
		const existing = await contacts.getById(id)
		if (!existing) {
			throw new Error(`contacts.update: no contact with id ${id}`)
		}
		const native = new (NativeContact as any)()
		native.id = id
		applyNewContact(native, contact)
		native.save()
		return id
	},

	async remove(id: string): Promise<void> {
		const native = new (NativeContact as any)()
		native.id = id
		native.delete()
	},
}

// Register the permission kind this leaf owns for the platform dispatcher.
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.contacts = () => contacts.ensure()

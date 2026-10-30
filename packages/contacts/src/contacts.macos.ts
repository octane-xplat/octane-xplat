// Contacts — AppKit leaf over CNContactStore. The Contacts framework is
// bridgeable through the JSC host; semantics mirror the iOS leaf.
// CNContactNoteKey requires a contacts-notes entitlement even on macOS —
// it is excluded from fetch keys and `note` stays absent unless the store
// reports the key available.
import {
	CNContact,
	CNContactFetchRequest,
	CNContactIdentifierKey,
	CNContactEmailAddressesKey,
	CNContactFamilyNameKey,
	CNContactGivenNameKey,
	CNContactImageDataKey,
	CNContactJobTitleKey,
	CNContactMiddleNameKey,
	CNContactNicknameKey,
	CNContactNoteKey,
	CNContactOrganizationNameKey,
	CNContactPhoneNumbersKey,
	CNContactPostalAddressesKey,
	CNContactStore,
	CNContactUrlAddressesKey,
	CNEntityType,
	CNLabeledValue,
	CNMutableContact,
	CNPhoneNumber,
	CNSaveRequest,
} from '@octane-xplat/platform/macos'
import type {
	Contact,
	ContactAddress,
	ContactField,
	Contacts,
	GetContactsOptions,
	NewContact,
	PermissionResult,
} from './types'

let store: any = null
const contactStore = () => {
	if (store) {
		return store
	}

	try {
		if (typeof CNContactStore?.authorizationStatusForEntityType !== 'function') {
			return null
		}
		return (store = CNContactStore.new())
	} catch {
		return null
	}
}

// CNAuthorizationStatus: 0 notDetermined 1 restricted 2 denied 3 authorized
const rawStatus = () =>
	Number(CNContactStore.authorizationStatusForEntityType(CNEntityType.CNEntityTypeContacts ?? 0))

function ensureAccess(): Promise<PermissionResult> {
	const s = contactStore()
	if (!s) {
		return Promise.resolve('unsupported')
	}

	const status = rawStatus()
	if (status === 3) {
		return Promise.resolve('granted')
	}

	if (status === 1 || status === 2) {
		return Promise.resolve('denied')
	}

	return new Promise((resolve) => {
		s.requestAccessForEntityTypeCompletionHandler(CNEntityType.CNEntityTypeContacts ?? 0, (granted: boolean) =>
			resolve(granted ? 'granted' : 'denied'),
		)
	})
}

const BASE_KEYS = [
	CNContactIdentifierKey,
	CNContactGivenNameKey,
	CNContactMiddleNameKey,
	CNContactFamilyNameKey,
	CNContactNicknameKey,
]

const FIELD_KEYS: Record<Exclude<ContactField, 'name'>, string[]> = {
	emails: [CNContactEmailAddressesKey],
	phoneNumbers: [CNContactPhoneNumbersKey],
	addresses: [CNContactPostalAddressesKey],
	urls: [CNContactUrlAddressesKey],
	company: [CNContactOrganizationNameKey, CNContactJobTitleKey],
	note: [], // entitlement-gated on macOS too — read only when the key is available
	image: [CNContactImageDataKey],
	nickname: [],
}

function fetchKeys(fields?: ContactField[]): string[] {
	const keys = [...BASE_KEYS]
	for (const field of fields ?? (Object.keys(FIELD_KEYS) as ContactField[])) {
		for (const key of FIELD_KEYS[field as keyof typeof FIELD_KEYS] ?? []) {
			if (!keys.includes(key)) {
				keys.push(key)
			}
		}
	}
	return keys
}

const nsarray = (list: any): any[] => {
	if (!list) {
		return []
	}

	if (Array.isArray(list)) {
		return list
	}

	const out: any[] = []
	for (let i = 0, count = Number(list.count ?? 0); i < count; i++) {
		out.push(list.objectAtIndex(i))
	}
	return out
}

const labeled = (list: any, value: (entry: any) => unknown) =>
	nsarray(list).map((entry) => ({ label: entry?.label ? String(entry.label) : undefined, value: value(entry) }))

function asContact(native: any): Contact {
	const firstName = native?.givenName ? String(native.givenName) : undefined
	const lastName = native?.familyName ? String(native.familyName) : undefined
	const name =
		native?.name && typeof native.name === 'string'
			? native.name
			: [firstName, lastName].filter(Boolean).join(' ') ||
				(native?.organizationName ? String(native.organizationName) : '')

	const contact: Contact = {
		id: String(native?.identifier ?? ''),
		name,
		firstName,
		middleName: native?.middleName ? String(native.middleName) : undefined,
		lastName,
		nickname: native?.nickname ? String(native.nickname) : undefined,
		emails: labeled(native?.emailAddresses, (e) => String(e?.value ?? '')).map(
			({ label, value }) => ({ label, email: value as string }),
		),
		phoneNumbers: labeled(native?.phoneNumbers, (e) => String(e?.value?.stringValue ?? '')).map(
			({ label, value }) => ({ label, number: value as string }),
		),
		addresses: labeled(
			native?.postalAddresses,
			(e): ContactAddress => ({
				street: e?.value?.street ? String(e.value.street) : undefined,
				city: e?.value?.city ? String(e.value.city) : undefined,
				region: e?.value?.state ? String(e.value.state) : undefined,
				postalCode: e?.value?.postalCode ? String(e.value.postalCode) : undefined,
				country: e?.value?.country ? String(e.value.country) : undefined,
			}),
		).map(({ label, value }) => ({ label, ...(value as ContactAddress) })),
		urls: labeled(native?.urlAddresses, (e) => String(e?.value ?? '')).map(
			({ label, value }) => ({ label, url: value as string }),
		),
		company: native?.organizationName ? String(native.organizationName) : undefined,
		jobTitle: native?.jobTitle ? String(native.jobTitle) : undefined,
	}

	// The notes entitlement is a distribution choice; read it only when the
	// fetched keys already carry it.
	try {
		if (native?.isKeyAvailable?.(CNContactNoteKey) && native?.note) {
			contact.note = String(native.note)
		}
	} catch {
		// A store without the notes entitlement leaves the field absent.
	}

	try {
		if (native?.imageDataAvailable) {
			const data = native?.imageData
			const base64 = data?.base64EncodedStringWithOptions?.(0)
			if (base64) {
				contact.image = { data: String(base64) }
			}
		}
	} catch {
		// Unfetched or unreadable image data is omitted, never fatal.
	}

	return contact
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

function requireStore(): any {
	const s = contactStore()
	if (!s) {
		throw new Error('contacts: the Contacts store is unavailable on this host')
	}
	return s
}

function applyNewContact(target: any, source: NewContact): void {
	target.givenName = source.firstName ?? ''
	target.middleName = source.middleName ?? ''
	target.familyName = source.lastName ?? ''
	target.nickname = source.nickname ?? ''
	target.organizationName = source.company ?? ''
	target.jobTitle = source.jobTitle ?? ''
	target.emailAddresses = (source.emails ?? []).map((e) =>
		CNLabeledValue.labeledValueWithLabelValue(e.label ?? null, e.email),
	)
	target.phoneNumbers = (source.phoneNumbers ?? []).map((p) =>
		CNLabeledValue.labeledValueWithLabelValue(
			p.label ?? null,
			CNPhoneNumber.phoneNumberWithStringValue(p.number),
		),
	)
}

/** Contacts service — system address book. */
export const contacts: Contacts = {
	get supported() {
		return contactStore() !== null
	},

	ensure(): Promise<PermissionResult> {
		return ensureAccess()
	},

	async getAll(options?: GetContactsOptions): Promise<Contact[]> {
		const s = requireStore()
		const request = CNContactFetchRequest.alloc().initWithKeysToFetch(fetchKeys(options?.fields))
		const out: Contact[] = []
		if (
			!s.enumerateContactsWithFetchRequestErrorUsingBlock(request, null, (contact: any) => {
				out.push(asContact(contact))
			})
		) {
			throw new Error('contacts.getAll: the store refused the fetch request')
		}

		return applyPage(applySort(out, options?.sort), options)
	},

	async getByName(predicate: string, fields?: ContactField[]): Promise<Contact[]> {
		const s = requireStore()
		const list = s.unifiedContactsMatchingPredicateKeysToFetchError(
			CNContact.predicateForContactsMatchingName(predicate),
			fetchKeys(fields),
			null,
		)
		return nsarray(list).map(asContact)
	},

	async getById(id: string, fields?: ContactField[]): Promise<Contact | null> {
		const s = requireStore()
		const native = s.unifiedContactWithIdentifierKeysToFetchError(id, fetchKeys(fields), null)
		return native ? asContact(native) : null
	},

	async add(contact: NewContact): Promise<string> {
		const s = requireStore()
		const native = CNMutableContact.new()
		applyNewContact(native, contact)
		const request = CNSaveRequest.new()
		request.addContactToContainerWithIdentifier(native, null)
		if (!s.executeSaveRequestError(request, null)) {
			throw new Error('contacts.add: the store refused the save request')
		}
		return String(native.identifier ?? '')
	},

	async update(id: string, contact: NewContact): Promise<string> {
		const s = requireStore()
		const existing = s.unifiedContactWithIdentifierKeysToFetchError(
			id,
			fetchKeys(),
			null,
		)
		if (!existing) {
			throw new Error(`contacts.update: no contact with id ${id}`)
		}

		const native = existing.mutableCopy()
		applyNewContact(native, contact)
		const request = CNSaveRequest.new()
		request.updateContact(native)
		if (!s.executeSaveRequestError(request, null)) {
			throw new Error('contacts.update: the store refused the save request')
		}
		return id
	},

	async remove(id: string): Promise<void> {
		const s = requireStore()
		const existing = s.unifiedContactWithIdentifierKeysToFetchError(id, [CNContactIdentifierKey], null)
		if (!existing) {
			return
		}

		const request = CNSaveRequest.new()
		request.deleteContact(existing.mutableCopy())
		if (!s.executeSaveRequestError(request, null)) {
			throw new Error('contacts.remove: the store refused the save request')
		}
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.contacts = {
	getPermissions: async () => {
		const s = contactStore()
		if (!s) {
			return { status: 'unsupported' as const, granted: false, canAskAgain: false }
		}

		const status = rawStatus()
		return {
			status: status === 3 ? ('granted' as const) : status === 0 ? ('undetermined' as const) : ('denied' as const),
			granted: status === 3,
			canAskAgain: status === 0 || status === 3,
		}
	},
	requestPermissions: async () => {
		const result = await contacts.ensure()
		return { status: result, granted: result === 'granted', canAskAgain: result === 'granted' }
	},
}

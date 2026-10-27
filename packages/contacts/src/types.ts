export type PermissionResult = 'granted' | 'denied' | 'unsupported'

/** Fields the app asks for — a superset is fetched natively, this selects
 *  which members are populated on the returned Contact. */
export type ContactField =
	| 'name'
	| 'emails'
	| 'phoneNumbers'
	| 'addresses'
	| 'urls'
	| 'company'
	| 'note'
	| 'image'
	| 'nickname'

export interface ContactEmail {
	label?: string
	email: string
}

export interface ContactPhone {
	label?: string
	number: string
}

export interface ContactAddress {
	label?: string
	street?: string
	city?: string
	region?: string
	postalCode?: string
	country?: string
}

export interface ContactUrl {
	label?: string
	url: string
}

export interface Contact {
	id: string
	/** Display name — falls back to composed given/family when the store
	 *  lacks a display string. */
	name: string
	firstName?: string
	middleName?: string
	lastName?: string
	nickname?: string
	emails?: ContactEmail[]
	phoneNumbers?: ContactPhone[]
	addresses?: ContactAddress[]
	urls?: ContactUrl[]
	company?: string
	jobTitle?: string
	note?: string
	/** Platform image reference when 'image' was requested — a file path or
	 *  data reference; shape is platform-dependent. */
	image?: unknown
}

export interface NewContact {
	firstName?: string
	middleName?: string
	lastName?: string
	nickname?: string
	emails?: ContactEmail[]
	phoneNumbers?: ContactPhone[]
	company?: string
	jobTitle?: string
	note?: string
}

export interface GetContactsOptions {
	/** Restrict which members are populated (all fetched by default). */
	fields?: ContactField[]
	/** Client-side sort — the native stores return an unspecified order. */
	sort?: 'firstName' | 'lastName' | 'none'
	pageSize?: number
	pageOffset?: number
}

export interface Contacts {
	readonly supported: boolean
	/** Ensure the contacts permission without prompting twice — returns the
	 *  post-request grant state, 'unsupported' when the store can't be reached. */
	ensure(): Promise<PermissionResult>
	getAll(options?: GetContactsOptions): Promise<Contact[]>
	getByName(predicate: string, fields?: ContactField[]): Promise<Contact[]>
	/** iOS: direct id fetch. Android: the plugin ships no id lookup, so this
	 *  fetches the full store and filters — read-all cost, call sparingly. */
	getById(id: string, fields?: ContactField[]): Promise<Contact | null>
	add(contact: NewContact): Promise<string>
	update(id: string, contact: NewContact): Promise<string>
	remove(id: string): Promise<void>
}

export declare const contacts: Contacts

/** Coarse permission answer; unsupported means no contacts/permission path. */
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

/** One labeled email field. */
export interface ContactEmail {
	/** Free-form label (home/work/custom) as stored. */
	label?: string
	/** Email address value. */
	email: string
}

/** One labeled phone field. */
export interface ContactPhone {
	/** Free-form label (home/work/custom) as stored. */
	label?: string
	/** Phone number string as stored. */
	number: string
}

/** One labeled postal address. */
export interface ContactAddress {
	/** Free-form label (home/work/custom) as stored. */
	label?: string
	/** Street line(s). */
	street?: string
	/** City. */
	city?: string
	/** State/province region. */
	region?: string
	/** Postal/ZIP code. */
	postalCode?: string
	/** Country name or code. */
	country?: string
}

/** One labeled URL field. */
export interface ContactUrl {
	/** Free-form label (home/work/custom) as stored. */
	label?: string
	/** URL value. */
	url: string
}

/** A stored contact record. */
export interface Contact {
	/** Store-assigned contact id. */
	id: string
	/** Display name — falls back to composed given/family when the store
	 *  lacks a display string. */
	name: string
	/** Given name. */
	firstName?: string
	/** Middle name(s). */
	middleName?: string
	/** Family name. */
	lastName?: string
	/** Nickname. */
	nickname?: string
	/** Email addresses with labels. */
	emails?: ContactEmail[]
	/** Phone numbers with labels. */
	phoneNumbers?: ContactPhone[]
	/** Postal addresses with labels. */
	addresses?: ContactAddress[]
	/** Associated URLs with labels. */
	urls?: ContactUrl[]
	/** Organization name. */
	company?: string
	/** Role within the organization. */
	jobTitle?: string
	/** Free-text note field. */
	note?: string
	/** Platform image reference when 'image' was requested — a file path or
	 *  data reference; shape is platform-dependent. */
	image?: unknown
}

/** Contact fields for add/update — no store id. */
export interface NewContact {
	/** Given name. */
	firstName?: string
	/** Middle name(s). */
	middleName?: string
	/** Family name. */
	lastName?: string
	/** Nickname. */
	nickname?: string
	/** Email addresses with labels. */
	emails?: ContactEmail[]
	/** Phone numbers with labels. */
	phoneNumbers?: ContactPhone[]
	/** Organization name. */
	company?: string
	/** Role within the organization. */
	jobTitle?: string
	/** Free-text note field. */
	note?: string
}

/** Paging options for getAll(). */
export interface GetContactsOptions {
	/** Restrict which members are populated (all fetched by default). */
	fields?: ContactField[]
	/** Client-side sort — the native stores return an unspecified order. */
	sort?: 'firstName' | 'lastName' | 'none'
	/** Max contacts per page. */
	pageSize?: number
	/** Start offset into the result set. */
	pageOffset?: number
}

/** System address-book facade; false supported off mobile. */
export interface Contacts {
	/** Whether the system address book is reachable on this target — false off mobile. */
	readonly supported: boolean
	/** Ensure the contacts permission without prompting twice — returns the
	 *  post-request grant state, 'unsupported' when the store can't be reached. */
	ensure(): Promise<PermissionResult>
	/** Fetch contacts in pages. */
getAll(options?: GetContactsOptions): Promise<Contact[]>
	/** Substring search over display names. */
getByName(predicate: string, fields?: ContactField[]): Promise<Contact[]>
	/** iOS: direct id fetch. Android: the plugin ships no id lookup, so this
	 *  fetches the full store and filters — read-all cost, call sparingly. */
	getById(id: string, fields?: ContactField[]): Promise<Contact | null>
	/** Insert a contact; resolves the store-assigned id. */
add(contact: NewContact): Promise<string>
	/** Patch fields of an existing contact by id. */
update(id: string, contact: NewContact): Promise<string>
	/** Delete a contact by id. */
remove(id: string): Promise<void>
}

export declare const contacts: Contacts

// Contacts — native leaf over @nativescript/contacts. The plugin's worker
// fetch is normalized into our Expo-shaped Contact; permission goes through
// the platform primitives directly (same rationale as media's ensureCamera:
// plugin-side request helpers can't drift). Plugin surfaces differ per
// platform, so every plugin call lives in the contacts-store leaves.
import {
  createNativeContact,
  ensureContactsPermission,
  fetchContactById,
  fetchContacts,
  fetchContactsByName,
} from './contacts-store'
import type {
  Contact,
  ContactAddress,
  ContactField,
  Contacts,
  GetContactsOptions,
  NewContact,
  PermissionResult,
} from './types'

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

/** Contacts service — system address book. */
export const contacts: Contacts = {
  supported: true,

  ensure(): Promise<PermissionResult> {
    return ensureContactsPermission()
  },

  async getAll(options?: GetContactsOptions): Promise<Contact[]> {
    const result = await fetchContacts(pluginFields(options?.fields))

    return applyPage(applySort((result?.data ?? []).map(asContact), options?.sort), options)
  },

  async getByName(predicate: string, fields?: ContactField[]): Promise<Contact[]> {
    const result = await fetchContactsByName(predicate, pluginFields(fields))

    return (result?.data ?? []).map(asContact)
  },

  async getById(id: string, fields?: ContactField[]): Promise<Contact | null> {
    const native = await fetchContactById(id, pluginFields(fields))

    return native ? asContact(native) : null
  },

  async add(contact: NewContact): Promise<string> {
    const native = createNativeContact()

    applyNewContact(native, contact)
    native.save()
    return String(native.id ?? '')
  },

  async update(id: string, contact: NewContact): Promise<string> {
    const existing = await contacts.getById(id)

    if (!existing) {
      throw new Error(`contacts.update: no contact with id ${id}`)
    }

    const native = createNativeContact()

    native.id = id
    applyNewContact(native, contact)
    native.save()
    return id
  },

  async remove(id: string): Promise<void> {
    const native = createNativeContact()

    native.id = id
    native.delete()
  },
}

// Register the permission kind this leaf owns for the platform dispatcher.
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners.contacts = () => contacts.ensure()

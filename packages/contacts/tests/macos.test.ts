import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'

// The macOS leaf runs in a vm with stub Contacts globals — the platform
// import (which dlopens the SDK) is stripped like barcode-scanner does.
const SOURCE = readFileSync(new URL('../src/contacts.macos.ts', import.meta.url), 'utf8')
	.replace(/import\s*\{[\s\S]*?\}\s*from '@octane-xplat\/platform\/macos'/, '')
	.replace(/import type[\s\S]*?from '\.\/types'\n/, '')
	.replace('export const', 'const')

const plain = (value: unknown) => JSON.parse(JSON.stringify(value))

function fixture({ status = 3 }: { status?: number } = {}) {
	const calls: Record<string, any[]> = {}
	const record = (name: string, args: any[]) => (calls[name] ??= []).push(args)
	const people: any[] = [
		{
			identifier: 'p1',
			givenName: 'Ada',
			familyName: 'Lovelace',
			emailAddresses: [{ label: 'home', value: 'ada@example.test' }],
			phoneNumbers: [{ label: 'mobile', value: { stringValue: '+1555' } }],
			isKeyAvailable: () => false,
			imageDataAvailable: false,
		},
		{ identifier: 'p2', givenName: 'Grace', familyName: 'Hopper' },
	]
	const store = {
		enumerateContactsWithFetchRequestErrorUsingBlock: (
			request: any,
			error: any,
			block: (contact: any) => void,
		) => {
			record('enumerate', [request, error])
			for (const c of people) block(c)
			return true
		},
		unifiedContactsMatchingPredicateKeysToFetchError: (predicate: any, keys: any, error: any) => {
			record('matchingPredicate', [predicate, keys, error])
			return { count: 1, objectAtIndex: (i: number) => [people[0]][i] }
		},
		unifiedContactWithIdentifierKeysToFetchError: (id: string, keys: any, error: any) => {
			record('byId', [id, keys, error])
			const found = people.find((p) => p.identifier === id)
			return found ? { ...found, mutableCopy: () => ({ ...found }) } : null
		},
		executeSaveRequestError: (request: any, error: any) => {
			record('save', [request, error])
			return true
		},
		requestAccessForEntityTypeCompletionHandler: (type: number, completion: (granted: boolean) => void) => {
			record('requestAccess', [type])
			completion(true)
		},
	}
	const requests: any[] = []
	const context = vm.createContext({
		CNEntityType: { CNEntityTypeContacts: 0 },
		CNContact: { predicateForContactsMatchingName: (name: string) => ({ name }) },
		CNContactFetchRequest: {
			alloc: () => ({ initWithKeysToFetch: (keys: any[]) => ({ keys }) }),
		},
		CNContactStore: {
			new: () => store,
			authorizationStatusForEntityType: (type: number) => {
				record('authorizationStatus', [type])
				return status
			},
		},
		CNSaveRequest: {
			new: () => {
				const request: any = {}
				request.addContactToContainerWithIdentifier = (contact: any, id: any) => {
					request.contact = contact
					request.container = id
				}
				request.updateContact = (contact: any) => {
					request.updated = contact
				}
				request.deleteContact = (contact: any) => {
					request.deleted = contact
				}
				requests.push(request)
				return request
			},
		},
		CNMutableContact: { new: () => ({}) },
		CNLabeledValue: {
			labeledValueWithLabelValue: (label: any, value: any) => ({ label, value }),
		},
		CNPhoneNumber: { phoneNumberWithStringValue: (value: string) => ({ stringValue: value }) },
		CNContactIdentifierKey: 'identifier',
		CNContactGivenNameKey: 'givenName',
		CNContactMiddleNameKey: 'middleName',
		CNContactFamilyNameKey: 'familyName',
		CNContactNicknameKey: 'nickname',
		CNContactOrganizationNameKey: 'organizationName',
		CNContactJobTitleKey: 'jobTitle',
		CNContactEmailAddressesKey: 'emailAddresses',
		CNContactPhoneNumbersKey: 'phoneNumbers',
		CNContactPostalAddressesKey: 'postalAddresses',
		CNContactUrlAddressesKey: 'urlAddresses',
		CNContactImageDataKey: 'imageData',
		CNContactNoteKey: 'note',
	})
	const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\ncontacts', context)
	return { leaf, store, calls, people, requests }
}

test('ensure maps authorization states and requests access once undetermined', async () => {
	for (const [status, result] of [
		[0, 'granted'],
		[1, 'denied'],
		[2, 'denied'],
		[3, 'granted'],
	] as const) {
		const f = fixture({ status })
		assert.equal(f.leaf.supported, true)
		assert.equal(await f.leaf.ensure(), result)
		assert.equal(Boolean(f.calls.requestAccess), status === 0)
	}
	const context = vm.createContext({
		CNContactStore: undefined,
		...Object.fromEntries(
			[
				'CNContactIdentifierKey',
				'CNContactGivenNameKey',
				'CNContactMiddleNameKey',
				'CNContactFamilyNameKey',
				'CNContactNicknameKey',
				'CNContactOrganizationNameKey',
				'CNContactJobTitleKey',
				'CNContactEmailAddressesKey',
				'CNContactPhoneNumbersKey',
				'CNContactPostalAddressesKey',
				'CNContactUrlAddressesKey',
				'CNContactImageDataKey',
				'CNContactNoteKey',
			].map((key) => [key, key]),
		),
	})
	const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\ncontacts', context)
	assert.equal(leaf.supported, false)
	assert.equal(await leaf.ensure(), 'unsupported')
})

test('getAll enumerates the fetch request and maps labeled values', async () => {
	const f = fixture()
	const list = await f.leaf.getAll()
	assert.equal(list.length, 2)
	assert.deepEqual(plain(list[0]), {
		id: 'p1',
		name: 'Ada Lovelace',
		firstName: 'Ada',
		lastName: 'Lovelace',
		emails: [{ label: 'home', email: 'ada@example.test' }],
		phoneNumbers: [{ label: 'mobile', number: '+1555' }],
		addresses: [],
		urls: [],
	})
	// Fetched keys carry the base set and the default field keys.
	const keys = f.calls.enumerate[0][0].keys
	for (const key of ['identifier', 'givenName', 'familyName', 'emailAddresses', 'phoneNumbers']) {
		assert.ok(keys.includes(key), key)
	}
	// The entitlement-gated notes key is never requested.
	assert.equal(keys.includes('note'), false)

	const sorted = await f.leaf.getAll({ sort: 'lastName', pageSize: 1 })
	assert.equal(sorted.length, 1)
	assert.equal(sorted[0].lastName, 'Hopper')
})

test('name and id lookups route through the store fetchers', async () => {
	const f = fixture()
	const named = await f.leaf.getByName('Ada')
	assert.equal(named.length, 1)
	assert.deepEqual(f.calls.matchingPredicate[0][0], { name: 'Ada' })
	const one = await f.leaf.getById('p1')
	assert.equal(one?.id, 'p1')
	assert.equal(await f.leaf.getById('missing'), null)
})

test('add/update/remove compose save requests against mutable contacts', async () => {
	const f = fixture()
	const id = await f.leaf.add({
		firstName: 'Alan',
		lastName: 'Turing',
		emails: [{ label: 'work', email: 'alan@example.test' }],
		phoneNumbers: [{ number: '+1444' }],
	})
	assert.equal(typeof id, 'string')
	const addRequest = f.calls.save[0][0]
	const native = addRequest.contact
	assert.equal(native.givenName, 'Alan')
	assert.equal(native.familyName, 'Turing')
	assert.deepEqual(native.emailAddresses, [{ label: 'work', value: 'alan@example.test' }])
	assert.deepEqual(native.phoneNumbers, [{ label: null, value: { stringValue: '+1444' } }])

	await f.leaf.update('p1', { firstName: 'Augusta' })
	const updateRequest = f.calls.save[1][0]
	assert.equal(updateRequest.updated.givenName, 'Augusta')
	await f.leaf.remove('p1')
	assert.equal(f.calls.save.length, 3)
	await assert.rejects(f.leaf.update('missing', {}), /no contact/)
	await f.leaf.remove('missing') // absent ids are a no-op
})

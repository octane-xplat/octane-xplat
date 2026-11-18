import { Contact as NativeContact, Contacts as NativeContacts } from '@nativescript/contacts'
import type { ContactFetchResult, NativeContactHandle } from './contacts-store.mobile'
import type { PermissionResult } from './types'

// iOS CNContactStore — outside the @nativescript/types default subset.
declare const CNContactStore: any
declare const CNEntityTypeContacts: number | undefined

export function ensureContactsPermission(): Promise<PermissionResult> {
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

export async function fetchContacts(fields: string[]): Promise<ContactFetchResult> {
  return (await NativeContacts.getAllContacts(fields)) as ContactFetchResult
}

export async function fetchContactsByName(
  predicate: string,
  fields: string[],
): Promise<ContactFetchResult> {
  return (await NativeContacts.getContactsByName(predicate, fields)) as ContactFetchResult
}

export async function fetchContactById(id: string, fields: string[]): Promise<any> {
  const result = await NativeContacts.getContactById(id, fields)

  return (result as ContactFetchResult)?.data ?? result
}

export function createNativeContact(): NativeContactHandle {
  return new (NativeContact as any)()
}

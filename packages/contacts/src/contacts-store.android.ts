import { Application } from '@nativescript/core'
import { Contact as NativeContact, Contacts as NativeContacts } from '@nativescript/contacts'
import { android } from '@octane-xplat/platform/android'
import type { ContactFetchResult, NativeContactHandle } from './contacts-store.mobile'
import type { PermissionResult } from './types'

let contactRequestCode = 7719

export function ensureContactsPermission(): Promise<PermissionResult> {
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
  // Plugin ships getContactById for iOS only — full-store fetch + filter.
  const result = (await NativeContacts.getAllContactsWithoutWorker(fields)) as ContactFetchResult

  return (result?.data ?? []).find((c: any) => String(c?.id) === id) ?? null
}

export function createNativeContact(): NativeContactHandle {
  return new (NativeContact as any)()
}

// Shared contract for the contacts-store platform leaves. The
// @nativescript/contacts plugin surfaces differ per platform (getContactById
// is iOS-only, getAllContactsWithoutWorker Android-only) and both declare
// Promise<unknown>, so the leaves own every plugin call and bind the result
// to these shapes at the boundary.

/** Result the plugin's worker fetches resolve with. */
export interface ContactFetchResult {
  data?: any[]
}

/** Unsaved native contact instance returned by create(). */
export type NativeContactHandle = any

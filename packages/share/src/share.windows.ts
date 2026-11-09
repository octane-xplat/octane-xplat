// Windows leaf — the share sheet needs IDataTransferManagerInterop against
// the app HWND; until a managed helper lands, report 'unavailable' (a
// resolved ShareResult per the contract) instead of reaching the iOS/Android
// share-file imports the unsuffixed leaf would pull in.
import type { Share, ShareFileOptions, ShareResult } from './types'

const unavailable = Promise.resolve<ShareResult>('unavailable')

/** Share service — unavailable on Windows pending a DataTransferManager leaf. */
export const share: Share = {
  text: (_text: string, _subject?: string) => unavailable,
  url: (_url: string, _title?: string) => unavailable,
  file: (_path: string, _options?: ShareFileOptions) => unavailable,
}

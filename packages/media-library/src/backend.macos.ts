import type { LibraryBackend } from './backend-types'
import { createPhotosBackend } from './backend.photos'
import { appleHost } from './photos-runtime.macos'
export const backend: LibraryBackend = createPhotosBackend(appleHost)

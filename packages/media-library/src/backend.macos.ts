import { createPhotosBackend } from './backend.photos'
import { appleHost } from './photos-runtime.macos'
export const backend = createPhotosBackend(appleHost)

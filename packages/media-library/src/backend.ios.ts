import { createPhotosBackend } from './backend.photos'
import { appleHost } from './photos-runtime.ios'
export const backend = createPhotosBackend(appleHost)

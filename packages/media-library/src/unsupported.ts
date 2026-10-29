import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { LibraryBackend } from './backend-types'
const unavailable = (): never => {
	throw new UnavailabilityError('MediaLibrary')
}
/** Browsers, GTK and Windows have no wired device-library backend. */
export const backend: LibraryBackend = {
	isAvailable: () => false,
	permissions: async () => unavailable(),
	presentPermissionsPicker: async () => unavailable(),
	query: async () => unavailable(),
	metadata: async () => unavailable(),
	uri: async () => unavailable(),
	releaseUri() {},
	location: async () => unavailable(),
	createAsset: async () => unavailable(),
	deleteAssets: async () => unavailable(),
	setFavorite: async () => unavailable(),
	albums: async () => unavailable(),
	album: async () => unavailable(),
	albumCount: async () => unavailable(),
	createAlbum: async () => unavailable(),
	deleteAlbums: async () => unavailable(),
	addAssets: async () => unavailable(),
	removeAssets: async () => unavailable(),
	subscribe: unavailable,
}

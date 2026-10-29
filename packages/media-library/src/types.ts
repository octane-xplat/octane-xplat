/** Media kinds recorded by the device library. */
export const MediaType = {
	UNKNOWN: 'unknown',
	IMAGE: 'image',
	AUDIO: 'audio',
	VIDEO: 'video',
} as const
/** One of the device-library media kinds. */
export type MediaType = (typeof MediaType)[keyof typeof MediaType]
/** Apple collection kinds; Android does not expose smart collections. */
export const AlbumType = { ALBUM: 'album', SMART_ALBUM: 'smartAlbum' } as const
/** A regular album or Apple smart album. */
export type AlbumType = (typeof AlbumType)[keyof typeof AlbumType]
/** Choose the current rendition or original asset resource. */
export const AssetUriVersion = { CURRENT: 'current', ORIGINAL: 'original' } as const
/** Export version; Android returns the content URI for either value. */
export type AssetUriVersion = (typeof AssetUriVersion)[keyof typeof AssetUriVersion]
/** Export settings. Defaults to current. Release returned Apple files with releaseAssetUri. */
export type AssetUriOptions = { version?: AssetUriVersion }
/** Expo-shaped permission statuses; a limited grant is granted. */
export const PermissionStatus = {
	GRANTED: 'granted',
	DENIED: 'denied',
	UNDETERMINED: 'undetermined',
} as const
/** Granted, denied, or not yet determined by the OS. */
export type PermissionStatus = (typeof PermissionStatus)[keyof typeof PermissionStatus]
/** Android 13+ read-access categories; omitted means all three. */
export type GranularPermission = 'audio' | 'photo' | 'video'
/** Visual categories supported by the limited-selection picker. */
export type MediaTypeFilter = 'photo' | 'video'
/** Current access state. Reading it never prompts; limited access exposes selected assets only. */
export interface PermissionResponse {
	status: PermissionStatus
	granted: boolean
	canAskAgain: boolean
	expires: 'never'
	accessPrivileges: 'all' | 'limited' | 'none'
}
/** Octane hook settings. Defaults: read on mount, no prompt, read/write access. */
export interface PermissionHookOptions {
	writeOnly?: boolean
	granularPermissions?: GranularPermission[]
	/** Read on mount by default. Reading never prompts. */
	get?: boolean
	/** Prompt on mount only when explicitly enabled. Prefer an action calling the request callback. */
	request?: boolean
}
/** Filter and ordering keys supported by this package. */
export const AssetField = {
	CREATION_TIME: 'creationTime',
	MODIFICATION_TIME: 'modificationTime',
	MEDIA_TYPE: 'mediaType',
	WIDTH: 'width',
	HEIGHT: 'height',
	DURATION: 'duration',
	IS_FAVORITE: 'isFavorite',
} as const
/** A validated metadata query key. */
export type AssetField = (typeof AssetField)[keyof typeof AssetField]
/** Values accepted by equality and inclusion filters. Times and duration use seconds. */
export interface AssetFieldValueMap {
	creationTime: number
	modificationTime: number
	mediaType: MediaType
	width: number
	height: number
	duration: number
	isFavorite: boolean
}
/** Query ordering. ascending defaults to true. */
export interface SortDescriptor {
	key: AssetField
	ascending?: boolean
}
/** Current metadata without file export. Dimensions use pixels; timestamps and duration use seconds. */
export interface AssetMetadata {
	id: string
	filename: string | null
	mediaType: MediaType
	width: number | null
	height: number | null
	duration: number | null
	/** Unix timestamp in seconds, matching Expo's modern API. */
	creationTime: number | null
	modificationTime: number | null
	isFavorite: boolean
}
/** Metadata plus a readable URI. Release its URI after preview/upload finishes. */
export interface AssetInfo extends Omit<AssetMetadata, 'filename' | 'width' | 'height'> {
	filename: string
	width: number
	height: number
	uri: string
}
/** Current collection metadata. Android returns null for type. */
export interface AlbumMetadata {
	id: string
	title: string
	type: AlbumType | null
}
/** Asset location in decimal degrees. Android location metadata is unavailable. */
export interface Location {
	latitude: number
	longitude: number
}
/** Recorded pixel dimensions, without decoding the full image. */
export interface Shape {
	width: number
	height: number
}
/** Library invalidation. This version emits hasIncrementalChanges: false; reload your page. */
export interface MediaLibraryAssetsChangeEvent {
	hasIncrementalChanges: boolean
	insertedAssets?: string[]
	deletedAssets?: string[]
	updatedAssets?: string[]
}
/** Own one change subscription; remove is idempotent and stops queued delivery. */
export interface EventSubscription {
	remove(): void
}

import type {
	AlbumMetadata,
	AssetField,
	AssetMetadata,
	AssetUriOptions,
	EventSubscription,
	GranularPermission,
	Location,
	MediaLibraryAssetsChangeEvent,
	MediaTypeFilter,
	PermissionResponse,
	SortDescriptor,
} from './types'

export interface Filter {
	field: AssetField
	operator: 'eq' | 'within' | 'gt' | 'gte' | 'lt' | 'lte'
	value: string | number | boolean | readonly (string | number | boolean)[]
}
export interface QuerySpec {
	filters: Filter[]
	order: SortDescriptor[]
	limit?: number
	offset: number
	album?: string
}
export interface LibraryBackend {
	isAvailable(): boolean
	permissions(
		request: boolean,
		writeOnly: boolean,
		granular?: GranularPermission[],
	): Promise<PermissionResponse>
	presentPermissionsPicker(types?: MediaTypeFilter[]): Promise<void>
	query(spec: QuerySpec): Promise<AssetMetadata[]>
	metadata(id: string): Promise<AssetMetadata>
	uri(id: string, options: AssetUriOptions): Promise<string>
	releaseUri(uri: string): void
	location(id: string): Promise<Location | null>
	createAsset(file: string, album?: string): Promise<string>
	deleteAssets(ids: string[]): Promise<void>
	setFavorite(id: string, favorite: boolean): Promise<void>
	albums(options: { smart?: boolean; asset?: string }): Promise<AlbumMetadata[]>
	album(id: string): Promise<AlbumMetadata>
	albumCount(id: string): Promise<number>
	createAlbum(title: string, assets: string[], move: boolean): Promise<string>
	deleteAlbums(ids: string[], deleteAssets: boolean): Promise<void>
	addAssets(album: string, assets: string[]): Promise<void>
	removeAssets(album: string, assets: string[]): Promise<void>
	subscribe(listener: (event: MediaLibraryAssetsChangeEvent) => void): EventSubscription
}

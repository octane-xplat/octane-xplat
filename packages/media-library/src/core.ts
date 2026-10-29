import { backend } from './backend'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { AssetField, AssetUriVersion } from './types'
import type {
	AlbumMetadata,
	AlbumType,
	AssetFieldValueMap,
	AssetInfo,
	AssetMetadata,
	AssetUriOptions,
	GranularPermission,
	MediaLibraryAssetsChangeEvent,
	MediaTypeFilter,
	PermissionResponse,
	SortDescriptor,
} from './types'
import type { Filter, QuerySpec } from './backend-types'

function identifier(value: string): string {
	if (typeof value !== 'string' || !value.trim()) {
		throw new TypeError('A media identifier must not be empty')
	}
	return value
}
function whole(value: number, name: string): number {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new RangeError(`${name} must be a nonnegative integer`)
	}
	return value
}
function fileUri(value: string): string {
	if (typeof value === 'string' && value.startsWith('file://')) {
		return value
	}
	if (typeof value === 'string' && value.startsWith('/')) {
		return `file://${value.split('/').map(encodeURIComponent).join('/')}`
	}
	throw new TypeError('Asset creation requires a local file URI or absolute app file path')
}

/** A durable library identifier; constructing a handle neither reads nor prompts.
 * @example
 * ```ts
 * import { Asset } from '@octane-xplat/media-library'
 * const asset = new Asset('ph://saved-record-id')
 * const metadata = await asset.getShape()
 * ```
 */
export class Asset {
	readonly id: string
	constructor(id: string) {
		this.id = identifier(id)
	}
	getCreationTime() {
		return backend.metadata(this.id).then((value) => value.creationTime)
	}
	getModificationTime() {
		return backend.metadata(this.id).then((value) => value.modificationTime)
	}
	getDuration() {
		return backend.metadata(this.id).then((value) => value.duration)
	}
	getFilename() {
		return backend.metadata(this.id).then((value) => value.filename ?? '')
	}
	getWidth() {
		return backend.metadata(this.id).then((value) => dimension(value.width, 'width'))
	}
	getHeight() {
		return backend.metadata(this.id).then((value) => dimension(value.height, 'height'))
	}
	getMediaType() {
		return backend.metadata(this.id).then((value) => value.mediaType)
	}
	getFavorite() {
		return backend.metadata(this.id).then((value) => value.isFavorite)
	}
	async getShape() {
		const value = await backend.metadata(this.id)
		return value.width === null || value.height === null
			? null
			: { width: value.width, height: value.height }
	}
	/** Export a temporary Apple file or return an Android content URI. Release it with releaseAssetUri. */
	getUri(options: AssetUriOptions = {}): Promise<string> {
		const version = options.version ?? AssetUriVersion.CURRENT
		if (version !== 'current' && version !== 'original') {
			throw new TypeError('Unknown asset URI version')
		}
		return backend.uri(this.id, { version })
	}
	/** Export current media with metadata; release the returned uri after use. */
	async getInfo(): Promise<AssetInfo> {
		const value = await backend.metadata(this.id)
		const width = dimension(value.width, 'width'),
			height = dimension(value.height, 'height')
		const uri = await this.getUri()
		return { ...value, uri, filename: value.filename ?? '', width, height }
	}
	getLocation() {
		return backend.location(this.id)
	}
	async getAlbums(): Promise<Album[]> {
		return (await backend.albums({ asset: this.id })).map((value) => new Album(value.id))
	}
	setFavorite(favorite: boolean): Promise<void> {
		if (typeof favorite !== 'boolean') {
			throw new TypeError('Favorite must be boolean')
		}
		return backend.setFavorite(this.id, favorite)
	}
	delete(): Promise<void> {
		return Asset.delete([this])
	}
	/** Copy a local file URI or absolute path into the library, preserving the source. */
	static async create(file: string, album?: Album): Promise<Asset> {
		return new Asset(await backend.createAsset(fileUri(file), album?.id))
	}
	static delete(assets: Asset[]): Promise<void> {
		return backend.deleteAssets(assetIds(assets))
	}
}
function dimension(value: number | null, name: string): number {
	if (value === null) {
		throw new Error(`Asset ${name} is unavailable in library metadata`)
	}
	return value
}
function assetIds(assets: Asset[]): string[] {
	if (!Array.isArray(assets) || assets.some((asset) => !(asset instanceof Asset))) {
		throw new TypeError('Expected Asset handles')
	}
	return [...new Set(assets.map((asset) => asset.id))]
}

/** Albums are handles to current OS collections, not cached copies.
 * @example
 * ```ts
 * import { Album } from '@octane-xplat/media-library'
 * const album = new Album('saved-album-id')
 * const count = await album.getAssetCount()
 * ```
 */
export class Album {
	readonly id: string
	constructor(id: string) {
		this.id = identifier(id)
	}
	getTitle(): Promise<string> {
		return backend.album(this.id).then((value) => value.title)
	}
	getType(): Promise<AlbumType> {
		return backend.album(this.id).then((value) => {
			if (value.type === null) {
				throw new UnavailabilityError('Album.getType')
			}
			return value.type
		})
	}
	getAssets(): Promise<Asset[]> {
		return new Query().album(this).exe()
	}
	getAssetCount(): Promise<number> {
		return backend.albumCount(this.id)
	}
	add(assets: Asset | Asset[]): Promise<void> {
		return backend.addAssets(this.id, assetIds(Array.isArray(assets) ? assets : [assets]))
	}
	removeAssets(assets: Asset[]): Promise<void> {
		return backend.removeAssets(this.id, assetIds(assets))
	}
	delete(): Promise<void> {
		return Album.delete([this])
	}
	static async create(
		title: string,
		assets: string[] | Asset[],
		moveAssets = true,
	): Promise<Album> {
		identifier(title)
		if (!Array.isArray(assets)) {
			throw new TypeError('Expected an array of file URIs or Asset handles')
		}
		const sources = assets.every((asset) => typeof asset === 'string')
			? (assets as string[]).map(fileUri)
			: assetIds(assets as Asset[])
		if (typeof moveAssets !== 'boolean') {
			throw new TypeError('moveAssets must be boolean')
		}
		return new Album(await backend.createAlbum(title, sources, moveAssets))
	}
	/** Apple preserves assets by default; Android deletes the assets along with the directory album. */
	static delete(albums: Album[], deleteAssets = false): Promise<void> {
		if (!Array.isArray(albums) || albums.some((album) => !(album instanceof Album))) {
			throw new TypeError('Expected Album handles')
		}
		if (typeof deleteAssets !== 'boolean') {
			throw new TypeError('deleteAssets must be boolean')
		}
		return backend.deleteAlbums([...new Set(albums.map((album) => album.id))], deleteAssets)
	}
	static async get(title: string): Promise<Album | null> {
		identifier(title)
		const match = (await backend.albums({})).find((album) => album.title === title)
		return match ? new Album(match.id) : null
	}
	static async getAll(): Promise<Album[]> {
		return (await backend.albums({})).map((value) => new Album(value.id))
	}
	static getAlbumsMetadata(): Promise<AlbumMetadata[]> {
		return backend.albums({})
	}
	static async getSmartAlbums(): Promise<Album[]> {
		return (await backend.albums({ smart: true })).map((value) => new Album(value.id))
	}
}

/** Mutable Expo-style query builder. Execution snapshots its current parameters.
 * @example
 * ```ts
 * import { AssetField, Query } from '@octane-xplat/media-library'
 * const rows = await new Query().orderBy(AssetField.CREATION_TIME).limit(20).exeForMetadata()
 * ```
 */
export class Query {
	#spec: QuerySpec = { filters: [], order: [], offset: 0 }
	#filter(field: AssetField, operator: Filter['operator'], value: Filter['value']): this {
		if (!Object.values(AssetField).includes(field)) {
			throw new TypeError('Unknown query field')
		}
		const values = Array.isArray(value) ? value : [value]
		const expected =
			field === 'mediaType' ? 'string' : field === 'isFavorite' ? 'boolean' : 'number'
		if (
			values.some(
				(item) => typeof item !== expected || (typeof item === 'number' && !Number.isFinite(item)),
			)
		) {
			throw new TypeError('Query value does not match its field')
		}
		if (
			field === 'mediaType' &&
			values.some((item) => !['unknown', 'image', 'audio', 'video'].includes(String(item)))
		) {
			throw new TypeError('Unknown media type')
		}
		if (!['eq', 'within'].includes(operator) && expected !== 'number') {
			throw new TypeError('Ordering filters require a numeric field')
		}
		this.#spec.filters.push({ field, operator, value: Array.isArray(value) ? [...value] : value })
		return this
	}
	eq<T extends AssetField>(field: T, value: AssetFieldValueMap[T]): this {
		return this.#filter(field, 'eq', value)
	}
	within<T extends AssetField>(field: T, value: AssetFieldValueMap[T][]): this {
		if (!Array.isArray(value)) {
			throw new TypeError('within requires an array')
		}
		return this.#filter(field, 'within', value)
	}
	gt(field: AssetField, value: number): this {
		return this.#filter(field, 'gt', value)
	}
	gte(field: AssetField, value: number): this {
		return this.#filter(field, 'gte', value)
	}
	lt(field: AssetField, value: number): this {
		return this.#filter(field, 'lt', value)
	}
	lte(field: AssetField, value: number): this {
		return this.#filter(field, 'lte', value)
	}
	limit(value: number): this {
		this.#spec.limit = whole(value, 'limit')
		return this
	}
	offset(value: number): this {
		this.#spec.offset = whole(value, 'offset')
		return this
	}
	orderBy(value: SortDescriptor | AssetField): this {
		const descriptor = typeof value === 'string' ? { key: value, ascending: true } : { ...value }
		if (!Object.values(AssetField).includes(descriptor.key)) {
			throw new TypeError('Unknown sort field')
		}
		if (descriptor.ascending !== undefined && typeof descriptor.ascending !== 'boolean') {
			throw new TypeError('ascending must be boolean')
		}
		this.#spec.order.push(descriptor)
		return this
	}
	album(value: Album): this {
		if (!(value instanceof Album)) {
			throw new TypeError('Expected an Album handle')
		}
		this.#spec.album = value.id
		return this
	}
	exeForMetadata(): Promise<AssetMetadata[]> {
		const spec = {
			...this.#spec,
			filters: this.#spec.filters.map((filter) => ({
				...filter,
				value: Array.isArray(filter.value) ? [...filter.value] : filter.value,
			})),
			order: this.#spec.order.map((order) => ({ ...order })),
		}
		return backend.query(spec)
	}
	async exe(): Promise<Asset[]> {
		return (await this.exeForMetadata()).map((value) => new Asset(value.id))
	}
}

/** Discover whether this host has a device-library adapter; does not ask for access. */
export async function isAvailable(): Promise<boolean> {
	return backend.isAvailable()
}
function permissionArgs(
	writeOnly: boolean,
	granular?: GranularPermission[],
): GranularPermission[] | undefined {
	if (typeof writeOnly !== 'boolean') {
		throw new TypeError('writeOnly must be boolean')
	}
	if (
		granular !== undefined &&
		(!Array.isArray(granular) ||
			granular.some((value) => !['audio', 'photo', 'video'].includes(value)))
	) {
		throw new TypeError('Unknown granular media permission')
	}
	return granular === undefined ? undefined : [...new Set(granular)]
}
/** Read access without prompting. Defaults to read/write and all Android categories. */
export function getPermissionsAsync(
	writeOnly = false,
	granularPermissions?: GranularPermission[],
): Promise<PermissionResponse> {
	return backend.permissions(false, writeOnly, permissionArgs(writeOnly, granularPermissions))
}
/** Ask the OS for access from an app action. Requires the Apple purpose string before prompting. */
export function requestPermissionsAsync(
	writeOnly = false,
	granularPermissions?: GranularPermission[],
): Promise<PermissionResponse> {
	return backend.permissions(true, writeOnly, permissionArgs(writeOnly, granularPermissions))
}
/** Change selected photos on limited grants (iOS / Android 14+); full access is a no-op. */
export function presentPermissionsPicker(types?: MediaTypeFilter[]): Promise<void> {
	if (
		types !== undefined &&
		(!Array.isArray(types) || types.some((value) => !['photo', 'video'].includes(value)))
	) {
		throw new TypeError('Unknown permissions-picker media type')
	}
	return backend.presentPermissionsPicker(types === undefined ? undefined : [...new Set(types)])
}
/** Deletes only temporary asset exports created by this package, never library originals. */
export function releaseAssetUri(uri: string): void {
	backend.releaseUri(uri)
}
const subscriptions = new Set<{ remove(): void }>()
/** Subscribe after read access is granted. Reload on changes and remove at the owner boundary. */
export function addListener(listener: (event: MediaLibraryAssetsChangeEvent) => void) {
	if (typeof listener !== 'function') {
		throw new TypeError('A listener must be a function')
	}
	let active = true
	const native = backend.subscribe((event) => {
		if (active) {
			listener(event)
		}
	})
	const subscription = {
		remove() {
			if (subscriptions.delete(subscription)) {
				active = false
				native.remove()
			}
		},
	}
	subscriptions.add(subscription)
	return subscription
}
/** Remove every subscription owned by this module; prefer removing your own subscription. */
export function removeAllListeners(): void {
	const pending = Array.from(subscriptions)
	for (const subscription of pending) {
		subscription.remove()
	}
}

/** Xplat capability discovery alongside the current Expo-shaped constructors and functions. */
export const MediaLibrary = {
	get supported(): boolean {
		return backend.isAvailable()
	},
	isAvailable,
	Asset,
	Album,
	Query,
	getPermissionsAsync,
	requestPermissionsAsync,
	presentPermissionsPicker,
	addListener,
	removeAllListeners,
	releaseAssetUri,
}

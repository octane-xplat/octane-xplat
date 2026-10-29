import { Application } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { LibraryBackend, QuerySpec } from './backend-types'
import type {
	AlbumMetadata,
	AssetField,
	AssetMetadata,
	GranularPermission,
	PermissionResponse,
} from './types'

type NativeObserver = { start(resolver: android.content.ContentResolver): void; stop(): void }
type ObserverBridge = {
	new (listener: unknown): NativeObserver
	Listener: new (methods: { changed(): void }) => unknown
}
function observerBridge(): ObserverBridge | undefined {
	const scope = globalThis as unknown as {
		com?: { octanexplat?: { medialibrary?: { LibraryObserver?: ObserverBridge } } }
	}
	return scope.com?.octanexplat?.medialibrary?.LibraryObserver
}
const available = () =>
	typeof android !== 'undefined' &&
	android.os.Build.VERSION.SDK_INT >= 29 &&
	Boolean(Application.android && observerBridge())
function context(): android.content.Context {
	if (!available()) {
		throw new UnavailabilityError('MediaLibrary on Android 10+ with its native plugin')
	}
	return Application.android.context
}
const resolver = () => context().getContentResolver()
const root = () => android.provider.MediaStore.Files.getContentUri('external')
const sdk = () => android.os.Build.VERSION.SDK_INT
const visualSelected = 'android.permission.READ_MEDIA_VISUAL_USER_SELECTED'
const granularNames: Record<GranularPermission, string> = {
	photo: 'android.permission.READ_MEDIA_IMAGES',
	video: 'android.permission.READ_MEDIA_VIDEO',
	audio: 'android.permission.READ_MEDIA_AUDIO',
}
const defaults: GranularPermission[] = ['photo', 'video', 'audio']
const granted = (permission: string) =>
	context().checkSelfPermission(permission) === android.content.pm.PackageManager.PERMISSION_GRANTED
const preferences = () =>
	context().getSharedPreferences('octane-xplat-media-library', android.content.Context.MODE_PRIVATE)
const namesFor = (granular: GranularPermission[]) =>
	sdk() >= 33
		? granular.map((value) => granularNames[value])
		: ['android.permission.READ_EXTERNAL_STORAGE']
function permissionResponse(writeOnly: boolean, granular = defaults): PermissionResponse {
	if (writeOnly) {
		return {
			status: 'granted',
			granted: true,
			canAskAgain: true,
			expires: 'never',
			accessPrivileges: 'all',
		}
	}
	const names = namesFor(granular)
	const all = names.every(granted)
	const limited =
		sdk() >= 34 &&
		granular.some((value) => value !== 'audio') &&
		granted(visualSelected) &&
		(!granular.includes('audio') || granted(granularNames.audio))
	const activity = Application.android.foregroundActivity ?? Application.android.startActivity
	const canAskAgain = names.some(
		(value) =>
			!granted(value) &&
			(!preferences().getBoolean(value, false) ||
				Boolean(activity?.shouldShowRequestPermissionRationale(value))),
	)
	return {
		status:
			all || limited
				? 'granted'
				: names.some((value) => preferences().getBoolean(value, false))
					? 'denied'
					: 'undetermined',
		granted: all || limited,
		canAskAgain: all || limited || canAskAgain,
		expires: 'never',
		accessPrivileges: all ? 'all' : limited ? 'limited' : 'none',
	}
}
function assertReadable(): void {
	context()
	const any =
		sdk() >= 33
			? defaults.some((value) => granted(granularNames[value])) ||
				(sdk() >= 34 && granted(visualSelected))
			: granted('android.permission.READ_EXTERNAL_STORAGE')
	if (!any) {
		throw new Error('Media-library read permission is required')
	}
}
let requestCode = 22528
let presentation = Promise.resolve()
function serialized<T>(action: () => Promise<T>): Promise<T> {
	const operation = presentation.then(action, action)
	presentation = operation.then(
		() => {},
		() => {},
	)
	return operation
}
const prompts = new Map<string, Promise<PermissionResponse>>()
async function permissions(
	request: boolean,
	writeOnly: boolean,
	granular = defaults,
): Promise<PermissionResponse> {
	context()
	if (!granular.length) {
		throw new RangeError('Request at least one granular permission')
	}
	const current = permissionResponse(writeOnly, granular)
	if (
		!request ||
		writeOnly ||
		(current.granted && current.accessPrivileges === 'all') ||
		!current.canAskAgain
	) {
		return current
	}
	const key = [...granular].sort().join(',')
	const previous = prompts.get(key)
	if (previous) {
		return previous
	}
	const operation = serialized(async () => {
		const activity = Application.android.foregroundActivity
		if (!activity) {
			throw new Error('A foreground Android activity is required to request media permissions')
		}
		const names = namesFor(granular)
		if (sdk() >= 34 && granular.some((value) => value !== 'audio')) {
			names.push(visualSelected)
		}
		const info = context()
			.getPackageManager()
			.getPackageInfo(context().getPackageName(), android.content.pm.PackageManager.GET_PERMISSIONS)
		const declared = Array.from(info.requestedPermissions ?? [])
		const missing = names.filter((name) => !declared.includes(name))
		if (missing.length) {
			throw new Error(
				`Declare Android media permissions before requesting them: ${missing.join(', ')}`,
			)
		}
		return new Promise<PermissionResponse>((resolve, reject) => {
			const code = requestCode++
			const cleanup = () => {
				Application.android.off(Application.android.activityRequestPermissionsEvent, result)
				Application.android.off(Application.android.activityDestroyedEvent, destroyed)
			}
			const result = (args: { requestCode: number }) => {
				if (args.requestCode !== code) {
					return
				}
				cleanup()
				const editor = preferences().edit()
				for (const name of names) {
					editor.putBoolean(name, true)
				}
				editor.apply()
				resolve(permissionResponse(writeOnly, granular))
			}
			const destroyed = (args: { activity: android.app.Activity }) => {
				if (args.activity === activity) {
					cleanup()
					reject(new Error('Media permission request was interrupted'))
				}
			}
			Application.android.on(Application.android.activityRequestPermissionsEvent, result)
			Application.android.on(Application.android.activityDestroyedEvent, destroyed)
			try {
				activity.requestPermissions(names, code)
			} catch (error) {
				cleanup()
				reject(error)
			}
		})
	})
	prompts.set(key, operation)
	void operation.then(
		() => prompts.delete(key),
		() => prompts.delete(key),
	)
	return operation
}
function mediaUri(id: string): android.net.Uri {
	if (!/^content:\/\/media\/[^/]+\/(?:images\/media|video\/media|audio\/media)\/\d+$/.test(id)) {
		throw new TypeError('Expected a MediaStore asset identifier')
	}
	return android.net.Uri.parse(id)
}
const columns: Record<AssetField, string> = {
	creationTime: 'datetaken',
	modificationTime: 'date_modified',
	mediaType: 'media_type',
	width: 'width',
	height: 'height',
	duration: 'duration',
	isFavorite: 'is_favorite',
}
const mediaNumbers: Record<string, number> = { image: 1, audio: 2, video: 3, unknown: 0 }
const projections = [
	'_id',
	'_display_name',
	'media_type',
	'width',
	'height',
	'duration',
	'datetaken',
	'date_modified',
	'is_favorite',
	'bucket_id',
	'bucket_display_name',
	'relative_path',
]
const nullableNumber = (cursor: android.database.Cursor, column: string): number | null => {
	const index = cursor.getColumnIndex(column)
	return index < 0 || cursor.isNull(index) ? null : Number(cursor.getLong(index))
}
const nullableString = (cursor: android.database.Cursor, column: string): string | null => {
	const index = cursor.getColumnIndex(column)
	return index < 0 || cursor.isNull(index) ? null : String(cursor.getString(index))
}
function metadata(cursor: android.database.Cursor): AssetMetadata {
	const kind = nullableNumber(cursor, 'media_type'),
		row = nullableString(cursor, '_id')
	if (row === null) {
		throw new Error('MediaStore returned no asset identifier')
	}
	const collection =
		kind === 1
			? android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI
			: kind === 2
				? android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
				: android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI
	const duration = nullableNumber(cursor, 'duration'),
		creation = nullableNumber(cursor, 'datetaken')
	return {
		id: `${String(collection)}/${row}`,
		filename: nullableString(cursor, '_display_name'),
		mediaType: kind === 1 ? 'image' : kind === 2 ? 'audio' : kind === 3 ? 'video' : 'unknown',
		width: kind === 2 ? 0 : nullableNumber(cursor, 'width'),
		height: kind === 2 ? 0 : nullableNumber(cursor, 'height'),
		duration: duration === null || kind === 1 ? null : duration / 1000,
		creationTime: creation === null ? null : creation / 1000,
		modificationTime: nullableNumber(cursor, 'date_modified'),
		isFavorite: nullableNumber(cursor, 'is_favorite') === 1,
	}
}
function cursorFor(
	uri: android.net.Uri,
	selection: string | null = null,
	args: string[] | null = null,
	order: string | null = null,
) {
	const cursor = resolver().query(
		uri,
		sdk() >= 30 ? projections : projections.filter((column) => column !== 'is_favorite'),
		selection,
		args,
		order,
	)
	if (!cursor) {
		throw new Error('MediaStore did not return a query cursor')
	}
	return cursor
}
function rowFor(id: string): AssetMetadata {
	assertReadable()
	const cursor = cursorFor(mediaUri(id))
	try {
		if (!cursor.moveToFirst()) {
			throw new Error('Asset is missing or outside the granted library scope')
		}
		return metadata(cursor)
	} finally {
		cursor.close()
	}
}
function query(spec: QuerySpec): AssetMetadata[] {
	assertReadable()
	const where = ['media_type IN (1,2,3)', 'is_pending = 0'],
		args: string[] = []
	if (spec.album) {
		album(spec.album)
		where.push('bucket_id = ?')
		args.push(spec.album)
	}
	for (const filter of spec.filters) {
		if (filter.field === 'isFavorite' && sdk() < 30) {
			throw new UnavailabilityError('MediaStore favorite filters on Android 10')
		}
		const values = Array.isArray(filter.value) ? filter.value : [filter.value]
		if (filter.operator === 'within' && !values.length) {
			return []
		}
		const operator = { eq: '=', within: 'IN', gt: '>', gte: '>=', lt: '<', lte: '<=' }[
			filter.operator
		]
		where.push(
			`${columns[filter.field]} ${operator} ${filter.operator === 'within' ? `(${values.map(() => '?').join(',')})` : '?'}`,
		)
		for (const value of values) {
			const converted =
				filter.field === 'mediaType'
					? mediaNumbers[String(value)]
					: filter.field === 'isFavorite'
						? Number(value)
						: Number(value) *
							(filter.field === 'creationTime' || filter.field === 'duration' ? 1000 : 1)
			if (!Number.isFinite(converted)) {
				throw new RangeError('Query value is outside the supported numeric range')
			}
			args.push(String(converted))
		}
	}
	if (spec.limit === 0) {
		return []
	}
	if (sdk() < 30 && spec.order.some((value) => value.key === 'isFavorite')) {
		throw new UnavailabilityError('MediaStore favorite sorting on Android 10')
	}
	const order = spec.order.length
		? spec.order
				.map((value) => `${columns[value.key]} ${value.ascending === false ? 'DESC' : 'ASC'}`)
				.join(',')
		: null
	const cursor = cursorFor(root(), where.join(' AND '), args, order)
	try {
		const rows: AssetMetadata[] = []
		cursor.moveToPosition(spec.offset - 1)
		while ((spec.limit === undefined || rows.length < spec.limit) && cursor.moveToNext()) {
			rows.push(metadata(cursor))
		}
		return rows
	} finally {
		cursor.close()
	}
}
function albums(): Array<AlbumMetadata & { path: string }> {
	assertReadable()
	const cursor = cursorFor(root(), 'media_type IN (1,2,3) AND is_pending = 0')
	try {
		const result = new Map<string, AlbumMetadata & { path: string }>()
		while (cursor.moveToNext()) {
			const id = nullableString(cursor, 'bucket_id'),
				name = nullableString(cursor, 'bucket_display_name'),
				path = nullableString(cursor, 'relative_path')
			if (id !== null && name !== null && path !== null) {
				result.set(id, { id, title: name, type: null, path })
			}
		}
		return [...result.values()]
	} finally {
		cursor.close()
	}
}
function album(id: string) {
	assertReadable()
	const cursor = cursorFor(root(), 'bucket_id = ? AND media_type IN (1,2,3) AND is_pending = 0', [
		id,
	])
	try {
		if (!cursor.moveToFirst()) {
			throw new Error('Album is missing or outside the granted library scope')
		}
		const title = nullableString(cursor, 'bucket_display_name'),
			path = nullableString(cursor, 'relative_path')
		if (title === null || path === null) {
			throw new Error('Album metadata is unavailable')
		}
		return { id, title, path, type: null, count: cursor.getCount() }
	} finally {
		cursor.close()
	}
}

// All OS confirmation UI shares one queue with runtime permission presentation.
function confirm(intent: android.app.PendingIntent): Promise<void> {
	return serialized(
		() =>
			new Promise((resolve, reject) => {
				const activity = Application.android.foregroundActivity
				if (!activity) {
					reject(new Error('A foreground activity is required for media confirmation'))
					return
				}
				const code = requestCode++
				const cleanup = () => {
					Application.android.off(Application.android.activityResultEvent, result)
					Application.android.off(Application.android.activityDestroyedEvent, destroyed)
				}
				const result = (args: { requestCode: number; resultCode: number }) => {
					if (args.requestCode !== code) {
						return
					}
					cleanup()
					if (args.resultCode === android.app.Activity.RESULT_OK) {
						resolve()
					} else {
						reject(
							Object.assign(new Error('Media-library change was cancelled'), {
								code: 'ERR_MEDIA_LIBRARY_CANCELLED',
							}),
						)
					}
				}
				const destroyed = (args: { activity: android.app.Activity }) => {
					if (args.activity === activity) {
						cleanup()
						reject(new Error('Media confirmation was interrupted'))
					}
				}
				Application.android.on(Application.android.activityResultEvent, result)
				Application.android.on(Application.android.activityDestroyedEvent, destroyed)
				try {
					activity.startIntentSenderForResult(
						intent.getIntentSender(),
						code,
						new android.content.Intent(),
						0,
						0,
						0,
					)
				} catch (error) {
					cleanup()
					reject(error)
				}
			}),
	)
}
function uriList(ids: string[]) {
	const result = new java.util.ArrayList<android.net.Uri>()
	for (const id of ids) {
		result.add(mediaUri(id))
	}
	return result
}
async function writable(ids: string[]): Promise<void> {
	if (ids.length && sdk() >= 30) {
		await confirm(android.provider.MediaStore.createWriteRequest(resolver(), uriList(ids)))
	}
}
function recoverable(error: unknown): android.app.RecoverableSecurityException | undefined {
	const value =
		typeof error === 'object' && error !== null && 'nativeException' in error
			? error.nativeException
			: error
	return value instanceof android.app.RecoverableSecurityException ? value : undefined
}
async function removeAssets(ids: string[]): Promise<void> {
	context()
	if (!ids.length) {
		return
	}
	if (sdk() >= 30) {
		await confirm(android.provider.MediaStore.createDeleteRequest(resolver(), uriList(ids)))
		return
	}
	for (const id of ids) {
		try {
			if (resolver().delete(mediaUri(id), null, null) < 1) {
				throw new Error('Asset deletion did not affect a row')
			}
		} catch (error) {
			const security = recoverable(error)
			if (security) {
				await confirm(security.getUserAction().getActionIntent())
				if (resolver().delete(mediaUri(id), null, null) < 1) {
					throw new Error('Asset deletion did not affect a row')
				}
			} else {
				throw error
			}
		}
	}
}
function valuesForPath(path: string) {
	const values = new android.content.ContentValues()
	values.put('relative_path', path)
	return values
}
async function move(ids: string[], path: string): Promise<void> {
	await writable(ids)
	for (const id of ids) {
		try {
			if (resolver().update(mediaUri(id), valuesForPath(path), null, null) < 1) {
				throw new Error('Moving the asset did not affect a row')
			}
		} catch (error) {
			const security = recoverable(error)
			if (sdk() === 29 && security) {
				await confirm(security.getUserAction().getActionIntent())
				if (resolver().update(mediaUri(id), valuesForPath(path), null, null) < 1) {
					throw new Error('Moving the asset did not affect a row')
				}
			} else {
				throw error
			}
		}
	}
}
async function create(file: string, targetPath?: string): Promise<string> {
	const uri = android.net.Uri.parse(file),
		local = uri.getPath()
	if (uri.getScheme() !== 'file' || !local) {
		throw new Error('Asset creation requires a local file URI')
	}
	const source = new java.io.File(local)
	if (!source.isFile()) {
		throw new Error('Asset source must be a readable local file')
	}
	const extension = source.getName().split('.').pop()?.toLowerCase() ?? ''
	const mime = android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
	if (!mime) {
		throw new Error('Asset source requires a recognized image, video or audio extension')
	}
	return publishCopy(source.getName(), mime, targetPath, () => new java.io.FileInputStream(source))
}
async function copyAsset(id: string, targetPath: string): Promise<string> {
	const value = rowFor(id),
		uri = mediaUri(id),
		mime = resolver().getType(uri)
	if (!mime) {
		throw new Error('The source asset media type is unavailable')
	}
	return publishCopy(
		value.filename ?? `asset-${uri.getLastPathSegment()}`,
		mime,
		targetPath,
		() => {
			const stream = resolver().openInputStream(uri)
			if (!stream) {
				throw new Error('The source asset could not be opened')
			}
			return stream
		},
	)
}
async function publishCopy(
	filename: string,
	mime: string,
	targetPath: string | undefined,
	open: () => java.io.InputStream,
): Promise<string> {
	const kind = mime.startsWith('image/')
		? 'image'
		: mime.startsWith('video/')
			? 'video'
			: mime.startsWith('audio/')
				? 'audio'
				: null
	if (!kind) {
		throw new Error('Only images, videos and audio can be saved to the media library')
	}
	const collection =
		kind === 'image'
			? android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI
			: kind === 'video'
				? android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI
				: android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
	const values = valuesForPath(targetPath ?? (kind === 'audio' ? 'Music/' : 'Pictures/'))
	values.put('_display_name', filename)
	values.put('mime_type', mime)
	values.put('is_pending', java.lang.Integer.valueOf(1))
	const destination = resolver().insert(collection, values)
	if (!destination) {
		throw new Error('MediaStore did not create an asset')
	}
	try {
		const input = open()
		try {
			const output = resolver().openOutputStream(destination)
			if (!output) {
				throw new Error('MediaStore did not open the asset for writing')
			}
			try {
				const bytes = java.nio.ByteBuffer.allocate(65536).array()
				let count: number
				while ((count = input.read(bytes)) !== -1) {
					output.write(bytes, 0, count)
				}
			} finally {
				output.close()
			}
		} finally {
			input.close()
		}
		const finished = new android.content.ContentValues()
		finished.put('is_pending', java.lang.Integer.valueOf(0))
		if (resolver().update(destination, finished, null, null) < 1) {
			throw new Error('MediaStore could not publish the created asset')
		}
		return String(destination)
	} catch (error) {
		resolver().delete(destination, null, null)
		throw error
	}
}

export const backend: LibraryBackend = {
	isAvailable: available,
	permissions,
	async presentPermissionsPicker(types) {
		if (sdk() < 34) {
			throw new UnavailabilityError('MediaLibrary selected-access picker before Android 14')
		}
		const granular: GranularPermission[] = types ?? ['photo', 'video']
		if (permissionResponse(false, granular).accessPrivileges === 'limited') {
			await permissions(true, false, granular)
		}
	},
	async query(spec) {
		return query(spec)
	},
	async metadata(id) {
		return rowFor(id)
	},
	async uri(id) {
		rowFor(id)
		return id
	},
	releaseUri() {},
	async location() {
		throw new UnavailabilityError('MediaLibrary location metadata on Android')
	},
	async createAsset(file, target) {
		return create(file, target ? album(target).path : undefined)
	},
	deleteAssets: removeAssets,
	async setFavorite(id, favorite) {
		if (sdk() < 30) {
			throw new UnavailabilityError('MediaStore favorites before Android 11')
		}
		await writable([id])
		const values = new android.content.ContentValues()
		values.put('is_favorite', java.lang.Integer.valueOf(favorite ? 1 : 0))
		if (resolver().update(mediaUri(id), values, null, null) < 1) {
			throw new Error('Favorite update did not affect a row')
		}
	},
	async albums(options) {
		if (options.smart) {
			throw new UnavailabilityError('MediaLibrary smart albums on Android')
		}
		if (options.asset) {
			const cursor = cursorFor(mediaUri(options.asset))
			try {
				if (!cursor.moveToFirst()) {
					throw new Error('Asset is missing')
				}
				const id = nullableString(cursor, 'bucket_id')
				return id === null ? [] : [album(id)]
			} finally {
				cursor.close()
			}
		}
		return albums()
	},
	async album(id) {
		return album(id)
	},
	async albumCount(id) {
		return album(id).count
	},
	async createAlbum(title, ids, moveAssets) {
		if (!ids.length) {
			throw new Error('Android albums require at least one asset')
		}
		if (/[/\\]|^\.{1,2}$/.test(title)) {
			throw new TypeError('Album titles must be a single directory name')
		}
		const kinds = ids.map((id) =>
			id.startsWith('file://')
				? android.webkit.MimeTypeMap.getSingleton()
						.getMimeTypeFromExtension(
							android.net.Uri.parse(id).getLastPathSegment()?.split('.').pop()?.toLowerCase() ?? '',
						)
						?.split('/')[0]
				: rowFor(id).mediaType,
		)
		const audio = kinds.every((kind) => kind === 'audio')
		if (!audio && kinds.some((kind) => kind === 'audio')) {
			throw new Error('Android cannot combine audio and visual media in one album')
		}
		const target = `${audio ? 'Music' : 'Pictures'}/${title}/`
		const created: string[] = []
		for (const id of ids) {
			if (id.startsWith('file://')) {
				created.push(await create(id, target))
			} else if (moveAssets) {
				await move([id], target)
				created.push(id)
			} else {
				created.push(await copyAsset(id, target))
			}
		}
		const cursor = cursorFor(mediaUri(created[0]))
		try {
			if (!cursor.moveToFirst()) {
				throw new Error('Created album cannot be resolved')
			}
			const id = nullableString(cursor, 'bucket_id')
			if (id === null) {
				throw new Error('MediaStore returned no album identifier')
			}
			return id
		} finally {
			cursor.close()
		}
	},
	async deleteAlbums(ids) {
		const assets = new Set<string>()
		for (const id of ids) {
			album(id)
			for (const value of query({ filters: [], order: [], offset: 0, album: id })) {
				assets.add(value.id)
			}
		}
		await removeAssets([...assets])
	},
	async addAssets(id, ids) {
		await move(ids, album(id).path)
	},
	async removeAssets() {
		throw new UnavailabilityError(
			'Removing MediaStore album membership without moving or deleting the asset',
		)
	},
	subscribe(listener) {
		assertReadable()
		const Bridge = observerBridge()
		if (!Bridge) {
			throw new UnavailabilityError('MediaLibrary native change observer')
		}
		const callback = new Bridge.Listener({
			changed: () => listener({ hasIncrementalChanges: false }),
		})
		const observer = new Bridge(callback)
		observer.start(resolver())
		return {
			remove() {
				observer.stop()
			},
		}
	},
}

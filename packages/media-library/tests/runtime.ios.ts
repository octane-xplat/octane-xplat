import { File, knownFolders, path } from '@nativescript/core'
import {
	Asset,
	Album,
	Query,
	AssetField,
	MediaType,
	MediaLibrary,
	getPermissionsAsync,
	requestPermissionsAsync,
	releaseAssetUri,
	addListener,
} from '../src/index'

type Context = {
	assert(name: string, actual: unknown, expected?: unknown): void
	record(name: string, value: unknown): void
	waitFor<T>(
		predicate: () => T,
		options?: { timeout?: number; interval?: number },
	): Promise<NonNullable<T>>
	onCleanup(callback: () => unknown | Promise<unknown>): void
}
const fixture =
	'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAIAAAASFvFNAAAAHElEQVR4nGMQYWDQYGCwYWBgCGBgSGFgqGBgAAANrAGldwYwdgAAAABJRU5ErkJggg=='

export async function run(ctx: Context) {
	ctx.record('identifier', NSBundle.mainBundle.bundleIdentifier)
	ctx.assert('PhotoKit available', MediaLibrary.supported)
	const phaseFile = path.join(knownFolders.documents().path, 'media-library-test-phase.txt')
	const authorizedPhase =
		File.exists(phaseFile) && File.fromPath(phaseFile).readTextSync() === 'authorized'
	const nonce = NSUUID.UUID().UUIDString
	const stepFile = File.fromPath(
		path.join(knownFolders.documents().path, 'media-library-test-step.json'),
	)
	const mark = (step: string, count = 0) =>
		stepFile.writeTextSync(
			JSON.stringify({
				step,
				count,
				nonce,
				name: String(
					NSBundle.mainBundle.objectForInfoDictionaryKey('CFBundleDisplayName') ??
						NSBundle.mainBundle.bundleIdentifier,
				),
			}),
		)
	mark(authorizedPhase ? 'request-permission' : 'read-permission')
	const before = authorizedPhase ? await requestPermissionsAsync() : await getPermissionsAsync()
	ctx.record('permission', before.status)
	ctx.assert(
		'permission reads do not alter authorization',
		(await getPermissionsAsync()).status,
		before.status,
	)
	if (!before.granted) {
		ctx.assert('no-access scope', before.accessPrivileges, 'none')
		let rejected = false
		try {
			await new Query().limit(1).exe()
		} catch {
			rejected = true
		}
		ctx.assert('queries reject without authorization', rejected)
		ctx.record('phase', 'no-access')
		return
	}
	ctx.record('phase', 'assets')
	ctx.assert(
		'determined request returns current permission',
		(await requestPermissionsAsync()).status,
		before.status,
	)

	mark('running')
	const source = path.join(knownFolders.temp().path, `xplat-library-fixture-${nonce}.png`)
	const data = NSData.alloc().initWithBase64EncodedStringOptions(
		fixture,
		0 as NSDataBase64DecodingOptions,
	)
	ctx.assert('fixture written', data.writeToFileAtomically(source, true))
	const sourceUri = String(NSURL.fileURLWithPath(source).absoluteString)
	const assets = new Set<Asset>(),
		albums = new Set<Album>(),
		exports = new Set<string>()
	let changes = 0
	const subscription = addListener((event) => {
		if (!event.hasIncrementalChanges) {
			changes++
		}
	})
	ctx.onCleanup(async () => {
		subscription.remove()
		for (const uri of exports) {
			releaseAssetUri(uri)
		}
		if (albums.size) {
			mark('delete-albums', albums.size)
			await Album.delete([...albums])
		}
		if (assets.size) {
			mark('delete-assets', assets.size)
			await Asset.delete([...assets])
		}
		if (File.exists(source)) {
			File.fromPath(source).removeSync()
		}
	})
	const first = await Asset.create(sourceUri)
	assets.add(first)
	ctx.assert('asset uses a durable identifier', first.id.startsWith('ph://'))
	ctx.assert('asset physical width', await first.getWidth(), 3)
	ctx.assert('asset physical height', await first.getHeight(), 2)
	ctx.assert('source survives creation', File.exists(source))
	const album = await Album.create(`Xplat fixture ${nonce}`, [first])
	albums.add(album)
	ctx.assert('album count', await album.getAssetCount(), 1)
	ctx.assert('album lookup by title', (await Album.get(await album.getTitle()))?.id, album.id)
	const page = await new Query()
		.album(album)
		.eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
		.orderBy(AssetField.CREATION_TIME)
		.limit(1)
		.exe()
	ctx.assert('paged query returns requested asset', page[0]?.id, first.id)
	ctx.assert(
		'zero limit returns no assets',
		(await new Query().album(album).limit(0).exe()).length,
		0,
	)
	ctx.assert(
		'offset skips current page',
		(await new Query().album(album).offset(1).limit(1).exe()).length,
		0,
	)
	await first.setFavorite(true)
	ctx.assert('favorite metadata refresh', await first.getFavorite())
	ctx.assert(
		'favorite filter',
		(await new Query().album(album).eq(AssetField.IS_FAVORITE, true).exe())[0]?.id,
		first.id,
	)
	const exported = await first.getUri()
	exports.add(exported)
	const original = await first.getUri({ version: 'original' })
	exports.add(original)
	ctx.assert('exported current file exists', File.exists(decodeURIComponent(exported.slice(7))))
	ctx.assert('exported original file exists', File.exists(decodeURIComponent(original.slice(7))))
	releaseAssetUri(exported)
	releaseAssetUri(exported)
	exports.delete(exported)
	ctx.assert('temporary export cleanup', File.exists(decodeURIComponent(exported.slice(7))), false)
	const second = await Asset.create(sourceUri, album)
	assets.add(second)
	ctx.assert('created asset belongs to album', await album.getAssetCount(), 2)
	await album.removeAssets([second])
	ctx.assert('membership removal preserves asset', await second.getWidth(), 3)
	ctx.assert('membership removal changes album', await album.getAssetCount(), 1)
	await album.add(second)
	ctx.assert('membership addition', await album.getAssetCount(), 2)
	await ctx.waitFor(() => changes > 0, { timeout: 3000, interval: 20 })
	ctx.assert('change subscription observed native changes', changes > 0)
	subscription.remove()
	mark('delete-albums', 1)
	await album.delete()
	albums.delete(album)
	ctx.assert('album deletion preserves assets', await first.getWidth(), 3)
	ctx.record('beforeAssetDeletion', true)
	mark('delete-assets', assets.size)
	await Asset.delete([...assets])
	assets.clear()
	ctx.record('assetDeletion', true)
	let missing = false
	try {
		await first.getWidth()
	} catch {
		missing = true
	}
	ctx.assert('deleted asset handle rejects', missing)
	mark('done')
}

import { beforeEach, expect, it, vi } from 'vitest'
import type { AssetMetadata } from '../src/types'

const native = vi.hoisted(() => ({
	query: vi.fn(),
	metadata: vi.fn(),
	uri: vi.fn(),
	album: vi.fn(),
	albums: vi.fn(),
	permissions: vi.fn(),
	deleteAssets: vi.fn(),
	deleteAlbums: vi.fn(),
	createAsset: vi.fn(),
	createAlbum: vi.fn(),
	setFavorite: vi.fn(),
	albumCount: vi.fn(),
	subscribe: vi.fn(),
	isAvailable: () => true,
}))
vi.mock('../src/backend', () => ({ backend: native }))
import {
	Asset,
	Album,
	Query,
	addListener,
	removeAllListeners,
	getPermissionsAsync,
	requestPermissionsAsync,
} from '../src/core'
import { AssetField, MediaType } from '../src/types'

const metadata: AssetMetadata = {
	id: 'ph://owned',
	filename: 'test.png',
	mediaType: 'image',
	width: 3,
	height: 2,
	duration: null,
	creationTime: 12,
	modificationTime: 13,
	isFavorite: false,
}
beforeEach(() => {
	vi.clearAllMocks()
	native.metadata.mockResolvedValue(metadata)
	native.query.mockResolvedValue([metadata])
})

it('snapshots query parameters before execution and uses durable asset handles', async () => {
	const values: Array<'image' | 'video'> = [MediaType.IMAGE]
	const query = new Query()
		.within(AssetField.MEDIA_TYPE, values)
		.orderBy({ key: AssetField.CREATION_TIME, ascending: false })
		.limit(2)
		.offset(1)
	const pending = query.exe()
	values.push(MediaType.VIDEO)
	query.eq(AssetField.IS_FAVORITE, true).offset(20)
	const assets = await pending
	expect(assets[0]).toBeInstanceOf(Asset)
	expect(assets[0].id).toBe('ph://owned')
	const captured = native.query.mock.calls[0][0]
	expect(captured.filters).toEqual([{ field: 'mediaType', operator: 'within', value: ['image'] }])
	expect(captured.offset).toBe(1)
	expect(captured.order).toEqual([{ key: 'creationTime', ascending: false }])
})

it('validates queries and creation arguments before asking the OS', () => {
	expect(() => new Query().offset(-1)).toThrow()
	expect(() => new Query().limit(0.5)).toThrow()
	expect(() => new Query().gt(AssetField.MEDIA_TYPE, 5)).toThrow()
	expect(() => new Query().eq(AssetField.WIDTH, NaN)).toThrow()
	expect(() => new Query().orderBy({ key: 'injected' as never })).toThrow()
	expect(native.query).not.toHaveBeenCalled()
})

it('reads permission state separately from prompting and preserves limited scope', async () => {
	native.permissions.mockResolvedValue({
		status: 'granted',
		granted: true,
		canAskAgain: false,
		expires: 'never',
		accessPrivileges: 'limited',
	})
	expect((await getPermissionsAsync(false, ['photo'])).accessPrivileges).toBe('limited')
	await requestPermissionsAsync(true)
	expect(native.permissions.mock.calls).toEqual([
		[false, false, ['photo']],
		[true, true, undefined],
	])
})

it('rereads current metadata instead of freezing mutable library state', async () => {
	const asset = new Asset('ph://owned')
	expect(await asset.getFavorite()).toBe(false)
	native.metadata.mockResolvedValue({ ...metadata, isFavorite: true, width: null })
	expect(await asset.getFavorite()).toBe(true)
	await expect(asset.getWidth()).rejects.toThrow('unavailable')
	await expect(asset.getInfo()).rejects.toThrow('unavailable')
	expect(native.uri).not.toHaveBeenCalled()
})

it('keeps album and asset deletion separate and deduplicates identifiers', async () => {
	const asset = new Asset('ph://owned'),
		album = new Album('owned-album')
	await Asset.delete([asset, asset])
	await album.delete()
	await Album.delete([album], true)
	expect(native.deleteAssets).toHaveBeenCalledWith(['ph://owned'])
	expect(native.deleteAlbums.mock.calls).toEqual([
		[['owned-album'], false],
		[['owned-album'], true],
	])
})

it('stops already queued listener delivery and removes each native observer once', () => {
	const remove = vi.fn(),
		callback = vi.fn()
	let deliver!: (event: { hasIncrementalChanges: boolean }) => void
	native.subscribe.mockImplementation((listener) => {
		deliver = listener
		return { remove }
	})
	const subscription = addListener(callback)
	deliver({ hasIncrementalChanges: false })
	subscription.remove()
	subscription.remove()
	removeAllListeners()
	deliver({ hasIncrementalChanges: false })
	expect(callback).toHaveBeenCalledTimes(1)
	expect(remove).toHaveBeenCalledTimes(1)
})

it('copies native app paths with reserved characters without accepting network resources', async () => {
	native.createAsset.mockResolvedValue('ph://saved')
	await Asset.create('/app/cache/photo #1%.png')
	await Asset.create('file:///app/cache/already%20encoded.png')
	expect(native.createAsset.mock.calls).toEqual([
		['file:///app/cache/photo%20%231%25.png', undefined],
		['file:///app/cache/already%20encoded.png', undefined],
	])
	await expect(Asset.create('https://example.com/photo.png')).rejects.toThrow('local file')
	expect(native.createAsset).toHaveBeenCalledTimes(2)
})

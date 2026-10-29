import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { LibraryBackend, QuerySpec } from './backend-types'
import type { AppleHost, PhotoRuntime } from './photos-runtime-types'
import type { PHAsset, PHAssetCollection, PHFetchResult } from '@octane-xplat/platform/macos'
import type { AssetField, AssetMetadata, AlbumMetadata, PermissionResponse } from './types'

const keys: Record<AssetField, string> = {
	creationTime: 'creationDate',
	modificationTime: 'modificationDate',
	mediaType: 'mediaType',
	width: 'pixelWidth',
	height: 'pixelHeight',
	duration: 'duration',
	isFavorite: 'isFavorite',
}
const nativeMedia: Record<string, number> = { unknown: 0, image: 1, video: 2, audio: 3 }
const mediaNames = ['unknown', 'image', 'video', 'audio'] as const
const response = (status: number): PermissionResponse => ({
	status: status === 3 || status === 4 ? 'granted' : status === 0 ? 'undetermined' : 'denied',
	granted: status === 3 || status === 4,
	canAskAgain: status === 0 || status === 3 || status === 4,
	expires: 'never',
	accessPrivileges: status === 3 ? 'all' : status === 4 ? 'limited' : 'none',
})

/** The same PhotoKit engine serves UIKit and AppKit; the host owns presenters and observers. */
export function createPhotosBackend(host: AppleHost): LibraryBackend {
	const owned = new Set<string>()
	const prompts = new Map<number, Promise<PermissionResponse>>()
	const runtime = (): PhotoRuntime => {
		const value = host.runtime()
		if (!value) {
			throw new UnavailabilityError('MediaLibrary PhotoKit')
		}
		return value
	}
	const permission = (writeOnly = false) =>
		response(Number(runtime().PHPhotoLibrary.authorizationStatusForAccessLevel(writeOnly ? 1 : 2)))
	const read = () => {
		if (!permission().granted) {
			throw new Error('Photo library read permission is required')
		}
	}
	const write = () => {
		if (!permission(true).granted && !permission().granted) {
			throw new Error('Photo library write permission is required')
		}
	}
	const list = <T>(fetch: PHFetchResult): T[] =>
		Array.from({ length: fetch.count }, (_, index) => fetch.objectAtIndex(index) as T)
	const raw = (id: string) => id.replace(/^ph:\/\//, '')
	const asset = (id: string): PHAsset => {
		read()
		const value = runtime().PHAsset.fetchAssetsWithLocalIdentifiersOptions([raw(id)], null)
			.firstObject as PHAsset | null
		if (!value) {
			throw new Error('Asset is missing or outside the granted photo-library scope')
		}
		return value
	}
	const collection = (id: string): PHAssetCollection => {
		read()
		const value = runtime().PHAssetCollection.fetchAssetCollectionsWithLocalIdentifiersOptions(
			[id],
			null,
		).firstObject as PHAssetCollection | null
		if (!value) {
			throw new Error('Album is missing or outside the granted photo-library scope')
		}
		return value
	}
	const metadata = (value: PHAsset): AssetMetadata => {
		const resources = runtime().PHAssetResource.assetResourcesForAsset(value)
		const first = resources.count > 0 ? resources.objectAtIndex(0) : null
		return {
			id: `ph://${value.localIdentifier}`,
			filename: first ? String(first.originalFilename) : null,
			width: value.pixelWidth,
			height: value.pixelHeight,
			mediaType: mediaNames[Number(value.mediaType)] ?? 'unknown',
			duration:
				Number(value.mediaType) === 2 || Number(value.mediaType) === 3 ? value.duration : null,
			creationTime: value.creationDate ? Number(value.creationDate.timeIntervalSince1970) : null,
			modificationTime: value.modificationDate
				? Number(value.modificationDate.timeIntervalSince1970)
				: null,
			isFavorite: Boolean(value.favorite),
		}
	}
	const albumMetadata = (value: PHAssetCollection): AlbumMetadata => ({
		id: value.localIdentifier,
		title: value.localizedTitle ?? '',
		type: Number(value.assetCollectionType) === 2 ? 'smartAlbum' : 'album',
	})
	const changes = (action: () => void): Promise<void> =>
		new Promise((resolve, reject) => {
			let actionError: unknown
			runtime()
				.PHPhotoLibrary.sharedPhotoLibrary()
				.performChangesCompletionHandler(
					() => {
						try {
							action()
						} catch (error) {
							actionError = error
						}
					},
					(success, error) => {
						if (actionError) {
							reject(actionError)
						} else if (!success) {
							reject(new Error(error?.localizedDescription ?? 'Photo library rejected the change'))
						} else {
							resolve()
						}
					},
				)
		})
	const nativeArray = (values: PHAsset[] | PHAssetCollection[]) =>
		runtime().NSArray.arrayWithArray(values)
	const localSource = (uri: string) => {
		const kit = runtime(),
			url = kit.NSURL.URLWithString(uri)
		if (!url?.fileURL || !kit.NSFileManager.defaultManager.fileExistsAtPath(url.path)) {
			throw new Error('Asset source must be a readable local file')
		}
		return url
	}
	const createRequest = (url: ReturnType<typeof localSource>) => {
		const kit = runtime()
		return /\.(mov|mp4|m4v|avi)$/i.test(url.path)
			? kit.PHAssetChangeRequest.creationRequestForAssetFromVideoAtFileURL(url)
			: kit.PHAssetChangeRequest.creationRequestForAssetFromImageAtFileURL(url)
	}
	const create = async (uri: string, album?: string): Promise<string> => {
		write()
		const kit = runtime()
		const url = localSource(uri)
		const target = album ? collection(album) : undefined
		let id: string | undefined
		await changes(() => {
			const request = createRequest(url)
			const placeholder = request?.placeholderForCreatedAsset
			if (!placeholder) {
				throw new Error('PhotoKit could not create the asset')
			}
			id = placeholder.localIdentifier
			if (target) {
				kit.PHAssetCollectionChangeRequest.changeRequestForAssetCollection(target).addAssets(
					kit.NSArray.arrayWithArray([placeholder]),
				)
			}
		})
		if (!id) {
			throw new Error('PhotoKit returned no created asset identifier')
		}
		return `ph://${id}`
	}
	const temporary = (extension: string) => {
		const kit = runtime()
		const root = String(kit.NSFileManager.defaultManager.temporaryDirectory.path).replace(/\/$/, '')
		return kit.NSURL.fileURLWithPath(
			`${root}/xplat-library-${kit.NSUUID.UUID().UUIDString}.${extension}`,
		)
	}
	const remove = (uri: string) => {
		if (!owned.has(uri)) {
			return
		}
		const kit = runtime(),
			url = kit.NSURL.URLWithString(uri)
		if (
			url &&
			kit.NSFileManager.defaultManager.fileExistsAtPath(url.path) &&
			!kit.NSFileManager.defaultManager.removeItemAtPathError(url.path, null)
		) {
			throw new Error('Could not remove the temporary asset export')
		}
		owned.delete(uri)
	}
	const exported = async (
		extension: string,
		action: (target: ReturnType<typeof temporary>) => void | Promise<void>,
	): Promise<string> => {
		const target = temporary(extension.slice(0, 16)),
			uri = String(target.absoluteString)
		owned.add(uri)
		try {
			await action(target)
			return uri
		} catch (error) {
			try {
				remove(uri)
			} catch (cleanupError) {
				throw Object.assign(
					new Error('Asset export failed and its temporary file could not be removed'),
					{ cause: error, cleanupError },
				)
			}
			throw error
		}
	}

	return {
		isAvailable: () => host.runtime() !== null,
		async permissions(request, writeOnly) {
			const current = permission(writeOnly)
			if (!request || current.status !== 'undetermined') {
				return current
			}
			const kit = runtime(),
				level = writeOnly ? 1 : 2
			const key = writeOnly ? 'NSPhotoLibraryAddUsageDescription' : 'NSPhotoLibraryUsageDescription'
			if (!kit.NSBundle.mainBundle.objectForInfoDictionaryKey(key)) {
				throw new Error(`Declare ${key} before requesting Photos access`)
			}
			let pending = prompts.get(level)
			if (!pending) {
				pending = new Promise<PermissionResponse>((resolve) =>
					kit.PHPhotoLibrary.requestAuthorizationForAccessLevelHandler(level, (status) =>
						resolve(response(Number(status))),
					),
				)
				prompts.set(level, pending)
				void pending.finally(() => prompts.delete(level))
			}
			return pending
		},
		presentPermissionsPicker: () => host.permissionsPicker(),
		async query(spec: QuerySpec) {
			read()
			const kit = runtime(),
				target = spec.album ? collection(spec.album) : undefined
			if (spec.limit === 0) {
				return []
			}
			const options = kit.PHFetchOptions.alloc().init()
			const predicates = spec.filters.map((filter) => {
				const convert = (value: string | number | boolean) =>
					filter.field === 'mediaType'
						? nativeMedia[String(value)]
						: filter.field.endsWith('Time')
							? kit.NSDate.dateWithTimeIntervalSince1970(Number(value))
							: value
				const value = Array.isArray(filter.value)
					? filter.value.map(convert)
					: convert(filter.value as string | number | boolean)
				const operator = { eq: '==', within: 'IN', gt: '>', gte: '>=', lt: '<', lte: '<=' }[
					filter.operator
				]
				return kit.NSPredicate.predicateWithFormatArgumentArray(`%K ${operator} %@`, [
					keys[filter.field],
					value,
				])
			})
			options.predicate = kit.NSCompoundPredicate.andPredicateWithSubpredicates(predicates)
			const order = spec.order.length
				? spec.order
				: [{ key: 'creationTime' as const, ascending: false }]
			options.sortDescriptors = order.map((value) =>
				kit.NSSortDescriptor.sortDescriptorWithKeyAscending(
					keys[value.key],
					value.ascending ?? true,
				),
			)
			if (spec.limit !== undefined) {
				options.fetchLimit = spec.offset + spec.limit
			}
			const fetch = target
				? kit.PHAsset.fetchAssetsInAssetCollectionOptions(target, options)
				: kit.PHAsset.fetchAssetsWithOptions(options)
			const end = Math.min(
				fetch.count,
				spec.limit === undefined ? fetch.count : spec.offset + spec.limit,
			)
			const result: AssetMetadata[] = []
			for (let index = spec.offset; index < end; index++) {
				result.push(metadata(fetch.objectAtIndex(index) as PHAsset))
			}
			return result
		},
		async metadata(id) {
			return metadata(asset(id))
		},
		async location(id) {
			const location = asset(id).location
			return location
				? { latitude: location.coordinate.latitude, longitude: location.coordinate.longitude }
				: null
		},
		async uri(id, options) {
			const value = asset(id),
				kit = runtime()
			if (options.version === 'original') {
				const resources = kit.PHAssetResource.assetResourcesForAsset(value)
				const candidates = Array.from({ length: resources.count }, (_, index) =>
					resources.objectAtIndex(index),
				)
				const resource = candidates.find(
					(item) => Number(item.type) === (Number(value.mediaType) === 2 ? 2 : 1),
				)
				if (!resource) {
					throw new Error('The original asset resource is unavailable')
				}
				const extension =
					String(resource.originalFilename)
						.split('.')
						.pop()
						?.replace(/[^a-zA-Z0-9]/g, '') || 'bin'
				const request = kit.PHAssetResourceRequestOptions.alloc().init()
				request.networkAccessAllowed = true
				return exported(
					extension,
					(target) =>
						new Promise<void>((resolve, reject) =>
							kit.PHAssetResourceManager.defaultManager().writeDataForAssetResourceToFileOptionsCompletionHandler(
								resource,
								target,
								request,
								(error) => (error ? reject(new Error(error.localizedDescription)) : resolve()),
							),
						),
				)
			}
			if (Number(value.mediaType) === 1) {
				const request = kit.PHImageRequestOptions.alloc().init()
				request.networkAccessAllowed = true
				request.version = 0
				request.deliveryMode = 1
				return new Promise<string>((resolve, reject) => {
					kit.PHImageManager.defaultManager().requestImageDataAndOrientationForAssetOptionsResultHandler(
						value,
						request,
						(data, uti, _orientation, _info) => {
							if (!data) {
								reject(new Error('The current asset image could not be exported'))
								return
							}
							const extension =
								(
									{
										'public.jpeg': 'jpg',
										'public.png': 'png',
										'public.heic': 'heic',
										'public.tiff': 'tiff',
										'com.compuserve.gif': 'gif',
									} as Record<string, string>
								)[uti] ?? 'image'
							void exported(extension, (target) => {
								if (!data.writeToFileAtomically(target.path, true)) {
									throw new Error('Could not save the asset export')
								}
							}).then(resolve, reject)
						},
					)
				})
			}
			if (Number(value.mediaType) !== 2) {
				throw new UnavailabilityError('PhotoKit export for this media kind')
			}
			const request = kit.PHVideoRequestOptions.alloc().init()
			request.networkAccessAllowed = true
			request.version = 0
			return new Promise<string>((resolve, reject) => {
				kit.PHImageManager.defaultManager().requestExportSessionForVideoOptionsExportPresetResultHandler(
					value,
					request,
					'AVAssetExportPresetHighestQuality',
					(session, _info) => {
						if (!session) {
							reject(new Error('The current video could not be exported'))
							return
						}
						void exported(
							'mov',
							(target) =>
								new Promise<void>((finish, fail) => {
									session.outputURL = target
									session.outputFileType = 'com.apple.quicktime-movie'
									session.exportAsynchronouslyWithCompletionHandler(() => {
										if (Number(session.status) === 3) {
											finish()
										} else {
											fail(new Error(session.error?.localizedDescription ?? 'Video export failed'))
										}
									})
								}),
						).then(resolve, reject)
					},
				)
			})
		},
		releaseUri: remove,
		createAsset: create,
		async deleteAssets(ids) {
			write()
			if (ids.length) {
				await changes(() =>
					runtime().PHAssetChangeRequest.deleteAssets(nativeArray(ids.map(asset))),
				)
			}
		},
		async setFavorite(id, favorite) {
			write()
			const value = asset(id)
			await changes(() => {
				runtime().PHAssetChangeRequest.changeRequestForAsset(value).favorite = favorite
			})
		},
		async albums(options) {
			read()
			const kit = runtime(),
				type = options.smart ? 2 : 1
			const fetch = options.asset
				? kit.PHAssetCollection.fetchAssetCollectionsContainingAssetWithTypeOptions(
						asset(options.asset),
						type,
						null,
					)
				: kit.PHAssetCollection.fetchAssetCollectionsWithTypeSubtypeOptions(
						type,
						Number('9223372036854775807'),
						null,
					)
			return list<PHAssetCollection>(fetch).map(albumMetadata)
		},
		async album(id) {
			return albumMetadata(collection(id))
		},
		async albumCount(id) {
			return runtime().PHAsset.fetchAssetsInAssetCollectionOptions(collection(id), null).count
		},
		async createAlbum(title, ids) {
			write()
			const kit = runtime()
			const existing = ids.filter((id) => !id.startsWith('file://')).map(asset)
			const files = ids.filter((id) => id.startsWith('file://')).map(localSource)
			let id: string | undefined
			await changes(() => {
				const placeholders = files.map((url) => createRequest(url).placeholderForCreatedAsset)
				const request =
					kit.PHAssetCollectionChangeRequest.creationRequestForAssetCollectionWithTitle(title)
				id = request.placeholderForCreatedAssetCollection.localIdentifier
				if (existing.length || placeholders.length) {
					request.addAssets(kit.NSArray.arrayWithArray([...existing, ...placeholders]))
				}
			})
			if (!id) {
				throw new Error('PhotoKit returned no album identifier')
			}
			return id
		},
		async deleteAlbums(ids, deleteAssets) {
			write()
			const kit = runtime(),
				values = ids.map(collection)
			const assets = new Map<string, PHAsset>()
			if (deleteAssets) {
				for (const value of values) {
					for (const item of list<PHAsset>(
						kit.PHAsset.fetchAssetsInAssetCollectionOptions(value, null),
					)) {
						assets.set(item.localIdentifier, item)
					}
				}
			}
			if (values.length) {
				await changes(() => {
					if (assets.size) {
						kit.PHAssetChangeRequest.deleteAssets(nativeArray([...assets.values()]))
					}
					kit.PHAssetCollectionChangeRequest.deleteAssetCollections(nativeArray(values))
				})
			}
		},
		async addAssets(id, ids) {
			write()
			const value = collection(id),
				assets = ids.map(asset)
			if (assets.length) {
				await changes(() =>
					runtime()
						.PHAssetCollectionChangeRequest.changeRequestForAssetCollection(value)
						.addAssets(nativeArray(assets)),
				)
			}
		},
		async removeAssets(id, ids) {
			write()
			const value = collection(id),
				assets = ids.map(asset)
			if (assets.length) {
				await changes(() =>
					runtime()
						.PHAssetCollectionChangeRequest.changeRequestForAssetCollection(value)
						.removeAssets(nativeArray(assets)),
				)
			}
		},
		subscribe(listener) {
			read()
			const observer = host.observer(() => listener({ hasIncrementalChanges: false }))
			let active = true
			return {
				remove() {
					if (!active) {
						return
					}
					active = false
					observer.release()
				},
			}
		},
	}
}

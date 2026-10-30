# Browse the device's media library

Use `@octane-xplat/media-library` to list device photos and videos, save app
images, and manage albums. It follows Expo's modern `Asset`, `Album`, and `Query`
API with an Octane permission hook. Use [`media`](../media/README.md) when you
only need the system picker or camera.

```sh
bun add @octane-xplat/media-library
```

Start in an existing Xplat app. Add the iOS purpose strings below before asking
for access. Restart with your app's normal native build command after installing;
a JavaScript refresh cannot install the Android observer.

## Show a page of photos

Put this component in a `.tsx` file inside your renderer include glob. Press
**Show photos** to request permission and show up to twenty filenames. Listing
metadata avoids downloading each photo from iCloud or creating preview files.
The browser and unsupported desktop hosts show an availability message.

```tsx
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import {
	AssetField,
	MediaLibrary,
	MediaType,
	Query,
	usePermissions,
} from '@octane-xplat/media-library'
import type { AssetMetadata } from '@octane-xplat/media-library'

export function PhotoLibrary() {
	const [permission, requestPermission] = usePermissions({
		granularPermissions: ['photo', 'video'],
	})
	const [rows, setRows] = useState<AssetMetadata[]>([])
	const [status, setStatus] = useState('Choose Show photos to begin')
	async function load() {
		if (!MediaLibrary.supported) {
			setStatus('This host cannot browse the device library')
			return
		}
		try {
			const access = await requestPermission()
			if (!access.granted) {
				setStatus('Photo access was not granted')
				return
			}
			const photos = await new Query()
				.eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
				.orderBy({ key: AssetField.CREATION_TIME, ascending: false })
				.limit(20)
				.exeForMetadata()
			setRows(photos)
			setStatus(photos.length ? 'Your available photos' : 'No photos are available in this scope')
		} catch {
			setStatus('Could not read the photo library')
		}
	}
	return (
		<VStack>
			<Button
				label="Show photos"
				clickAction={() => {
					void load()
				}}
			/>
			<Text>{status}</Text>
			{permission?.accessPrivileges === 'limited' && (
				<Text>Only selected photos are available</Text>
			)}
			{rows.map((row) => (
				<Text key={row.id}>{row.filename ?? 'Untitled media'}</Text>
			))}
		</VStack>
	)
}
```

## Configure permission and limited access

On iOS, add these entries to your app's `App_Resources/iOS/Info.plist`. Use
wording that explains your app's actual feature. The read/write key allows
browsing; the add-only key supports saving without reading the library.

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Choose library photos for your project.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save project images to your photo library.</string>
```

Android permission declarations ship with the package. Android 13+ supports
separate `photo`, `video`, and `audio` permission requests; the default requests
all three. Apps offering only attachment selection should use the system picker
instead of requesting broad library access. `writeOnly: true` does not grant
read access. Permission reads never prompt; requests belong in an app action.

```ts
import { getPermissionsAsync, requestPermissionsAsync } from '@octane-xplat/media-library'

export async function savePermission() {
	const current = await getPermissionsAsync(true)
	return current.granted ? current : requestPermissionsAsync(true)
}
```

A limited grant is still `granted`, with `accessPrivileges: 'limited'`. Queries
see only the assets allowed by the OS. On iOS and Android 14+, offer the limited
selection picker from a button when the user wants to change that selection.
A full grant makes this method a no-op; older Android and AppKit reject it.

```ts
import { getPermissionsAsync, presentPermissionsPicker } from '@octane-xplat/media-library'

export async function changeSelectedPhotos() {
	const current = await getPermissionsAsync(false, ['photo', 'video'])
	if (current.accessPrivileges === 'limited') await presentPermissionsPicker(['photo', 'video'])
}
```

The hook reads on mount without prompting by default. Its three values are the
current response, a request callback, and a read callback. Refresh after returning
from system settings. Results from an older options set or an unmounted owner do
not update the current component. Explicit callback calls still return or reject
their promises.

```tsx
import { Button } from '@octane-xplat/ui'
import { usePermissions } from '@octane-xplat/media-library'

export function RefreshLibraryAccess() {
	const [permission, , refresh] = usePermissions({ granularPermissions: ['photo'] })
	return (
		<Button
			label={permission?.granted ? 'Refresh photo access' : 'Check photo access'}
			clickAction={() => {
				void refresh().catch(() => console.error('Could not check photo access'))
			}}
		/>
	)
}
```

## Page through assets and albums

`Query` is a mutable builder. `exe()` returns durable `Asset` handles;
`exeForMetadata()` returns metadata without exporting image/video files.
Use an explicit order for paging. Concurrent library changes can shift offsets,
so refresh from the first page after a change event. Modern Expo timestamps and
durations use seconds; convert timestamps to milliseconds for JavaScript dates.

```ts
import { AssetField, MediaType, Query } from '@octane-xplat/media-library'

export function photoPage(offset: number) {
	return new Query()
		.eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
		.orderBy({ key: AssetField.CREATION_TIME, ascending: false })
		.limit(20)
		.offset(offset)
		.exeForMetadata()
}

export function recentPhotos() {
	return new Query()
		.gt(AssetField.CREATION_TIME, Date.now() / 1000 - 7 * 24 * 60 * 60)
		.limit(20)
		.exe()
}
```

An ID identifies a library record, not an app file. You can reconstruct a handle
later; getters read current OS state and reject if the asset was deleted or is
outside the current grant. Metadata dimensions can be `null` on Android; numeric
width/height getters reject when the store has no dimensions.

```ts
import { Asset, Album, Query } from '@octane-xplat/media-library'

export async function pageInSavedAlbum(albumId: string) {
	const album = new Album(albumId)
	const assets = await new Query().album(album).limit(20).exe()
	return { count: await album.getAssetCount(), assets }
}

export async function describeSavedPhoto(assetId: string) {
	const asset = new Asset(assetId)
	return { filename: await asset.getFilename(), shape: await asset.getShape() }
}
```

## Save an app image and edit an album

`Asset.create` copies a local file into the library and leaves the input file
intact. It accepts `file://` URIs and absolute app paths such as those returned by
`media` or `files`. An album title is a display name, not a unique identifier.
Keep the returned IDs when you need to reopen the exact records.

```ts
import { Asset, Album } from '@octane-xplat/media-library'

export async function saveProjectImage(localImage: string) {
	const asset = await Asset.create(localImage)
	const album = await Album.create('Project images', [asset])
	return { asset, album }
}
```

On Apple platforms, an asset can belong to multiple albums, and removing album
membership preserves the asset. Android stores assets in directory-based albums;
adding an existing asset moves it. Create an Android album with `moveAssets:
false` to copy existing assets instead. Android requires at least one initial
asset and cannot combine audio and visual media in the same album.

```ts
import { Album } from '@octane-xplat/media-library'
import type { Asset } from '@octane-xplat/media-library'

export async function copyIntoAlbum(assets: Asset[]) {
	return Album.create('Project copies', assets, false)
}

// Apple-specific .ios.ts or .macos.ts action:
export async function removeFromAlbum(album: Album, assets: Asset[]) {
	await album.removeAssets(assets)
}
```

Deleting an Apple album preserves its assets unless you pass `deleteAssets:
true`. Android album deletion deletes its assets too. OS confirmation may be
required, and cancellation rejects; do not remove the records from your app's
state before the promise succeeds. Batch operations on Android can partially
complete if a later provider operation fails; reload after an error.

```ts
import { Asset, Album } from '@octane-xplat/media-library'

export async function deleteSelectedAssets(selected: Asset[]) {
	await Asset.delete(selected)
}

export async function deleteSelectedAlbums(selected: Album[]) {
	await Album.delete(selected)
}
```

## Own exported files and change listeners

On Apple platforms, `getUri()` exports the current image/video to an app-temporary
file; it can download an iCloud asset. `{ version: 'original' }` exports its
original resource. Android returns the library's `content://` URI and ignores
the version option. Call `releaseAssetUri` after the consumer finishes; it
removes only Apple exports owned by this package, and never deletes an OS asset.

```ts
import { releaseAssetUri } from '@octane-xplat/media-library'
import type { Asset } from '@octane-xplat/media-library'

export async function withAssetUri<T>(asset: Asset, consume: (uri: string) => Promise<T>) {
	const uri = await asset.getUri()
	try {
		return await consume(uri)
	} finally {
		releaseAssetUri(uri)
	}
}
```

For a portable still-image upload file, install image-manipulator too and copy
the maintained [imageAttachment helper](examples/image-attachment.ts) into your
app. It bounds working pixels, exports a JPEG, and releases the library export.
The caller owns the returned image result until preview/upload finishes.

```sh
bun add @octane-xplat/image-manipulator
```

```ts
import { imageAttachment } from './image-attachment'
import { releaseImage } from '@octane-xplat/image-manipulator'
import type { Asset } from '@octane-xplat/media-library'

export async function attachPhoto(asset: Asset, upload: (uri: string) => Promise<void>) {
	const result = await imageAttachment(asset)
	try {
		await upload(result.uri)
	} finally {
		releaseImage(result)
	}
}
```

After read access is granted, subscribe while your screen owns the list, then
remove the subscription. This
version emits `hasIncrementalChanges: false`; reload the current query instead
of trying to patch inserted/deleted ID arrays. Queued callbacks stop after
removal. `removeAllListeners()` affects every consumer of this module, so prefer
removing your own subscription.

```tsx
import { useEffect } from 'octane'
import { addListener } from '@octane-xplat/media-library'

export function LibraryChanges({ reload }: { reload: () => void }) {
	useEffect(() => {
		const subscription = addListener(() => reload())
		return () => subscription.remove()
	}, [reload])
	return null
}
```

## Platform scope

| Host                              | Contract and limits                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS                               | PhotoKit assets/albums, permissions, queries and exports. Real still-image and album lifecycle tested on iOS 26.2. Video/cloud exports and limited-picker UI have not been runtime qualified.                                                                                                                                                         |
| Android                           | Android 10+ MediaStore; Java observer requires a native rebuild. Permission requests, scoped storage and OS confirmation are implemented. Runtime and release qualification remain unverified. Favorites/filtering by favorite require Android 11+. Location metadata, smart albums, and removing membership without moving/deleting are unavailable. |
| macOS AppKit                      | Experimental PhotoKit backend using the system Photos library. Nonprompting reads, setup guards and observer lifecycle have runtime evidence; authorized data operations and packaged-consumer behavior remain unverified.                                                                                                                            |
| Web / native GTK / native Windows | Availability is false. No device-library backend is wired. Use media's picker for file selection; it does not provide a general OS media library.                                                                                                                                                                                                     |

AppKit apps need an existing system Photos library, purpose strings in the
packaged app, and the Photos Library entitlement when sandboxed. Configure the
purpose strings through the existing macOS package settings; merge the entitlement
into your app's entitlements file rather than replacing its other entries.

```json
{
	"xplat": {
		"targets": {
			"macos": {
				"package": {
					"infoPlist": {
						"NSPhotoLibraryUsageDescription": "Choose photos for your project.",
						"NSPhotoLibraryAddUsageDescription": "Save project images to Photos."
					}
				}
			}
		}
	}
}
```

```xml
<key>com.apple.security.personal-information.photos-library</key>
<true/>
```

The supported subset includes the constructors/getters shown here, numeric and
media-type filters (`eq`, `within`, `gt`, `gte`, `lt`, `lte`), paging, ordering,
album membership and deletion, favorites, permissions, and reload notifications.
EXIF maps, media subtypes, Live Photo helpers, and deprecated Expo functions are
not exported. Native enumeration and file copying run on the calling JavaScript
thread, so bound page sizes and avoid bulk work during interaction.

```ts
import { AssetField, Query } from '@octane-xplat/media-library'

export function favoritePage() {
	return new Query().eq(AssetField.IS_FAVORITE, true).limit(20).exeForMetadata()
}
```

[Verification and remaining platform gaps](../../.agents/docs/notes/media-library.md)
are separate from source/type checks. API reference inspiration:
[Expo MediaLibrary](https://docs.expo.dev/versions/latest/sdk/media-library/).

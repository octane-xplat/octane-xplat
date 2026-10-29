### Browse device photos and manage albums

The new media-library package provides Expo-shaped `Asset`, `Album`, and `Query`
APIs plus an Octane permission hook. Build a custom gallery, save an app image,
or edit an album. iOS has lifecycle test coverage; Android runtime and authorized
AppKit data workflows remain unverified. Browser hosts report unavailable.

```ts
import { MediaLibrary, Query, requestPermissionsAsync } from '@octane-xplat/media-library'

export async function libraryPage() {
	if (!MediaLibrary.supported) return []
	const permission = await requestPermissionsAsync(false, ['photo'])
	return permission.granted ? new Query().limit(20).exeForMetadata() : []
}
```

[Media-library setup, ownership and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/media-library/README.md)

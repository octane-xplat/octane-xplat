### Tracking transparency needs no native rebuild on iOS

`@octane-xplat/tracking-transparency` no longer ships an iOS Swift
bridge. The iOS backend calls `ATTrackingManager` and `ASIdentifierManager`
directly from TypeScript through NativeScript, so installing or updating
the package works with a JavaScript-only refresh — no plugin rebuild is
needed on iOS. Android still ships its Java bridge and still requires a
rebuild.

The permission guards, single-request serialization and identifier
behavior are unchanged.

See [`@octane-xplat/tracking-transparency`](https://octane-xplat.goddardai.org/package-tracking-transparency).

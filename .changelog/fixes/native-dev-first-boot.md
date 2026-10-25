---
release: lockstep
---

### Start native dev sessions from a clean cache

The first development launch after clearing the dev-server cache could stop
before the app appeared. A native plugin failed with
`Class extends value undefined`, or the first screen stayed blank with
`<svgview> is not a registered element`. Plugin files now load in dependency
order, and each package runs only once, so the first launch boots like later
ones. Verified on an Android emulator.

[Run on iOS and Android](https://octane-xplat.dev/start/toolchain/#run-on-ios-and-android)

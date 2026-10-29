### Run native macOS apps on Intel Macs

`xplat build --targets macos` now produces a universal app that runs on both
Apple Silicon and Intel Macs running macOS 13.5 or later. The output moved to
`artifacts/macos-universal/<Name>.app` and `<Name>-macos-universal.dmg`.
Apps without native leaves can also be packaged on an Intel Mac. Apps with
native leaves still need an Apple Silicon build Mac, and each prebuilt
`.dylib` a package ships must contain both `arm64` and `x86_64` slices:

```sh
lipo -create libengine-arm64.dylib libengine-x86_64.dylib \
	-output platforms/macos/prebuilt/libengine.dylib
```

See [Experimental AppKit target](https://octane-xplat.goddardai.org/start/toolchain#experimental-appkit-target).

### Ship a prebuilt dynamic library in a macOS leaf

A macOS package can now ship an already-compiled dynamic library instead of
native sources. Declare `prebuiltLibraries` (and optionally a `notices`
license file) in `xplat.macos` — `xplat dev` loads the library before app
code and `xplat build` copies it into `Contents/Frameworks` and signs it
with the app. A prebuilt-only leaf needs no compilation toolchain.

```json
{
	"xplat": {
		"macos": {
			"prebuiltLibraries": ["platforms/macos/prebuilt/libengine.dylib"],
			"notices": "platforms/macos/licenses/engine.txt"
		}
	}
}
```

[macOS native packages documentation](https://octane-xplat.goddardai.org/macos-native)

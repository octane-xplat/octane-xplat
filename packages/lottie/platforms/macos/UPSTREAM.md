Airbnb Lottie source vendored for the AppKit adapter.

- Repository: https://github.com/airbnb/lottie-ios
- Tag: 4.6.1
- Commit: f4db77d7feacba0c2360b84a40c38a6ce8ff399d
- License: Apache-2.0 (`LICENSE-Lottie-Apache-2.0.txt`)
- `Sources/` is copied without local source edits. AppKit exclusions are upstream conditional compilation.
- Embedded source notices are in `src/vendor/Lottie/Private/EmbeddedLibraries/*/README.md`.

To update this copy, fetch the intended release, record its tag and commit,
replace the source tree and license/privacy files, then rebuild and rerun the
AppKit fixture and package notice checks. Do not replace this source with the
iOS/Android NativeScript plugin.

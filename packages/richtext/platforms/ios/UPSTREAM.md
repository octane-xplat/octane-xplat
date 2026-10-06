AztecEditor-iOS supplies the `Aztec.TextView` engine behind the iOS leaf.

- Repository: https://github.com/wordpress-mobile/AztecEditor-iOS
- Branch: develop
- Commit: 44aeac606a3cff6d6ecb1d49ea3f9068082567e1 (podspec version 1.20.0)
- License: MPL-2.0 (`LICENSE-Aztec-MPL-2.0.txt`)
- Integrated as a remote Swift Package via the plugin-level
  `nativescript.config.ts` `ios.SPMPackages` entry (revision pin). Source is
  not vendored; `src/XplatAztecEditor.swift` is our facade, not upstream
  code.

To move the pin, update `version` in `../../nativescript.config.ts` to the
new commit's `#<sha>` revision form, record the new commit and podspec
version here, then rebuild the mobile app and rerun the iOS leaf probe.

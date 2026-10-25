### Packaged macOS apps lay out Mason content

Packaged macOS apps previously rendered `masonview` content empty: the Mason
layout engine library was not part of the published
`@octane-xplat/macos-renderer` package and never reached the app bundle.
The package now ships the engine prebuilt and `xplat build` copies it into
`Contents/Frameworks`, so packaged apps lay out without any extra setup.

[macOS native packages documentation](https://octane-xplat.goddardai.org/macos-native)

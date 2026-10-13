# Third-Party Notices

`@octane-xplat/nano-icons` ports and adapts the font pipeline from
[react-native-nano-icons](https://github.com/software-mansion-labs/react-native-nano-icons)
(commit `3ffd367068fc7566b10cced3ea101c16b16acbe6`), © 2026 Software Mansion —
MIT License. The React Native host-view, Expo/Metro plugin, and worker layer are
not ported; `src/build/core` carries the pipeline and `src/glyphmap.ts`,
`src/set.ts` carry the runtime model adapted from it.

Upstream third-party notices are kept for the ported `flatten/` tree, which is
itself a TypeScript port of picosvg (© 2020 Google LLC, Apache-2.0):

- picosvg — Apache-2.0 — https://github.com/googlefonts/picosvg
  (attribution for `src/build/core/flatten/`)
- PathKit / pathkit-wasm — BSD-3-Clause — https://github.com/googlefonts/PathKit
  (ported `src/build/core/pathkit/*` wrappers; `pathkit-wasm` is also a runtime
  dependency of the build pipeline)

Build-time dependencies (`@octane-xplat/nano-icons/build`):

- `pathkit-wasm` — BSD-3-Clause — https://www.npmjs.com/package/pathkit-wasm
- `svg2ttf` — MIT — https://www.npmjs.com/package/svg2ttf
- `fonteditor-core` — MIT — https://github.com/kekee000/fonteditor-core
- `cubic2quad` — MIT — https://www.npmjs.com/package/cubic2quad
- `@xmldom/xmldom` — MIT — https://github.com/xmldom/xmldom

Full license texts:

- MIT License: https://opensource.org/licenses/MIT
- BSD 3-Clause License: https://opensource.org/licenses/BSD-3-Clause
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0

### Filter macOS attachments with native file types

Experimental AppKit pickers now use OS image, audio, video and text groups, plus
registered MIME types. FileInput also asks the OS for filename MIME hints so
formats outside the built-in table can reach validation.

**Breaking change — AppKit:** unresolved or malformed restrictions now raise
`UnsupportedFileTypeError` before opening a panel. Previously, unknown MIME
entries could silently leave the picker unrestricted. Use explicit extensions
for unregistered formats; `*/*` explicitly allows any file.

```ts
// FileActions.macos.ts
import { files } from '@octane-xplat/files'
export async function chooseAttachments() {
  return files.pickMultiple('image/*,.pdf')
}
export async function chooseCustomFormat() {
  return files.pick('.mydoc')
}
```

These are selection and filename hints, not content verification. Native bridge,
OS panel and installed-app qualification remain pending. See
[AppKit file filters](https://github.com/octane-xplat/octane-xplat/blob/main/packages/files/README.md#appkit-file-type-filters).

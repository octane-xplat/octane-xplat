# NativeScript Core macOS provider

The Core platform implementations incorporate MIT-licensed NativeScript source
from Core and [the NativeScript macOS port](https://github.com/NativeScript/NativeScript/pull/11089)
at revision `76e397555f6f05c09c8166b24104ff726e2e5f47`.
The adjacent license covers the upstream code. The Mason adapter builds on the
package's existing AppKit implementation and uses its bundled Mason library.

These JavaScript modules implement the runtime contract of the patched
NativeScript Core 9.1.3. NativeScript supplies the public declarations.

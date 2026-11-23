### Keep the current screen intact when a native render is invalid

On iOS and Android, an unregistered native element or invalid parent could leave a screen partly updated and cause the next valid render to fail. The renderer now rejects these changes before applying them.

[NativeScript renderer documentation](https://octane-xplat.goddardai.org/packages/package-nativescript-octane)

### Recover cleanly from failed view updates on iOS and Android

Invalid batches of view updates now fail before changing the screen. If an unexpected native error interrupts an update and the renderer retries, it removes views left by the failed attempt. Destroyed views also disappear even if the update omitted a separate remove operation.

[NativeScript renderer](https://octane-xplat.goddardai.org/package-nativescript-octane)

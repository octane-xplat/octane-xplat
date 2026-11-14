### iOS text changes resize their container

On iOS, changing `Text` content now requests a fresh native measurement. An auto-height container can grow for a wrapping paragraph and shrink again for shorter text while retaining the same text host. See [container layouts](https://octane-xplat.goddardai.org/primitives#predictable-container-defaults).

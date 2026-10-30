### Keep the macOS host SDK out of web starters

The camera package no longer causes web, iOS, and Android apps to install the
macOS host SDK through a mandatory peer dependency. macOS apps still declare
their host SDK explicitly.

[Camera setup](https://github.com/octane-xplat/octane-xplat/blob/main/packages/camera/README.md)

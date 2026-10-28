### Readable `htmlview` text in light and dark macOS windows

On macOS, an unstyled `htmlview` now picks its default text color from the appearance of its own window or view. Before, it used the app's appearance, so a light window in a dark-mode app showed white text on a light background. A text color with no RGB equivalent now falls back to AppKit's default instead of throwing an error.

[macOS renderer](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#readme)

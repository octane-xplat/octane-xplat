# Sharing files across platforms

> Put the common implementation in one file and name platform differences so
> the build can select them automatically.

## The suffix pattern

```text
Card.tsrx          shared implementation
Card.web.tsrx      browser implementation
Card.native.tsrx   iOS and Android implementation
Card.ios.tsrx      iOS-only implementation
Card.android.tsrx  Android-only implementation
```

Import `Card` without writing a platform condition. The web build chooses the
web file; the native build chooses the most specific native file available.
*Verified — every app build exercises this chain on both targets.*

## What belongs in each file

- Shared files contain product behavior and shared components.
- Web files can use DOM details.
- Native files can use NativeScript details.
- Platform services keep device APIs out of screens.

Keep the public props and return values compatible across the files. A caller
should not need to know which leaf was selected.

## A good split

```text
ShareButton.tsrx        label, disabled state, shared callback
ShareButton.web.tsrx    browser share API
ShareButton.native.tsrx native share sheet
```

For resolver order, TypeScript configuration, and the rules that prevent a
platform detail from leaking into shared code, see the
[module-resolution notes](module-resolution-notes.md).

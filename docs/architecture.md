# How an xplat app fits together

> Keep product code shared, and put platform-specific work at the edges.

## The three layers

An app normally has these layers:

```text
screens and features
        ↓
shared UI components and services
        ↓
web or native platform leaves
```

Your screens should talk to `@octane-xplat/ui` and
`@octane-xplat/platform`. They should not talk directly to a DOM element or a
NativeScript view.

## Shared code and platform code

Keep a component shared when the user experience is the same on every target.
Split it when the platform needs a different implementation:

```text
ShareButton.tsrx          shared behavior and props
ShareButton.web.tsrx      browser implementation
ShareButton.native.tsrx   iOS and Android implementation
```

The filename tells the build which implementation to use. The screen that
imports `ShareButton` does not need an `if (ios)` branch.

## What belongs in a screen

Screens own product decisions: what to show, what to save, and where to go
next. They can use shared state, UI components, and platform service
interfaces.

They should not contain:

- DOM globals such as `window` or `document`.
- Native view names such as `gridlayout` or `page`.
- Two copies of the same platform decision.

If a screen needs one of those things, put the platform detail behind a shared
component or service instead.

For the compiler boundaries, file rules, and the full layer map, see the
[architecture notes](architecture-notes.md).

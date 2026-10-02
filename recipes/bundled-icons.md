# Render bundled icons across web, mobile, and AppKit

ID: bundled-icons
Targets: web, ios, android, macos
Related APIs: @octane-xplat/icons, Icon, addCollection, resolveIcon, iconToSvg, @iconify-json/*

## Starting point

An Octane-xplat app already configured with UI. The app owns its icon data and
needs the same icon names and component props on web, iOS, Android, and experimental AppKit macOS.

## Requirements

Choose and bundle one or more sets, register them, render namespaced icons, and
understand missing names, updates, accessibility, tint, and native SVG limits.

## Acceptance criteria

- AC1: Install and register app-owned collections without a default set or runtime icon API/network request; choose heroicons when Astryx parity is desired and retain each set's required license notices.
- AC2: Render `prefix:name` with the same props across targets, preserving collection dimensions, aliases/transforms, monochrome tint, and explicit multicolor fills.
- AC3: Identify a missing/invalid name without fetching; register or replace a collection and update already mounted icons.
- AC4: Size non-square icons, supply an accessible label or mark the icon decorative, and understand native default color and SVG-engine limits.

## Documentation

- AC1: [Install and register](../packages/icons/README.md#install-and-register), [licenses](../packages/icons/README.md#licenses), and [app-owned probe data](../examples/probes/icons-data.ts).
- AC2: [Rendering and updates](../packages/icons/README.md#rendering-and-updates), [maintained web/mobile probe](../examples/probes/icons.tsrx), and [AppKit probe](../examples/probes/icons.macos.tsrx).
- AC3: [Rendering and updates](../packages/icons/README.md#rendering-and-updates), [maintained web/mobile probe](../examples/probes/icons.tsrx), and [AppKit probe](../examples/probes/icons.macos.tsrx).
- AC4: [Rendering and updates](../packages/icons/README.md#rendering-and-updates) and [verification boundaries](../packages/icons/README.md#verification-and-example).

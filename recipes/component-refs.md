# Access and compose component refs

ID: component-refs
Targets: web, ios, android, macos
Related APIs: ref, useRef, useImperativeHandle, View, Pressable, TextInputHandle, CalendarHandle, WebViewHandle, useMeasure, useAnimation, useIntersectionObserver, rootRef, useDraggable, useDroppable

## Starting point

An Octane Xplat app with a mounted component and an event or effect that needs
its host or documented imperative handle.

## Requirements

Use normal Octane refs to access hosts and control handles, compose attachment
hooks, and release ref ownership correctly. Migrate existing Xplat bind usage.

## Acceptance criteria

- AC1: A developer can attach callback, object, and nested array refs to a shared host primitive or documented control handle, and distinguish portable handle methods from platform-specific host APIs.
- AC2: Ref replacement and unmount detach the previous owner, clear object refs, and invoke callback cleanup or null delivery.
- AC3: Host attachment hooks compose through the same ref prop, and existing bind/bindRoot call sites can be migrated without another attachment convention.

## Documentation

- AC1: [Refs](../docs/app/primitives.md#refs), [focus handles](../docs/app/text-entry.md#release-and-restore-focus), and maintained [web ref fixture](../packages/ui/src/refs.web.test.tsrx).
- AC2: [Ref lifecycle](../docs/app/primitives.md#refs), maintained [web ref tests](../packages/ui/src/refs.web.test.tsrx), and [universal ref tests](../packages/ui/src/refs.mobile.test.tsrx).
- AC3: [Refs](../docs/app/primitives.md#refs), [migration](../docs/app/primitives.md#migrate-from-bind), [intersection example](../examples/probes/intersection-observer.tsrx), and [drag and drop composition](../packages/dnd-kit/README.md#compose-drag-and-drop).

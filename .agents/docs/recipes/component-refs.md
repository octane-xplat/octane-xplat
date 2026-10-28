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

- AC4: AppKit date-family controls deliver existing TextInputHandle refs through normal object/callback/list replacement and teardown ownership. Focus resolves the current attached/visible/enabled/unblocked primary host; blur preserves unrelated responders and handles current owned field editors, including the date-time secondary segment. Keep source/object-driver evidence distinct from native ref/responder/editor/IME/popup/AX qualification and autofocus timing.

## Documentation

- AC1: [AppKit logical TabView item refs](../notes/appkit-native-intrinsics.md#tabview-host-and-minimal-logical-items), maintained [TabView fixture](../../../packages/macos-renderer/test/fixtures/Tab.macos.tsx), and [Refs](../../../docs/app/primitives.md#refs), [focus handles](../../../docs/app/text-entry.md#release-and-restore-focus), and maintained [web ref fixture](../../../packages/ui/src/refs.web.test.tsrx).
- AC2: [TabView content-root lifecycle](../../../packages/macos-renderer/test/fixtures/tab-lifecycle.ts), [Ref lifecycle](../../../docs/app/primitives.md#refs), maintained [web ref tests](../../../packages/ui/src/refs.web.test.tsrx), and [universal ref tests](../../../packages/ui/src/refs.mobile.test.tsrx).
- AC3: [Refs](../../../docs/app/primitives.md#refs), [migration](../../../docs/app/primitives.md#migrate-from-bind), [intersection example](../../../examples/probes/intersection-observer.tsrx), and [drag and drop composition](../../../packages/dnd-kit/README.md#compose-drag-and-drop).

The [AppKit text fixture](../../../apps/macos/test/text-controls-fixture.macos.tsx)
checks TextInput/TextArea object handles, native focus/blur, stable native identity
when secure mode changes, and ref clearing on unmount. Other ref forms and
replacement are covered by the shared ref suites above.

- AC4: [AppKit date focus guide](../../../docs/platform/date-picker.md#focus-an-appkit-date-field-from-a-form-action), private date-field-handle adapter, three policy/six object-driver cases, [maintained fixture](../../../examples/probes/date-focus.macos.tsrx), skill reference and [target note](../parity/appkit-progress.md#appkit-date-family-ref-handles). All cases/fixture and native qualification remain unrun; hasAutoFocus remains separate.

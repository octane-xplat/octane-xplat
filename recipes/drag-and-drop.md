# Reorder and move draggable items

ID: drag-and-drop
Targets: web, ios, android
Related APIs: @octane-xplat/dnd-kit, DndContext, useDraggable, useDroppable, SortableList, useSortable, SortableContext, arrayMove

## Starting point

An Octane Xplat app with its UI package and web or NativeScript renderer set up.
The application owns stable item identifiers and collection data.

## Requirements

Reorder a controlled collection, compose a source and a drop target, and connect
an existing scroll owner without putting browser APIs into shared app code.

## Acceptance criteria

- AC1: Install and render a sortable list whose committed item order is saved by the application.
- AC2: Identify a drag source and accepted drop target within one context, including cross-container data handling.
- AC3: Preserve order on cancellation and exclude disabled, unmounted, or rejected targets.
- AC4: Configure bounded edge auto-scroll and understand its ownership and coordinate requirements.
- AC5: Distinguish the supported input and mounted-target scope from device verification and missing capabilities.

## Documentation

- AC1: [Install and reorder](../packages/dnd-kit/README.md#install-and-reorder), [maintained example](../packages/dnd-kit/examples/sortable.tsx).
- AC2: [Compose drag and drop](../packages/dnd-kit/README.md#compose-drag-and-drop).
- AC3: [Compose drag and drop](../packages/dnd-kit/README.md#compose-drag-and-drop), [core tests](../packages/dnd-kit/src/controller.test.ts).
- AC4: [Auto-scroll](../packages/dnd-kit/README.md#auto-scroll).
- AC5: [Limits and verification](../packages/dnd-kit/README.md#limits-and-verification).

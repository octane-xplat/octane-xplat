# Grow a multiline input

ID: textarea-growth
Targets: web, ios, android
Related APIs: TextArea, autoGrow, rows, maxRows, value, onChange

## Starting point

A working app with a multiline input. Choose whether the app or the field owns
its text.

## Requirements

- Fit the input to changing content in controlled or uncontrolled mode.
- Bound growth while keeping longer content accessible.

## Acceptance criteria

- AC1: Omitting value gives field-owned text; controlled value and onChange keep app-owned text synchronized, including external value updates.
- AC2: autoGrow grows and shrinks on edits in either mode, rows sets the starting height, and maxRows caps growth with internal scrolling.

## Documentation

- AC1: [State ownership](../docs/app/primitives.md#grow-a-multiline-field) and maintained [input probes](../packages/app/src/Home.tsrx).
- AC2: [Growth and limits](../docs/app/primitives.md#grow-a-multiline-field); input-driven sizing regressions in `packages/ui/src/TextArea.web.test.tsrx`.

# xplat

> One [Octane](https://github.com/octanejs/octane) codebase, three targets:
> web via the DOM renderer, iOS and Android via NativeScript
> ([`@nativescript-community/octane`](https://github.com/nativescript-community/octane)).

The guides are for building an app. The notes are for understanding or changing
the framework itself.

## Start here

1. [xplat at a glance](spec.md) — decide whether the model fits your app.
2. [Building screens](primitives.md) — compose a first shared screen.
3. [Styling screens](styling.md) — choose classes, tokens, and runtime styles.
4. [Moving between screens](navigation.md) — keep URLs and native stacks useful.
5. [Using device features](platform-services.md) — use storage, permissions,
   and other capabilities safely.
6. [Running and checking an app](toolchain.md) — develop, build, and test.

## What belongs in the notes

The notes keep details that are useful when extending or debugging the
framework but distracting when you are building an app: resolver order,
renderer rules, native driver behavior, CSS support tables, version pins,
compiler limits, lab evidence, decisions, and open questions.

## Notes

Start with [status](status.md) for the current framework state. The original
design record is in [decisions](decisions.md), [open questions](open-questions.md),
and [demos](demos.md). Deep implementation references are grouped by topic:
[framework](framework-notes.md), [architecture](architecture-notes.md),
[primitives](primitive-notes.md), [styling](styling-notes.md),
[navigation](navigation-notes.md), [platform](platform-notes.md), and
[toolchain](toolchain-notes.md). There are also focused notes for [module
resolution](module-resolution-notes.md), [animation](animation-notes.md),
[testing](testing-notes.md), and [CSS support](css-support-notes.md).

# Command palette interaction contract

The [public guide](../../docs/app/command-palette.md) owns usage. A shared DOM-free
controller owns static/source-backed results, stable grouping, disabled-aware
highlight/selection, cancellation, stale-response rejection, loading/error state,
and cleanup on external close or source replacement. Static substring matching
is the default; fuzzy ranking is explicit. Global shortcuts, history, recent or
frequent results, action/navigation routing, source debounce/cache, and large-list
virtualization are caller-owned policies. The component introduces no persistent
usage tracking.

## Platform interaction

Desktop Arrow/Page keys navigate results; Home/End retain text-caret behavior.
Selection and submit respect IME composition. Preserve modal isolation, focus
return, bounded result scrolling, labels, status, and close/reopen cleanup.
AppKit uses the shared sheet/layer dismissal registry so nested layers receive
Escape first. AppKit document coordinates run upward; revealing the final result
can decrease clip origin.

Mobile software Search reruns the query; a result tap executes it. Treat hardware
keys, keyboard lift, touch hit-testing, native announcements, and assistive
technology as separate target contracts. A mocked key adapter or dispatched
monitor callback cannot establish physical input or actual composition.

## Verification

The maintained AppKit host case imports the normal UI barrel and checks modal
attachment, field focus, grouped scrolling, selection, text notifications, and
close/reopen:

```sh
pnpm probe run packages/ui/tests/command-palette-host.macos.tsrx --target macos --deps @octane-xplat/ui --timeout 20000
```

It dispatches installed monitor callbacks and native notifications. Record those
mechanisms accurately; OS keyboard input, mouse hit-testing, IME, and VoiceOver
need separate evidence. Test remote sources with out-of-order responses, external
close during loading, rejection/Retry, and clean reopen.

The original delivery plan and run history are indexed by `local_artifacts` key
`.agents/design/command-palette-plan.md`; follow
[operational evidence](../docs/exploration.md#operational-evidence). Current
qualification belongs in Silo, not a completed checklist in Git.

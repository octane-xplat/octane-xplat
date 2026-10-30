# Keyboard shortcuts API

> Look up every export, runtime method, option, result, and lifecycle rule in `@octane-xplat/shortcuts`.

For installation and a first working command, start with
[Add keyboard shortcuts](keyboard-shortcuts.md). This page is the reference
for an existing app. All exports come from `@octane-xplat/shortcuts`; types are
available through `import type`. The examples use a browser boundary and an
editor element. Each later example is an independent continuation using `shortcuts` and
`editor` from this setup, unless it declares its own runtime.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const shortcuts = createShortcuts({ target: document })
const editor = document.createElement('div')
editor.tabIndex = 0
editor.textContent = 'Focus this editor to try its shortcuts'
document.body.append(editor)
// At owner teardown: shortcuts.dispose(); editor.remove()
```

| Look up | Section |
| --- | --- |
| Creation and defaults | [createShortcuts and ShortcutOptions](#createshortcuts-and-shortcutoptions) |
| Every runtime method | [ShortcutRuntime](#shortcutruntime) |
| Combos, sequences and aliases | [Key expressions](#key-expressions) |
| Binding fields and removal | [Bindings](#bindings) |
| Scopes, conditions and context | [Availability and context](#availability-and-context) |
| Dispatch ordering and pauses | [Dispatch and pauses](#dispatch-and-pauses) |
| User-controlled binding collections | [BindingSet](#bindingset) |
| Capturing a new shortcut | [Recording](#recording) |
| Reservations and validation results | [Validation and presets](#validation-and-presets) |
| Handler and event payloads | [Matches, candidates and events](#matches-candidates-and-events) |
| Snapshots and dispatch traces | [Inspection](#inspection) |
| Errors and cleanup | [Errors and lifecycle](#errors-and-lifecycle) |

## createShortcuts and ShortcutOptions

`createShortcuts(options: ShortcutOptions): ShortcutRuntime` attaches listeners
immediately. The required `target` is the runtime's outer input boundary.
Dispose before its owner detaches or changes windows, then create a runtime for
the next owner. Missing host support, an unattached native target, an invalid
blocklist or a non-positive/non-finite sequence timeout throws at creation.

```ts
import { createShortcuts, type ShortcutOptions } from '@octane-xplat/shortcuts'

const options: ShortcutOptions = {
  target: editor,
  sequenceTimeout: 800,
  editablePolicy: 'ignore-editable',
  getActiveScopes: () => ['editor'],
  canDispatch: candidate => !candidate.event.composing,
  onError: (error, info) => console.error(info.phase, error),
}
const editorShortcuts = createShortcuts(options)
editorShortcuts.bind('Mod+KeyK', () => console.log('Editor commands'))
editorShortcuts.dispose()
```

| Option | Type | Default and meaning |
| --- | --- | --- |
| `target` | `object` | Required. A Document/DOM element, renderer-owned AppKit NSView, GTK widget, or attached WinUI element. NativeScript wrappers are unwrapped through `nativeViewProtected`. |
| `platform` | `ShortcutPlatform` | Host platform. Overrides `Mod` resolution and platform filtering of reservations; does not select a host adapter. |
| `blocklist` | `ShortcutBlocklist` | `[]`. Reservation data; see [validation](#validation-and-presets). |
| `sequenceTimeout` | `number` | `1000` milliseconds between matching sequence steps. Must be finite and greater than zero. Also supplies the default recording timeout. |
| `editablePolicy` | `EditablePolicy` | `'ignore-editable'`. Used by bindings that inherit the runtime policy. |
| `getActiveScopes` | `() => Iterable<string>` | No extra scopes. Returns highest precedence first; duplicates/empty strings are removed and `'root'` is always last. |
| `canDispatch` | `(candidate: ShortcutCandidate) => boolean` | No filter. Runs after key matching and `when`, before choosing a winner or consuming input. False or an exception rejects that candidate and permits another candidate to win. |
| `onError` | `(error: unknown, info: ErrorInfo) => void` | Errors are rethrown asynchronously when omitted. Handles guard, synchronous handler and recording-update errors. |

`ShortcutPlatform` is `'mac' | 'windows' | 'linux' | 'other'`. Native adapters are
selected by the normal platform preset. Mobile hardware shortcuts and global
OS hotkeys are unsupported. Desktop adapters remain experimental; see the
[host requirements and verification limits](keyboard-shortcuts.md#native-desktop-boundaries).
Use an explicit platform only when deterministic modifier interpretation is
needed, such as importing preferences for a known platform.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const macBindings = createShortcuts({ target: document, platform: 'mac' })
macBindings.bind('Mod+k', () => console.log('Matches Meta+k on this runtime'))
macBindings.dispose()
```

## ShortcutRuntime

The runtime exposes the following methods. Method names link to their detailed
behavior and examples below.

```ts
const binding = shortcuts.bind('Escape', () => console.log('Close panel'))
console.log(binding.id, shortcuts.getBindings())
shortcuts.unbind(binding)
```

| Method | Returns | Reference |
| --- | --- | --- |
| `bind(input, handler?)` | `BindingHandle` | [Register a binding](#register-and-remove-bindings) |
| `bindWithin(within, input, handler?)` | `BindingHandle` | [Register a binding](#register-and-remove-bindings) |
| `unbind(binding)` | `boolean` | [Remove a binding](#register-and-remove-bindings) |
| `createBindingSet()` | `BindingSet` | [Binding collections](#bindingset) |
| `pause(scope?)` | `void` | [Pauses](#pauses) |
| `resume(scope?)` | `void` | [Pauses](#pauses) |
| `record(options?)` | `RecordingSession` | [Recording](#recording) |
| `setContext(path, value)` | `void` | [Context updates](#context-methods) |
| `getContext(path)` | `unknown` | [Context reads](#context-methods) |
| `deleteContext(path)` | `boolean` | [Context removal](#context-methods) |
| `batchContext(update)` | `void` | [Context updates](#context-methods) |
| `isAvailable(input)` | `boolean` | [Action availability](#isavailable) |
| `validateShortcut(combo)` | `ShortcutValidationResult` | [Validation](#validateshortcut) |
| `getBindings()` | `readonly BindingSnapshot[]` | [Snapshots](#binding-and-sequence-snapshots) |
| `getActiveSequences()` | `readonly SequenceSnapshot[]` | [Snapshots](#binding-and-sequence-snapshots) |
| `explain(event)` | `EvaluationTrace` | [Traces](#explain) |
| `dispose()` | `void` | [Cleanup](#dispose) |

## Key expressions

A combo has one primary key and zero or more modifiers separated by `+`.
Modifier names are case-insensitive. A sequence is one or more combos
separated by whitespace; avoid spaces inside its individual combos. All four
modifier states must match exactly: `k` does not also match Ctrl+K or Shift+K.
Letter keys normalize to lowercase; Shift must be requested explicitly.

```ts
shortcuts.bind('Ctrl+Shift+k', () => console.log('Control, Shift and K'))
shortcuts.bind({ sequence: 'Mod+k Mod+c', handler: () => console.log('Comment') })
shortcuts.bind('Shift+Plus', () => console.log('Increase size'))
```

| Input | Canonical meaning |
| --- | --- |
| `Ctrl`, `Control` | `Ctrl` |
| `Meta`, `Cmd`, `Command` | `Meta` |
| `Alt`, `Option` | `Alt` |
| `Shift` | `Shift` |
| `Mod` | `Meta` on `'mac'`; `Ctrl` on other platforms |
| `Esc`, `Escape` | `Escape` |
| `Return`, `Enter` | `Enter` |
| `Del`, `Delete` | `Delete` |
| `Up`, `Down`, `Left`, `Right` | `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` |
| `Space`, `Tab`, `Backspace` | Named logical keys |
| `Plus` | The logical `+` character; use this instead of a literal `+` token |

Logical characters follow the text layout. Explicit physical codes match only
that position, with no logical fallback when the host leaves the code unmapped.
Physical codes include `KeyA`–`KeyZ`, `Digit0`–`Digit9`, `Numpad0`–`Numpad9`,
`NumpadAdd`, `NumpadSubtract`, `NumpadMultiply`, `NumpadDivide`, `NumpadDecimal`,
`NumpadEnter`, `NumpadEqual`, `NumpadComma`, `BracketLeft`, `BracketRight`,
`Backslash`, `Semicolon`, `Quote`, `Backquote`, `Comma`, `Period`, `Slash`,
`Minus`, `Equal`, `IntlBackslash`, `IntlYen` and `IntlRo`. Alt+letter/digit
bindings additionally accept the corresponding physical position, so
Option-generated symbols can still match their intended letter/digit binding.

```ts
shortcuts.bind('Mod+k', () => console.log('Logical K'))
shortcuts.bind('Mod+KeyK', () => console.log('Physical K position'))
shortcuts.bind('Alt+1', () => console.log('Alt+1, including its symbol-producing layout'))
shortcuts.bind('NumpadEnter', () => console.log('Keypad Enter'))
```

Canonical expressions use modifier order `Ctrl`, `Meta`, `Alt`, `Shift` and
resolved platform modifiers. A combo without a primary key, an empty expression
or multiple primary keys throws when bound. A completed sequence competes with
other completed candidates; an unfinished sequence does not defer a matching
combo or consume its prefix automatically. Each matching step refreshes the
sequence deadline; an unexpected key of the selected phase drops that partial
match. Ignored repeats and the other keyboard phase do not advance it.

```ts
const sequence = shortcuts.bind({ sequence: 'g i', handler: () => console.log('Inbox') })
// Press g, then i within sequenceTimeout. Unbind also clears its partial match.
shortcuts.unbind(sequence.id)
```

## Bindings

### Register and remove bindings

`bind(input: BindingInput, handler?: ShortcutHandler): BindingHandle` accepts a
combo string with a separate handler, or one `BindingSpec` object containing
its handler. Do not pass a second handler with object input.
`bindWithin(within: object, input: BindingInput, handler?: ShortcutHandler)`
returns the same handle and overrides any object-form `within` boundary. Every
sequence step must remain inside both that boundary and the runtime target.

```ts
const close = shortcuts.bind('Escape', () => console.log('Close'))
const submit = shortcuts.bindWithin(editor, {
  combo: 'Mod+Enter',
  editablePolicy: 'allow-if-meta',
  handler: match => console.log('Submit', match.bindingId),
})
console.log(close.id, submit.id)
```

`BindingHandle` has `id: string` and `dispose(): boolean`.
`unbind(binding: BindingHandle | string): boolean` and `handle.dispose()` remove
the same registration, including its partial sequence state. They return true
only when the binding existed. Repeated removal returns false.

```ts
const handle = shortcuts.bind('F1', () => console.log('Help'))
console.log(shortcuts.unbind(handle.id)) // true
console.log(handle.dispose()) // false
```

### BindingSpec and BindingInput

`BindingInput = string | BindingSpec`. A `BindingSpec` includes the
`RunnableInput` fields `scope` and `when`, plus the fields below. Exactly one
nonempty `combo` or `sequence`, and a handler, are required.

```ts
import type { BindingSpec } from '@octane-xplat/shortcuts'

const save: BindingSpec = {
  combo: 'Mod+s',
  scope: ['editor', 'preview'],
  when: 'editor.ready && !editor.readOnly',
  within: editor,
  keyEvent: 'keydown',
  priority: 10,
  editablePolicy: 'allow-if-meta',
  preventDefault: true,
  stopPropagation: false,
  allowRepeat: false,
  handler: match => console.log('Save', match.matchedScope),
}
shortcuts.bind(save)
```

| Field | Type | Default and meaning |
| --- | --- | --- |
| `combo` | `string` | One combo; mutually exclusive with `sequence`. |
| `sequence` | `string` | Whitespace-separated combos; mutually exclusive with `combo`. |
| `handler` | `ShortcutHandler` | Required. Called synchronously for the winning binding. |
| `scope` | `string` or `readonly string[]` | `'root'`; empty entries are removed, and an empty list falls back to `'root'`. |
| `when` | `string` | No condition. A truthy expression result is required. |
| `within` | `object` | No extra boundary. Narrower matching boundaries break otherwise equal ties. |
| `keyEvent` | `KeyEventType` | `'keydown'`. `KeyEventType = 'keydown' | 'keyup'`. |
| `priority` | `number` | `0`; higher values win first. |
| `editablePolicy` | `'inherit'` or `EditablePolicy` | `'inherit'`; use the runtime's default policy. |
| `preventDefault` | `boolean` | `false`; cancel native default handling when this binding wins. |
| `stopPropagation` | `boolean` | `false`; stop ancestor shortcut handling when this binding wins. |
| `allowRepeat` | `boolean` | `false`; opt into held-key repeats. |

`EditablePolicy` is `'ignore-editable'`, `'allow-in-editable'` or
`'allow-if-meta'`. The last permits editable targets only with Ctrl or Meta
pressed, regardless of the name `Mod` resolves to. Composition events do not
dispatch bindings. GTK and WinUI share native cancellation/propagation handling;
see [host differences](keyboard-shortcuts.md#native-desktop-boundaries).

```ts
shortcuts.bind({
  combo: 'Mod+s', editablePolicy: 'allow-if-meta', preventDefault: true,
  handler: () => console.log('Save while typing'),
})
shortcuts.bind({ combo: 'ArrowDown', allowRepeat: true, handler: () => console.log('Next row') })
```

## Availability and context

### isAvailable

`isAvailable(input: RunnableInput): boolean` checks scope and `when` only. It
ignores pauses, editable policies, repeats, keyboard matching, reservations and
`canDispatch`. It is an action-availability query, not a check that a runtime is
alive or that an OS shortcut will arrive. `RunnableInput` contains optional
`scope: string | readonly string[]` and `when: string`; an app's richer action
object can satisfy this structural type.

```ts
const saveAction = { id: 'save', scope: 'editor', when: 'editor.dirty' }
shortcuts.setContext('editor.dirty', true)
console.log(shortcuts.isAvailable(saveAction)) // Depends on whether editor scope is active.
console.log(shortcuts.isAvailable({ when: 'editor.dirty' })) // true, in root scope
```

### Context methods

`setContext(path: string, value: unknown): void` and
`batchContext(update: Record<string, unknown>): void` update dotted paths.
`getContext(path: string): unknown` returns the value or undefined.
`deleteContext(path: string): boolean` returns whether a value was removed.
Batch updates commit together: an invalid path leaves the previous context
unchanged. A missing parent, array, or other non-plain-object intermediate
parent is replaced with a plain object when setting a nested value.

```ts
shortcuts.setContext('editor.dirty', true)
shortcuts.batchContext({ 'editor.ready': true, 'editor.readOnly': false })
console.log(shortcuts.getContext('editor.dirty')) // true
console.log(shortcuts.deleteContext('editor.dirty')) // true
console.log(shortcuts.getContext('editor.dirty')) // undefined
```

Paths trim each segment and discard empty segments. `setContext` rejects an
empty path; `getContext` returns undefined and `deleteContext` returns false
for it. `batchContext` skips empty paths. All path methods reject any segment
named `__proto__`, `prototype` or `constructor`. Writes/deletes also reject the
reserved top-level names `context`, `event`, `scope` and `runtime`.

```ts
shortcuts.setContext(' editor . ready ', true)
console.log(shortcuts.getContext('editor.ready')) // true
try {
  shortcuts.batchContext({ 'editor.ready': false, 'runtime.platform': 'mac' })
} catch {
  console.log(shortcuts.getContext('editor.ready')) // true: batch was not applied.
}
```

### when expressions and evaluation context

`when` is a boolean expression evaluated against the context below; its result
is converted to boolean. Use property reads, literals, comparisons, `!`, `&&`,
`||` and parentheses to express conditions. Invalid syntax throws when binding,
replacing a set or checking availability. Availability checks test scopes
first: an inactive scope returns false without compiling its condition.
A runtime evaluation error, such as
accessing a missing nested object, makes the condition false; it does not call
`onError`. `isAvailable` evaluates without a keyboard event: `event.key` and
`event.code` are undefined and modifier/repeat/composition flags are false.

```ts
shortcuts.setContext('editor.ready', true)
shortcuts.bind({
  combo: 'Mod+s',
  when: 'editor.ready && (runtime.platform === "mac" || event.ctrl)',
  handler: match => console.log(match.context.scope),
})
console.log(shortcuts.isAvailable({ when: 'context.editor.ready && !event.repeat' }))
```

| Namespace | Fields |
| --- | --- |
| User values | Available at their original top-level paths and under `context`, such as `editor.ready` and `context.editor.ready`. |
| `event` | `key`, `code`, `repeat`, `composing`, `alt`, `ctrl`, `meta`, `shift`. These flags are direct fields here, unlike `NormalizedKeyEvent.modifiers`. |
| `scope` | `active: string[]`, `matched: string`. Active scopes include the final `'root'`. |
| `runtime` | `platform: ShortcutPlatform`, `recording: boolean`. |

## Dispatch and pauses

### Conflict ordering

Within one runtime, only one eligible binding runs per event. Eligible means
inside the boundaries, in an active/unpaused scope, permitted by editable and
repeat rules, matched by key/sequence, accepted by `when`, and accepted by
`canDispatch`. Keep `getActiveScopes` and `canDispatch` free of side effects;
inspection also calls them.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const scoped = createShortcuts({
  target: document,
  getActiveScopes: () => ['dialog', 'editor'],
  canDispatch: candidate => candidate.context.appEnabled === true,
})
scoped.setContext('appEnabled', true)
scoped.bind({ combo: 'Escape', scope: 'editor', handler: () => console.log('Editor') })
scoped.bind({ combo: 'Escape', scope: 'dialog', handler: () => console.log('Dialog wins') })
scoped.dispose()
```

Tie breakers apply in this order:

1. Higher `priority`.
2. A completed sequence over a combo.
3. A longer completed sequence.
4. A scope earlier in `getActiveScopes()`; `'root'` comes last.
5. A narrower matching `within` boundary.
6. A later registration slot. Each direct binding or binding set owns a slot.
7. A later entry within the same binding set.

```ts
const earlier = shortcuts.bind('F4', () => console.log('Earlier'))
const later = shortcuts.bind('F4', () => console.log('Later wins an otherwise equal tie'))
later.dispose()
// The earlier binding is eligible again.
earlier.dispose()
```

### Pauses

`pause(scope?: string): void` and `resume(scope?: string): void` use matching
reference counts. Omitting the argument pauses/resumes all scopes; a string
addresses that exact scope. A scoped pause can leave a binding eligible in
another active scope. Extra resume calls stop at zero. Pauses suppress dispatch,
not native input, recording or `isAvailable`.

```ts
shortcuts.pause('editor')
shortcuts.pause('editor')
shortcuts.resume('editor') // Still paused once.
shortcuts.resume('editor') // Balanced.
shortcuts.pause()
try {
  console.log(shortcuts.isAvailable({})) // true: availability ignores pauses.
} finally {
  shortcuts.resume()
}
```

## BindingSet

`createBindingSet(): BindingSet` creates an owned collection for derived or
user-configured bindings. `replace(next: readonly BindingSpec[]): void` validates
every next binding before swapping: a failure leaves the old bindings in place.
A successful replacement generates new binding IDs, removes the previous
partial sequences and preserves the set's registration slot relative to other
bindings/sets. The last equal entry within the set wins.

```ts
const preferences = shortcuts.createBindingSet()
preferences.replace([
  { combo: 'Mod+s', handler: () => console.log('Save') },
  { sequence: 'g i', handler: () => console.log('Inbox') },
])
console.log(preferences.getBindings().map(binding => binding.expression))
// ['Meta+s', 'g i'] on macOS; ['Ctrl+s', 'g i'] on other hosts.
```

`getBindings(): readonly BindingSnapshot[]` returns this set's bindings in entry
order. `clear(): void` empties the set while retaining its slot for later use.
`dispose(): void` removes the set's bindings permanently and is safe to repeat.
After either set or runtime disposal, set reads return `[]` and `replace`/`clear`
throw. `replace` accepts object descriptors, not string shorthand or a separate
handler argument.

```ts
const managed = shortcuts.createBindingSet()
managed.replace([{ combo: 'F6', handler: () => console.log('Focus next pane') }])
managed.clear()
managed.replace([{ combo: 'F7', handler: () => console.log('Focus previous pane') }])
managed.dispose()
console.log(managed.getBindings()) // []
```

## Recording

`record(options?: RecordOptions): RecordingSession` starts one active recording
per runtime. It captures logical, canonical key expressions using actual
`Ctrl`/`Meta` names, not `Mod` or explicit physical codes. Modifier-only presses
are ignored; delivered composition events and repeats can be recorded. Only
events inside both recording and runtime boundaries are observed. Timers start
immediately and restart after each captured step, so an idle recording can
finish with no steps.

```ts
const session = shortcuts.record({
  timeout: 1000,
  consumeEvents: true,
  onUpdate: recording => console.log('Current shortcut:', recording.expression),
})
void session.finished.then(
  recording => console.log('Saved:', recording.expression),
  error => console.log('Recording ended:', error.name),
)
// Let the idle timeout finish, or call session.stop() / session.cancel() from UI actions.
```

| RecordOptions field | Type | Default and meaning |
| --- | --- | --- |
| `eventType` | `KeyEventType` | `'keydown'`; choose `'keyup'` to record releases. |
| `timeout` | `number` | Runtime `sequenceTimeout`, in milliseconds; finite and greater than zero. |
| `suppressHandlers` | `boolean` | `true`; suppress this runtime's bindings inside the recording boundary, including events not captured as steps. |
| `consumeEvents` | `boolean` | `false`; captured steps call both native cancellation methods. Modifier-only events are not captured. |
| `target` | `object` | Runtime target. May narrow recording but cannot expand the runtime's input boundary. |
| `onUpdate` | `(recording: ShortcutRecording) => void` | No callback. Receives a new snapshot after each captured step; errors are reported without ending recording. |

### RecordingSession and ShortcutRecording

`RecordingSession.stop(): ShortcutRecording` finishes immediately and resolves
`finished: Promise<ShortcutRecording>` with the final snapshot.
`cancel(): void` rejects `finished` with an Error named `'AbortError'`.
Disposing the runtime also rejects an active session. Handle that rejection
before cancelling or disposing. Settled session methods cannot stop/cancel a
later recording. A snapshot and its steps array are frozen.

```ts
const stopped = shortcuts.record()
void stopped.finished.catch(error => console.log(error.name))
const snapshot = stopped.stop()
console.log(snapshot.steps, snapshot.expression, snapshot.eventType) // [], '', 'keydown'

const cancelled = shortcuts.record()
void cancelled.finished.catch(error => console.log(error.name)) // AbortError
cancelled.cancel()
```

| ShortcutRecording field | Type | Meaning |
| --- | --- | --- |
| `steps` | `readonly string[]` | Canonical expressions in capture order. |
| `expression` | `string` | Steps joined with one space, or `''` when empty. |
| `eventType` | `KeyEventType` | Captured phase. |

## Validation and presets

### validateShortcut

`validateShortcut(combo: string): ShortcutValidationResult` parses a single
combo and compares it with configured reservations. Sequences are not accepted.
It reports invalid syntax and policy matches rather than throwing for them;
calling it on a disposed runtime does throw. No reservation is enabled by
default. Binding registration does not enforce validation, so the app decides
whether a result blocks a saved choice. A valid result does not prove that the
key exists on the current keyboard or that its host will deliver it.

```ts
const validation = shortcuts.validateShortcut('Control + K')
if (validation.valid) {
  console.log(validation.canonicalCombo) // Ctrl+k
} else {
  for (const issue of validation.errors) console.log(issue.code, issue.combo)
}
```

| ShortcutValidationResult variant | Fields |
| --- | --- |
| `valid: true` | `combo: string` is the original input; `canonicalCombo: string` is normalized. |
| `valid: false` | `combo: string`, optional `canonicalCombo: string`, and `errors: readonly ShortcutValidationError[]`. |
| Error `code: 'invalid-shortcut'` | `combo: string`, `error: Error`. |
| Error `code: 'shortcut-blocked'` | `combo: string`, `canonicalCombo: string`, `category: ShortcutBlocklistCategory`, optional `browser: ShortcutBrowser` and `platform: ShortcutPlatform`. |

### ShortcutBlocklist and preset exports

`ShortcutBlocklist = readonly ShortcutBlocklistEntry[]`.
Each entry has `combo: string`, `category: ShortcutBlocklistCategory`, optional
`browser: ShortcutBrowser` and optional `platform: ShortcutPlatform`.
`ShortcutBlocklistCategory = 'browser' | 'os'`;
`ShortcutBrowser = 'chrome' | 'edge' | 'firefox' | 'safari'`.
Entries for another platform are ignored. Browser metadata does not select or
filter a browser: choose the browser presets explicitly.

```ts
import { createShortcuts, commonBrowserShortcuts, chromeBrowserShortcuts, macOsShortcuts, type ShortcutBlocklist } from '@octane-xplat/shortcuts'

const reservations: ShortcutBlocklist = [
  ...commonBrowserShortcuts,
  ...chromeBrowserShortcuts,
  ...macOsShortcuts,
  { combo: 'Mod+Shift+p', category: 'os' },
]
const reserved = createShortcuts({ target: document, blocklist: reservations })
console.log(reserved.validateShortcut('Mod+w'))
reserved.dispose()
```

| Export | Entries |
| --- | --- |
| `commonBrowserShortcuts` | Common browser reservations; no browser-family tag. |
| `chromeBrowserShortcuts` | Chrome-tagged browser reservations. |
| `edgeBrowserShortcuts` | Edge-tagged browser reservations. |
| `firefoxBrowserShortcuts` | Firefox-tagged browser reservations. |
| `safariBrowserShortcuts` | Safari-tagged browser reservations. |
| `linuxOsShortcuts` | Linux OS reservations. |
| `macOsShortcuts` | macOS reservations. |
| `windowsOsShortcuts` | Windows OS reservations. |

The eight arrays contain `ShortcutBlocklistEntry` values; they are snapshots,
not an exhaustive/current list of OS or browser restrictions. Browser-category
matches attempt `preventDefault()` on delivered, non-composing `keydown`
events within the boundary, even without a winning app binding. OS entries
provide validation data only. No preset grants access to system-wide input or
guarantees that a reserved key reaches your app.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const policy = createShortcuts({
  target: document,
  blocklist: [{ combo: 'Mod+w', category: 'browser' }],
})
// Delivery permitting, Mod+W is cancelled; validation also reports it as blocked.
console.log(policy.validateShortcut('Mod+w').valid) // false
policy.dispose()
```

## Matches, candidates and events

### ShortcutHandler, ShortcutMatch and ShortcutCandidate

`ShortcutHandler = (match: ShortcutMatch) => void`. A winning binding receives
the following fields. `ShortcutCandidate`, passed to `canDispatch`, has the same
fields plus `handler: ShortcutHandler`. Candidate guards run before consumption;
handlers run afterward. Handle asynchronous work/rejections inside your handler:
the runtime catches synchronous exceptions, not rejected promises.

```ts
import type { ShortcutHandler } from '@octane-xplat/shortcuts'

const showMatch: ShortcutHandler = match => {
  console.log(match.bindingId, match.combo, match.sequence, match.matchedScope)
  console.log(match.event.modifiers, match.context.runtime)
}
shortcuts.bind({ combo: 'F8', handler: showMatch })
```

| Field | Type | Meaning |
| --- | --- | --- |
| `bindingId` | `string` | Generated registration ID. |
| `combo` | `string` | Canonical first-step expression, including for a sequence. |
| `sequence` | `string` (optional) | Full canonical expression for a sequence binding. |
| `event` | `NormalizedKeyEvent` | Winning or candidate event. |
| `context` | `Record<string, unknown>` | User and built-in namespaces from [evaluation context](#when-expressions-and-evaluation-context). |
| `matchedScope` | `string` | Highest active matching scope for this binding. |
| `handler` | `ShortcutHandler` | Candidate only: the registered handler. |

### NormalizedKeyEvent

Normalized events use lowercase logical letters and canonical named keys.
`nativeEvent` preserves host cancellation methods; it is not promised to be a
DOM `KeyboardEvent` on native desktop.

```ts
shortcuts.bind({
  combo: 'F9',
  handler({ event }) {
    console.log(event.type, event.key, event.code, event.repeat, event.composing)
    console.log(event.modifiers.ctrl, event.target)
    event.nativeEvent.preventDefault()
  },
})
```

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | `KeyEventType` | `'keydown'` or `'keyup'`. |
| `key` | `string` | Canonical logical key such as `'k'`, `'Plus'` or `'Escape'`. |
| `code` | `string` | Physical key code, or `''` when unmapped. |
| `modifiers` | `{ alt: boolean; ctrl: boolean; meta: boolean; shift: boolean }` | Captured modifier flags. |
| `repeat` | `boolean` | Host's held-key repeat state. |
| `composing` | `boolean` | Composition state. |
| `target` | `object` or `null` | Original focused host object. |
| `nativeEvent` | `ShortcutEvent` | Structural host event. |

### ShortcutEvent

`ShortcutEvent` is the structural input accepted by `explain` and carried in
normalized payloads. Browser `KeyboardEvent` objects satisfy it; native adapters
produce the same public shape. All data properties are readonly.

```ts
import type { ShortcutEvent } from '@octane-xplat/shortcuts'

function inspectHostEvent(event: ShortcutEvent) {
  console.log(event.defaultPrevented, event.composedPath?.())
  return shortcuts.explain(event)
}
```

| Member | Type | Meaning |
| --- | --- | --- |
| `type` | `string` | Host phase; `'keyup'` stays up, other values normalize to `'keydown'`. |
| `key`, `code` | `string` | Host logical key and physical position; unknown keys may be `'Unidentified'`, unknown codes `''`. |
| `altKey`, `ctrlKey`, `metaKey`, `shiftKey` | `boolean` | Host modifier flags. |
| `repeat`, `isComposing` | `boolean` | Repeat and composition flags. |
| `target` | `object` or `null` | Focused host object. |
| `defaultPrevented` | `boolean` | Native cancellation state. |
| `preventDefault()` | `void` | Request native-default cancellation where supported. |
| `stopPropagation()` | `void` | Stop delivery to ancestor shortcut boundaries. |
| `composedPath?()` | `object[]` | Optional origin-first ancestry including the runtime boundary. |

## Inspection

### Binding and sequence snapshots

`getBindings(): readonly BindingSnapshot[]` returns current registrations in
registration-slot order, with earlier slots first. This is not a sorted list
of dispatch winners: priority, scope and boundary still affect each event.
A binding set's version returns entry order.
`getActiveSequences(): readonly SequenceSnapshot[]` returns unexpired partial
matches. The numeric `stepIndex` is zero-based and names the next step, not the
last captured step. `expiresAt` uses epoch milliseconds.

```ts
for (const binding of shortcuts.getBindings()) {
  console.log(binding.id, binding.type, binding.expression, binding.scopes)
}
for (const sequence of shortcuts.getActiveSequences()) {
  console.log(sequence.bindingId, sequence.stepIndex, sequence.expiresAt)
}
```

| BindingSnapshot field | Type |
| --- | --- |
| `id` | `string` |
| `type` | `'combo'` or `'sequence'` |
| `expression` | `string` |
| `scopes` | `readonly string[]` |
| `priority` | `number` |
| `keyEvent` | `KeyEventType` |
| `whenSource` | `string` (optional) |
| `within` | `object` (optional) |

| SequenceSnapshot field | Type |
| --- | --- |
| `bindingId` | `string` |
| `matchedScope` | `string` |
| `stepIndex` | `number` |
| `expiresAt` | `number` |

### explain

`explain(event: ShortcutEvent): EvaluationTrace` evaluates delivery without
calling handlers, consuming input, updating sequence state, or recording a
step. It still runs scope providers, `when` expressions and candidate guards;
keep those callbacks free of side effects. Guard errors appear in the trace
without calling `onError` during inspection.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const inspected = createShortcuts({ target: editor })
inspected.bind('Mod+KeyK', () => console.log('Open commands'))
const inspectKey = (event: KeyboardEvent) => {
  const trace = inspected.explain(event)
  console.log(trace.winner, trace.blockedBy, trace.candidates)
}
editor.addEventListener('keydown', inspectKey)
const sample = new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', ctrlKey: true })
console.log(inspected.explain(sample).candidates) // []: sample has no target inside editor.
const disposeInspection = () => {
  editor.removeEventListener('keydown', inspectKey)
  inspected.dispose()
}
// Call disposeInspection when the inspection UI closes.
```

| Type | Fields |
| --- | --- |
| `EvaluationTrace` | `event: NormalizedKeyEvent`, `candidates: CandidateTrace[]`, optional `blockedBy: readonly ShortcutBlocklistEntry[]`, optional `winner: string`. |
| `CandidateTrace` | `bindingId: string`, `matcherMatched: boolean`; optional `matchedScope: string`, `when: WhenTrace`, `canDispatch: CanDispatchTrace`, `rejectedBy` as below. |
| `WhenTrace` | `source: string`, `result: boolean`, optional `error: Error`. |
| `CanDispatchTrace` | `result: boolean`, optional `error: Error`. |

`CandidateTrace.rejectedBy` is `'boundary'`, `'recording'`, `'paused'`,
`'editable-policy'`, `'scope'`, `'matcher'`, `'when'`, `'can-dispatch'` or
`'conflict'`. An empty candidate list can also mean that the event is outside
the runtime boundary, is composing, or was intercepted by recording; do not
assume every rejection produces one trace row.

```ts
editor.addEventListener('keydown', event => {
  for (const candidate of shortcuts.explain(event).candidates) {
    console.log(candidate.bindingId, candidate.matcherMatched, candidate.rejectedBy)
    console.log(candidate.when?.error, candidate.canDispatch?.result)
  }
})
```

## Errors and lifecycle

### ErrorInfo and synchronous failures

`onError` receives `ErrorInfo` with `phase: 'canDispatch' | 'handler' | 'recording'`,
optional `bindingId: string` and optional `event: NormalizedKeyEvent`.
A guard exception rejects that candidate; a handler exception occurs after the
winner has consumed input; an `onUpdate` exception does not end recording.
Without `onError`, these failures are rethrown asynchronously. Keep the error
callback itself non-throwing. Binding/parser/context/lifecycle errors are
synchronous exceptions and do not go through this callback.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const reported = createShortcuts({
  target: document,
  onError(error, info) {
    console.error(info.phase, info.bindingId, info.event?.key, error)
  },
})
try {
  reported.bind({ combo: 'Ctrl', handler: () => {} }) // No primary key.
} catch (error) {
  console.log('Invalid binding:', error)
}
reported.dispose()
```

### dispose

`dispose(): void` releases host listeners, clears bindings, sequences, pauses,
context and cached conditions, and rejects any active recording with
`AbortError`. It is safe to call repeatedly. Native listener cleanup can throw
if a host release fails; runtime state is still cleared. All methods requiring
an active owner are listed below; avoid using read methods after disposal to
infer that input is still attached.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const owned = createShortcuts({ target: editor })
const pending = owned.record()
void pending.finished.catch(error => console.log(error.name))
owned.dispose() // Rejects pending recording and removes input listeners.
owned.dispose() // Safe.
```

| After runtime disposal | Behavior |
| --- | --- |
| `bind`, `bindWithin`, `createBindingSet`, `pause`, `record`, `setContext`, `deleteContext`, `batchContext`, `validateShortcut` | Throw. |
| `getBindings`, `getActiveSequences`, binding-set `getBindings` | Return `[]`. |
| `getContext` | Context has been cleared; ordinary missing paths return undefined. Invalid prototype paths still throw. |
| `unbind`, `BindingHandle.dispose` | Return false because registrations have been cleared. |
| `resume` | Remains callable. |
| `isAvailable` | Still evaluates scope/conditions against cleared context; it is not a liveness test. |
| `explain` | Can inspect an event, with no registered bindings left. |
| Binding-set `replace`, `clear` | Throw. Set `dispose` remains safe. |
| Recording-session `stop`, `cancel` | Do not settle or affect a later session; an already rejected `finished` promise remains rejected. |

## Exported type index

Every public type is listed here for editor lookup. The sections above document
its fields and behavior; exact declarations also ship with the package.

```ts
import type {
  ShortcutRuntime, ShortcutOptions, ShortcutPlatform,
  BindingInput, BindingSpec, BindingHandle, BindingSet, EditablePolicy, KeyEventType,
  RunnableInput, ShortcutHandler, ShortcutMatch, ShortcutCandidate,
  ShortcutEvent, NormalizedKeyEvent, BindingSnapshot, SequenceSnapshot,
  RecordOptions, RecordingSession, ShortcutRecording,
  ShortcutBlocklist, ShortcutBlocklistEntry, ShortcutBlocklistCategory, ShortcutBrowser,
  ShortcutValidationResult, ShortcutValidationError,
  EvaluationTrace, CandidateTrace, WhenTrace, CanDispatchTrace, ErrorInfo,
} from '@octane-xplat/shortcuts'
```

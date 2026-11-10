# Gesture ownership and composition

Status: proposal for review. No API below is implemented by this document. Source baseline: `0c291fca389d535a57c55ebb6f23998b6ea66af4`; consumer evidence: Opals `0af25b863e9662951915129959c4b3575a3bed31`. This is a system design, not an approved numbered decision or an implementation plan.

## Recommendation

Keep the shared components and platform leaves, but replace independent callback-to-recognizer plumbing with a shared interaction owner. Its unit of arbitration is a contact sequence: from first contact down until all contacts are up or cancelled. A recognizer can observe without owning that sequence; activation is the point at which it claims input and cancels incompatible work. Scrolling and Pressable participate in the same ownership system.

Prioritize stable lifetime, explicit cancellation, scroll suspension, and event coordinates together. Expose read-only signals for observable state and selected live controls as part of that core. Then add cross-platform pinch and explicit composition. Adding more callback props alone cannot coordinate UIKit, Mason, browser scrolling, and semantic activation. A wholesale renderer rewrite or a new native gesture dependency is not justified by the evidence.

Product policy stays in the app: destinations, dismissal distances, seeking by ten seconds, first-tap immediacy and a 300ms second-tap window, media geometry, and zoom bounds. The framework supplies reliable contacts, recognition, cancellation, and activation; it does not decide what a drag means.

## What still applies

Issue state is supporting context, not qualification. The following classifications combine source inspection with recorded results; no new OS/browser input was run for this proposal.

| Friction | Assessment | Design consequence |
| --- | --- | --- |
| [#221: scroll suspension](https://github.com/octane-xplat/octane-xplat/issues/221) | Current shared contract gap. `UseScrollableAreaOptions` has no suspension/input-enabled contract. Opals' per-viewport touch-action containment has recorded simulator HID success; disabling descendants alone previously failed. The issue remains open. | Establish viewport policy before recognition and expose offset-preserving suspension. A post-claim flag alone is insufficient. |
| [#189: nested web clicks](https://github.com/octane-xplat/octane-xplat/issues/189) | Historical eager-capture defect, closed. Current `pan.web.tsrx` defers capture beyond 8px and retains a callback ref. It still uses radial slop, has no axis-intent contract, emits `began` on down, and arbitrates independently of scroll/other recognizers. | Preserve deferred capture; introduce explicit activation, axis intent, and sequence-scoped activation suppression. |
| [#222: handler replacement](https://github.com/octane-xplat/octane-xplat/issues/222) | Current native source gap: `usePan` uses `useCallback(..., [cb])`; `usePinch` has the same pattern. Opals wraps pan in `useEffectEvent`. Actual device effects of callback replacement remain unqualified. | Lifetime belongs to host + registration key, never callback identity. |
| Event data | Current gap. `onPress` is zero-argument; mobile/web pan assign `x/y = deltaX/deltaY`. The interface simultaneously calls those fields normalized positions. `locationX/Y` are AppKit-only optional fields. No shared contact identities/count. | Replace aliases with named position, translation, velocity, contact, and activation contracts. |
| [#164: zoom and pinch](https://github.com/octane-xplat/octane-xplat/issues/164) | Historical absence is resolved in source: `CameraSession.zoomState()/setZoom()`, preview pinch, and shared native pinch exist. Shared pinch is not synthesized on web/desktop; raw focal coordinates are not a portable coordinate contract. Mutual exclusion remains app-owned. | Reuse camera zoom controls; solve composition rather than invent another camera API. |
| [#230: Android pan then press](https://github.com/octane-xplat/octane-xplat/issues/230) | Baseline still binds native tap directly to `onPress`. Later fix `55e3a1c13` is absent from baseline ancestry. Opals records OS-input success at linked `38652eaa`, including the next independent tap. That is a locally fixed defect with narrow recorded qualification, not a universal outstanding defect or a published-support claim. | Carry the raw movement/slop insight into the common press participant; preserve the regression as acceptance evidence. |

Canonical implementation anchors: [pan native](../../packages/ui/src/components/layout/pan.tsrx), [pan web](../../packages/ui/src/components/layout/pan.web.tsrx), [pinch](../../packages/ui/src/components/layout/pinch.tsrx), [Pressable](../../packages/ui/src/components/actions/Pressable.tsrx), [props](../../packages/ui/src/props.ts), [scroll hook](../../packages/ui/src/components/layout/use-scrollable-area.tsrx), [camera session](../../packages/camera/src/session-core.ts), and [preview pinch](../../packages/camera/src/preview-pinch.ts). Existing [gesture guidance](../skills/octane-xplat/references/services/motion.md) documents current limits, not this proposed contract.

Opals evidence is read-only in `/Users/alec/dev/opals/.agents/docs/octane-xplat.md` and the named consumer files. Local investigation evidence is retained outside Git at `~/dev/reports/octane-xplat/gesture-system-evidence.md`. Do not treat its historical screenshot observations as evidence examined for this task.

## Core shape and ownership

Put the dependency-free coordinator and contracts in `packages/ui`; retain file-boundary adapters for each host. Register framework scroll viewports and semantic controls with the same root owner. Motion, sheets, drawer, lightbox, and camera should consume this core instead of creating independent competing input owners. A plugin-backed recognizer remains a leaf integration if future feasibility work proves one necessary; UI acquires no external dependency.

There are four distinct lifetimes:

| Entity | Owner and lifetime | Invariant |
| --- | --- | --- |
| Root interaction owner | Renderer root/window | No process-global input lock; portals require explicit same-window scope membership. |
| Registration | Mounted host + stable string key | Committed callbacks update in place; host replacement disposes registration. |
| Sequence/session | Root contact cohort / one recognizer activation | Every activation gets exactly one end or cancel. New pointers do not create a fresh sequence while any old pointer remains down. |
| Suspension lease | Scope hook owner until released/disposed | Multiple leases compose; releasing one never unlocks another owner's lock. |

The public surface consists of a keyed gesture hook, a scoped suspension hook, and richer semantic activation on Pressable. Components gain `gestures` and `interactionScope`; these attach behavior to the existing host and add no layout wrapper. Binding a recognizer unsupported by that host produces an explicit unsupported diagnostic and false support entry; it is not an implicit successful registration. Apps must retain alternate controls on unsupported targets. The following contracts are proposed TypeScript, not imports available today.

```ts
// Proposed exports from @octane-xplat/ui. Opaque brands omitted for readability.
// ReadSignal is abbreviated contract notation for Octane's branded read-only
// signal handle, not a new runtime or a proposed structural replacement type.
interface ReadSignal<T> {
  get(): T
  subscribe(listener: () => void): () => void
}
export interface Point { readonly x: number; readonly y: number }
export interface InteractionTarget { readonly id: string } // root-scoped host-lifetime identity, not a native view
export interface Positions {
  readonly local: Point | null
  readonly window: Point
  readonly screen: Point | null
}
export interface Contact {
  readonly id: string // unique within the sequence; stable through pointer-up
  readonly kind: 'touch' | 'mouse' | 'pen'
  readonly position: Positions
}
export type CancelReason =
  | 'system' | 'capture-lost' | 'superseded' | 'scope-suspended'
  | 'pointer-count' | 'disabled' | 'configuration-changed'
  | 'detached' | 'programmatic' | 'coordinate-space-lost'
export interface GestureSession {
  readonly id: string
  cancel(): void // synchronous, idempotent; programmatic reason
}
export interface GestureSample {
  readonly sequenceId: string
  readonly time: number // monotonic milliseconds; root clock
  readonly target: InteractionTarget // original registered hit host
  readonly currentTarget: InteractionTarget // attached gesture host
  readonly position: Positions // initiating point; centroid for multi-contact recognition
  readonly startPosition: Positions
  readonly contacts: readonly Contact[] // currently down, including new arrivals
  readonly pointerCount: number // contacts.length; zero at final lift
  readonly session: GestureSession
}
export interface PanSample extends GestureSample {
  readonly translation: Point
  readonly velocity: Point | null // logical units per second; null if unavailable
}
export interface PinchSample extends GestureSample {
  readonly scale: number // cumulative from two-contact baseline, initially 1
  readonly scaleVelocity: number | null // scale units/second
}
export type Terminal<T> =
  | { readonly outcome: 'ended'; readonly sample: T }
  | { readonly outcome: 'cancelled'; readonly sample: T; readonly reason: CancelReason }
export interface GestureCallbacks<T> {
  onStart?(sample: T): void
  onUpdate?(sample: T): void
  onEnd?(sample: T): void // success only
  onCancel?(sample: T, reason: CancelReason): void
  onFinalize?(terminal: Terminal<T>): void // always after end/cancel
}
export interface GestureEnablement {
  readonly enabled?: boolean // default true; committed prop updates
  readonly enabled$?: ReadSignal<boolean> // live, synchronous boolean source
  // Supplying both is a configuration error.
}
export interface PanDefinition extends GestureCallbacks<PanSample>, GestureEnablement {
  readonly kind: 'pan'
  readonly axis: 'x' | 'y' | 'both' // physical axes; app resolves logical direction
  readonly activation?: { readonly distance?: number; readonly dominance?: number }
  readonly pointers?: { readonly min?: number; readonly max?: number }
}
export interface PinchDefinition extends GestureCallbacks<PinchSample>, GestureEnablement {
  readonly kind: 'pinch'
}
export type GestureDefinition = PanDefinition | PinchDefinition
export interface GestureRelation {
  readonly kind: 'exclusive' | 'simultaneous'
  readonly keys: readonly string[]
}
export interface GestureBinding { readonly id: string }
export interface GestureSupport {
  readonly pan: boolean
  readonly pinch: boolean
  readonly suspendUserInput: boolean
  readonly stopMomentum: boolean
}
export interface GestureState {
  readonly phase: 'idle' | 'possible' | 'active' | 'failed' | 'ended' | 'cancelled'
  readonly sequenceId: string | null
  readonly cancelReason: CancelReason | null
}
export interface UseGesturesResult {
  readonly binding: GestureBinding
  readonly state$: ReadSignal<Readonly<Record<string, GestureState>>>
  readonly active$: ReadSignal<boolean> // any active recognizer on this binding
  readonly pointerCount$: ReadSignal<number> // observed cohort, not just claimed input
  readonly support$: ReadSignal<GestureSupport | null> // null before host attach
  readonly samples$: ReadSignal<Readonly<Record<string, PanSample | PinchSample>>> | null
}
export declare function useGestures$(options: {
  readonly definitions: Readonly<Record<string, GestureDefinition>>
  readonly relations?: readonly GestureRelation[]
  readonly samples?: 'none' | 'frame' | 'input' // default none
}): UseGesturesResult
export interface Suspension { release(): void }
export type SuspendResult =
  | { readonly ok: true; readonly lease: Suspension }
  | { readonly ok: false; readonly reason: 'unsupported' | 'detached' }
export interface InteractionScope {
  readonly suspended$: ReadSignal<boolean> // true while at least one lease exists
  suspend(): SuspendResult
}
export declare function useInteractionScope$(): InteractionScope
export interface ActivationEvent {
  readonly source: 'pointer' | 'keyboard' | 'accessibility' | 'virtual'
  readonly target: InteractionTarget
  readonly currentTarget: InteractionTarget
  readonly pointer: GestureSample | null
  preventDefault(): void // cancels default semantic action, not an active drag
}
// PressableProps.onPress becomes (event: ActivationEvent) => void.
// View/Row/Stack/StackItem/Pressable accept gestures?: GestureBinding.
// Layout hosts also accept interactionScope?: InteractionScope.
```

### Signals observe state; the coordinator owns input

Use Octane signals for hook outputs and selected live inputs, following the [upstream signal ownership and component-read contract](https://raw.githubusercontent.com/octanejs/octane/refs/heads/main/docs/signals.md). The proposed hooks are named `useGestures$` and `useInteractionScope$` because they return signal-backed results. All examples on this page use those names. The binding, result object, and signal handles remain stable for their hook instance; the coordinator alone writes the returned signals. Publish read-only Octane handles with their native branding intact, rather than introducing another subscription engine. Resolving the exact upstream read-only declaration type against the pinned runtime is an implementation gate; `ReadSignal<T>` above only abbreviates that shape.

```tsx
// Proposed API: read active state in a component, never write ownership flags.
import 'octane/signals'
import { useGestures$, View, Text } from '@octane-xplat/ui'

export function DragStatus() {
  const drag = useGestures$({ definitions: {
    panel: { kind: 'pan', axis: 'x' },
  } })
  const active = drag.active$.get()
  return <View gestures={drag.binding}>
    <Text>{active ? 'Dragging' : 'Ready'}</Text>
  </View>
}
```

State, aggregate activity, pointer count, support, and suspension status are low-volume reactive outputs. Each key starts idle, becomes possible when eligible to observe, and retains failed/ended/cancelled until the sequence ends; reset to idle when all contacts lift. A terminal phase may be observable only within the same synchronous dispatch before reset, so it is not a durable event log. State publication is coherent across keys and derived outputs: no reader should see active false paired with a newly active key from the same publication. The semantic pressed/hovered/focused hooks should follow the same read-only-state pattern when they adopt this owner; this proposal does not add new component families.

```ts
// Continuation: synchronous observations of the existing drag result.
const active = drag.active$.get()
const panelState = drag.state$.get().panel
const pointerCount = drag.pointerCount$.get()
const support = drag.support$.get()
const suspended = content.suspended$.get()
```

Live enablement accepts a ready, synchronous boolean signal. Subscribe after host attachment/commit, read the current value before admitting every input sample, and replace subscriptions only when the input handle changes. Setting false rejects possible recognition and cancels an active recognizer with `disabled`, without waiting for a render or effect. Enablement follows committed values: a pending renderer transition does not disable input until that value commits. Notification-driven cancellation occurs by the end of the outer synchronous signal batch; a later input sample checks the value even if no notification has arrived yet. Only the final value of a synchronous batch is observable through notification: false then true in one batch need not cancel if no input dispatch observed false. Use session.cancel() when cancellation itself is required. Re-enabling cannot restart a failed/cancelled key during the same contact sequence. Boolean `enabled` follows committed prop updates; thresholds, axes, and relations still snapshot at sequence admission. Supplying both enablement forms or an async/pending/error boolean source is an explicit configuration error, never a reason to suspend rendering or guess that recognition is enabled.

```tsx
// Proposed fragment inside a component. A parent may pass its ready boolean signal.
import { signal$ } from 'octane/signals'
import { useGestures$ } from '@octane-xplat/ui'

const dismissEnabled$ = signal$(true)
const capture = useGestures$({ definitions: {
  dismiss: { kind: 'pan', axis: 'y', enabled$: dismissEnabled$ },
} })
// In an ordinary event callback, this disables/cancels without a component render:
const disableDismiss = () => dismissEnabled$.set(false)
```

Continuous samples are opt-in. With `samples: 'none'`, return `samples$: null` and allocate no sample publication queue. Frame mode publishes one immutable keyed snapshot per host display frame, containing the latest active samples from the same coordinator snapshot; skipped intermediate movement is intentional. Input mode publishes a coherent snapshot per admitted input dispatch, for consumers that need every normalized sample. An opted-in signal initially holds an empty record, retains the final samples until the next sequence starts, and clears removed keys. It does not retain a history. Raw callback delivery is unchanged in all modes.

```ts
const drag = useGestures$({
  samples: 'frame',
  definitions: { media: { kind: 'pan', axis: 'both', onUpdate: moveMedia } },
})
const displayedSample = drag.samples$?.get().media
```

Start and terminal samples publish immediately even in frame mode. Discard pending older frame work before terminal publication; update internal ownership and signal values together before terminal callbacks, then notify reactive observers after the transition's callbacks finish. Every subsequent callback checks that its session is still active, so cancellation from onStart suppresses the obsolete onUpdate. The coordinator remains authoritative outside speculative renders; publish host-input state urgently so a renderer transition cannot delay cancellation or lease enforcement. Signal-subscriber errors must not prevent cleanup. Native rendering reads need their own runtime signals import, as shown above; reading a per-input sample in rendering may rerender on every publication. Neither frame mode nor signals alone promise compositor-driven motion. Use the existing direct motion path for precise drag writes and signals for consumers that benefit from reactive snapshots.

```ts
// Direct motion and reactive observation can coexist; neither establishes ownership.
const input = useGestures$({ samples: 'frame', definitions: {
  panel: { kind: 'pan', axis: 'x', onUpdate: movePanel,
    onEnd: finishPanel, onCancel: restorePanel },
} })
```

Claiming, cancellation, activation, and suspension remain synchronous commands/events. Do not acquire a suspension lease from an effect watching active state: a descendant may already have scrolled. Do not infer successful release from active becoming false: it could mean cancellation, and reactive scheduling may combine several transitions. Callbacks deliver start/end/cancel/finalize exactly once under the existing lifecycle rules. A scope's suspended signal changes only after a lease is actually acquired or released; writing a separate app signal never freezes scrolling. On disposal, cancel owned sessions before retiring signal ownership, cancel queued frame publications, detach enabled-source subscriptions, and reject stale publisher generations. Escaped handles do not extend the hook lifetime; use Octane's normal retired-owner behavior.

```ts
// Acquire synchronously from onStart, before moving the parent.
function startReveal(sample: PanSample) {
  const result = content.suspend()
  if (!result.ok) { sample.session.cancel(); return }
  retainLease(result.lease)
  movePanel(sample)
}
```

### Coordinates and payload invariants

All distances use CSS pixels on web and logical DIPs/points on native; positive x is right, positive y down. `window` means the content viewport of the owning window, excluding OS chrome; browser document scrolling does not change the coordinate origin. `screen` is optional OS-desktop position in logical units, not device pixels. Local positions are inverse-mapped into the attached host's current border box; they can change as that host transforms. `startPosition` records the down-time point for one-contact pan. For pinch and multi-contact pan it records the centroid when the required contact count first becomes available. Multi-contact pan translation starts at that baseline; the frozen axis basis still belongs to sequence admission. Dropping below the required minimum by a normal lift ends active recognition; exceeding the maximum cancels it. IDs of surviving contacts never change. Neither position is clamped to bounds.

Translation and velocity use the attached host's axes frozen at sequence admission. Compute them from window-space movement through that frozen basis, independent of the host following the finger; never subtract current local coordinates. This directly avoids Android's moving-view tap-slop failure. A singular initial transform rejects recognition; losing the required mapping during active input cancels with `coordinate-space-lost`. Unknown screen positions and velocities stay null; no fake center or zero-speed claims. A host can report a null current local position when it cannot invert the transform, before terminal cancellation. Terminal samples preserve the last measured point even after contacts becomes empty.

```ts
// Proposed handler fragment: drag uses translation; hit-dependent policy uses position.
function inspect(sample: PanSample) {
  const fingerInMedia = sample.position.local
  return { fingerInMedia, movement: sample.translation, speed: sample.velocity }
}
```

`target` and `currentTarget` remain stable through capture, transforms, and bubbling. They expose identity, not mutable native objects. Original text fragments map to their registered semantic host. Apps needing imperative host work retain their own typed refs. Contact IDs are scoped to one sequence, not reusable global pointer IDs. Adding or removing a contact emits an update even without movement; the maximum-pointer rule is evaluated first. Recognition never uses event-delivery order as a substitute for pointer identity.

```ts
function sameContact(sample: GestureSample, id: string) {
  return sample.contacts.find(contact => contact.id === id)
}
```

### Activation and arbitration

Internal states are `idle → possible → active → ended/cancelled → idle`. A possible recognizer can instead fail silently and remain excluded until the sequence ends. `onStart` means the owner has successfully claimed input; it is not pointerdown. No start means no end/cancel/finalize callback. For immediate observation, Pressable's existing press-in/out lifecycle gains the same optional pointer sample; observation never claims input. Framework state records press eligibility separately from pan activation.

```ts
const panel = useGestures$({ definitions: {
  reveal: { kind: 'pan', axis: 'x', activation: { distance: 8, dominance: 1.2 },
    onStart: sample => console.log('claimed', sample.sequenceId) },
} })
```

Defaults: pan has exactly one contact, 8 logical-unit activation distance, and 1.2 axis dominance for x/y. Both-axis pan uses radial distance. Axis candidates remain possible while intent is ambiguous; crossing the opposite-axis threshold with dominance fails that candidate for the sequence. Native adapters must evaluate the initial nonzero displacement before emitting start. The first start/update includes movement already accumulated; it is never silently reset at native recognition. Moving a control beneath the finger cannot turn a drag back into a press.

```ts
const freeDrag = useGestures$({ definitions: {
  drag: { kind: 'pan', axis: 'both', pointers: { min: 1, max: 1 } },
} })
```

Default competing gestures are exclusive, including descendant press and native scroll on the claimed axis. Deepest eligible host wins simultaneous activation ties; on the same host, lexical key order breaks ties, so object allocation/order cannot change behavior. An explicit exclusive relation's listed order replaces this tie order. Simultaneous recognition is opt-in for listed keys on the same binding; it never resurrects a cancelled press or overrides system ownership. Contradictory relations, duplicate membership in exclusive priority groups, unknown keys, and cycles are configuration errors before contacts begin. Cross-host arbitrary wait graphs are deliberately deferred; built-in nested ownership handles the examples here without an app-managed arena.

```ts
const transform = useGestures$({
  definitions: {
    move: { kind: 'pan', axis: 'both', pointers: { min: 2, max: 2 } },
    zoom: { kind: 'pinch' },
  },
  relations: [{ kind: 'simultaneous', keys: ['move', 'zoom'] }],
})
```

A second contact immediately invalidates an exact-one-contact pan and cancels it with `pointer-count`. Pinch starts from two contacts, activates after 4 logical units of span change, and uses cumulative scale from that two-contact baseline. Pinch may become eligible in the ongoing sequence even after pan cancellation. It ends when fewer than two remain; remaining fingers cannot restart pan or press until all lift. A third contact cancels pinch in this first design, avoiding centroid/scale jumps. A later design can add explicit rebaselining; it must not happen silently.

```ts
const capture = useGestures$({
  definitions: { zoom: { kind: 'pinch' }, dismiss: { kind: 'pan', axis: 'y' } },
  relations: [{ kind: 'exclusive', keys: ['zoom', 'dismiss'] }],
})
```

### Callback updates, cancellation, and cleanup

One binding and one scope each attach to one host; duplicate attachment is a configuration error. Same host/key/kind means the same registration even if options objects and callbacks are newly allocated each render. Publish callback updates after commit, atomically, without rebinding native observers. Thresholds/axis/relations are snapshotted at sequence admission; configuration edits take effect on the next sequence. Removing a key, changing its kind, disabling, detaching, or moving between roots cancels active work immediately; the removed registration's last committed callbacks receive its terminal event before cleanup. Stable callback delivery covers pinch and press too.

```ts
// Ordinary rerenders may replace this closure without replacing its recognizer.
const drag = useGestures$({ definitions: {
  panel: { kind: 'pan', axis: 'x', onUpdate: sample => setPanelX(sample.translation.x) },
} })
```

Clear active ownership before calling terminal callbacks, so cancellation and unmount can reenter safely. Deliver one terminal outcome; finalization runs even if end/cancel throws, then errors go through the renderer's error boundary. Capture loss, system takeover, app interruption, and scope suspension are cancellation, never successful release. Cleanup releases only owned capture/observers/trackers/leases, restores the latest authored state, and cannot write to an obsolete host. A claimed sequence remains ineligible for trailing press even if it later cancels.

```ts
function recover(sample: PanSample) {
  sample.session.cancel() // repeated calls, including from finalization, are harmless
}
```

## Scrolling and taking over content

Framework scroll viewports register their axis policy before input, including each nested Mason viewport. The coordinator resolves horizontal pan versus vertical scrolling before either claims. Once vertical scrolling has won, an app pan cannot retroactively steal that browser sequence by changing touch-action. Managed x-pan reserves horizontal manipulation and allows vertical browser scrolling; y-pan does the inverse. Both-axis pan or contact pinch reserves both axes on that surface before down. Preserve browser page zoom elsewhere and provide accessible zoom controls for custom pinch surfaces. Applications requiring both axes for a custom viewer must reserve them before down; ordinary scrolling retains browser zoom and scrolling behavior. App-authored contradictory touch-action on a managed surface gets a development diagnostic.

The distinction is required by [Pointer Events' direct-manipulation rules](https://www.w3.org/TR/pointerevents3/#determining-supported-direct-manipulation-behavior): touch-action participates before gesture handling, and changes during an active gesture cannot be assumed to alter that gesture. Pointer capture routes events; it does not itself establish exclusivity with browser scrolling.

```tsx
// Proposed API; scope reaches the actual registered scroll viewport through the component.
<View interactionScope={content}>
  <ScrollableArea axis="block">{messages}</ScrollableArea>
</View>
```

`suspend()` synchronously cancels active descendant custom gestures and presses, stops user-driven scrolling/deceleration and an already-running scroll tween at their current offsets, and rejects new user scrolling (touch, wheel, keyboard and accessibility scroll actions) and activation until released. It does not change overflow, layout, content size, or programmatic scrolling. An explicit programmatic scroll issued after suspension may move content; release keeps that new offset and never restarts old momentum. Content shrink may clamp offsets normally. The method returns success only after the adapter can enforce the whole contract; unsupported/detached returns no lease and makes no partial changes. Successful repeated calls create independent leases, not saved boolean snapshots.

```ts
const result = content.suspend()
if (result.ok) {
  // Safe to move the parent now. Keep this lease until the panel has closed.
  const lease = result.lease
  lease.release()
}
```

Scope membership follows framework ownership and explicit portal propagation within one window. New registered descendants inherit suspension before becoming interactive. Opaque native/embedded boundaries must declare adapter coverage at mount; a scope with unknown coverage cannot successfully suspend. Reparenting leaves and enters scopes atomically. An unmounting scope releases its leases; a caller may release an already-disposed lease safely. Suspended content is unavailable to semantic activation and focus traversal; move focus to the active panel using overlay/focus ownership, and restore it when closing. A suspension is not itself a dialog or focus trap. Scroll-only freezing, if later needed, should be a separate contract rather than a misleading all-input mode.

```tsx
// Keep the owner and the close target outside the content being suspended.
<View gestures={panel.binding}>
  <View interactionScope={content}>{children}</View>
  <Pressable onPress={closePanel}><Text>Close panel</Text></Pressable>
</View>
```

Native feasibility is a gate, not a guarantee: UIKit and Mason must stop recognizers and momentum in the correct order without hidden-overflow writes. Public input suspension may require a Mason/native driver seam; recorded app containment does not establish a shipping setter. Browser kinetic-scroll interruption must be proved separately in each engine, without rebuilding layout or disabling browser zoom globally. If an adapter cannot stop already-owned system input, support must report false and suspend must fail; do not promise a universal synchronous takeover. Supported framework-managed viewports are the initial boundary. Foreign embedded WebViews, OS navigation gestures, and third-party native controls require registered adapters; opaque surfaces must cause unsupported coverage rather than silently passing the lease.

## Four consumer examples

These are proposed TSX sketches with app callbacks passed as props. The names are illustrative API contracts, not copyable current-release code. Layout, animation, and destination policy remain in the app.

### Nested controls in a draggable panel

Below-threshold motion preserves the nested button's press. A claimed drag cancels only that sequence's press eligibility. Keyboard and assistive activation still run without inventing a contact location.

```tsx
import { useGestures$, View, Pressable, Text } from '@octane-xplat/ui'
import type { PanSample, ActivationEvent } from '@octane-xplat/ui'

export function Panel(props: {
  move(sample: PanSample): void
  release(sample: PanSample): void
  restore(): void
  search(event: ActivationEvent): void
}) {
  const drag = useGestures$({ definitions: {
    panel: { kind: 'pan', axis: 'x', onUpdate: props.move,
      onEnd: props.release, onCancel: props.restore },
  } })
  return <View gestures={drag.binding}>
    <Pressable onPress={props.search}><Text>Search</Text></Pressable>
  </View>
}
```

### Horizontal reveal beside vertical scrolling

The pan owner sits outside the suspended content. Acquire the lease on claim before moving; retain it while the panel is open, release after closing settles. A failed acquisition cancels the reveal and leaves content usable. The scope owns cleanup on unmount; the app only owns the panel's open/close lifecycle. Managed viewport policy replaces app `chatScrollLockStyle` declarations.

```tsx
import { useRef } from 'octane'
import { useGestures$, useInteractionScope$, View, ScrollableArea, Pressable, Text } from '@octane-xplat/ui'
import type { PanSample, Suspension } from '@octane-xplat/ui'

export function Reveal(props: {
  move(sample: PanSample): void
  settle(sample: PanSample): Promise<'open' | 'closed'>
  close(): Promise<void>
  children?: unknown
}) {
  const content = useInteractionScope$()
  const lease = useRef<Suspension | null>(null)
  const unlock = () => { lease.current?.release(); lease.current = null }
  const close = async () => { await props.close(); unlock() }
  const reveal = useGestures$({ definitions: {
    reveal: { kind: 'pan', axis: 'x',
      activation: { distance: 8, dominance: 1.2 },
      onStart: sample => {
        if (lease.current) return
        const result = content.suspend()
        if (!result.ok) { sample.session.cancel(); return }
        lease.current = result.lease
        props.move(sample)
      },
      onUpdate: sample => { if (lease.current) props.move(sample) },
      onEnd: sample => { void props.settle(sample).then(state => {
        if (state === 'closed') unlock()
      }) },
      onCancel: () => { void close() },
    },
  } })
  return <View gestures={reveal.binding}>
    <View interactionScope={content}>
      <ScrollableArea axis="block">{props.children}</ScrollableArea>
    </View>
    <Pressable onPress={() => { void close() }}><Text>Close panel</Text></Pressable>
  </View>
}
```

Production app transitions must also handle rejected animations and superseded settles with their own transition generation/owner; this example assumes those passed callbacks settle reliably and serialize closes. Suspension leases must not become animation completion flags. This replaces the recursive UIKit/Mason walker and its saved flags, not the app's animation state machine.

### Pinch competing with dismiss-pan

A second contact cancels dismiss-pan even before pinch's span threshold. Lifting one finger never rearms dismissal during that sequence. Reusing `zoomState()/setZoom()` removes the raw NativeScript touch listener, synthetic cancelled PanEvent, and sticky `blockPan` flag. Camera availability and zoom clamping remain camera-owned.

```tsx
import { useRef } from 'octane'
import { useGestures$, View } from '@octane-xplat/ui'
import type { PanSample } from '@octane-xplat/ui'
import type { CameraSession } from '@octane-xplat/camera'

export function Capture(props: {
  session: CameraSession
  move(sample: PanSample): void
  release(sample: PanSample): void
  restore(): void
  children?: unknown
}) {
  const baseline = useRef<number | null>(null)
  const input = useGestures$({
    definitions: {
      zoom: { kind: 'pinch',
        onStart: sample => {
          baseline.current = props.session.zoomState()?.zoom ?? null
          if (baseline.current === null) sample.session.cancel()
        },
        onUpdate: sample => {
          if (baseline.current !== null) props.session.setZoom(baseline.current * sample.scale)
        },
        onFinalize: () => { baseline.current = null },
      },
      dismiss: { kind: 'pan', axis: 'y', onUpdate: props.move,
        onEnd: props.release, onCancel: props.restore },
    },
    relations: [{ kind: 'exclusive', keys: ['zoom', 'dismiss'] }],
  })
  return <View gestures={input.binding}>{props.children}</View>
}
```

Changing camera/lens or removing the capture surface must cancel its active registration, or the app explicitly cancels its retained session before switching. A camera preview's built-in notification pinch cannot run as a second independent zoom owner: the migration removes that callback where the outer composed surface owns zoom.

### Interruptible media-viewer drag

`onStart` arrives at claim with the original contact position and full displacement. Stop the current animation there, read its current displayed pose, and apply the full displacement once. No pointerdown work should change product state. The viewer model below owns the grab geometry and maps the original window point into its media frame; it receives a cancellation path separate from a successful release.

```tsx
import { useRef } from 'octane'
import { useGestures$, View } from '@octane-xplat/ui'
import type { PanSample, ActivationEvent } from '@octane-xplat/ui'

interface ViewerDrag {
  begin(sample: PanSample): void // stop animation; snapshot pose and original grab point
  update(sample: PanSample): void
  release(sample: PanSample): void // app dismissal threshold / destination
  recover(): void
}
export function Viewer(props: { model: ViewerDrag; tap(event: ActivationEvent): void }) {
  const running = useRef(false)
  const input = useGestures$({ definitions: {
    media: { kind: 'pan', axis: 'both',
      onStart: sample => {
        props.model.begin(sample)
        running.current = true
        props.model.update(sample)
      },
      onUpdate: sample => { if (running.current) props.model.update(sample) },
      onEnd: props.model.release,
      onCancel: () => props.model.recover(),
      onFinalize: () => { running.current = false },
    },
  } })
  return <View gestures={input.binding} />
}
```

For an actual tappable viewer, put its semantic Pressable inside this host and pass `props.tap` to its onPress. Pointer activation carries a position; keyboard/accessibility activation has `pointer: null`. The app chooses an accessible default action without fake center coordinates. Immediate first tap and second tap within 300ms remain an app timer/state rule; do not use delayed framework double-press arbitration for that requirement.

```tsx
// Continuation inside View gestures={input.binding}:
<Pressable onPress={props.tap} accessibilityLabel="Toggle playback">
  {media}
</Pressable>
```

## Platform adapters and accessibility

| Host | Adapter responsibility | Unproven boundary / release gate |
| --- | --- | --- |
| Web | Pointer Events with document-level observation until claim, deferred capture, contact cohort, managed touch-action at actual scroll viewports, semantic click bridge | Chromium, Firefox, WebKit kinetic interruption and trusted trailing-click provenance. Touchscreen OS input separately from mouse/browser automation. |
| iOS | Coordinator-aware recognizer delegates/failure relationships and Mason viewport policy before recognition; stop native/Mason deceleration; stable targets | Existing NativeScript simultaneous defaults are not arbitration. Own or compose delegates without clobbering OS controls/navigation. Physical multi-touch and offset preservation need proof. |
| Android | Raw/window movement independent of moving local view, pointer IDs, system slop for press eligibility, scroll interception/cancel, velocity density conversion | Reuse the linked Pressable fix's insight; never suppress press solely because Android emitted pan began. Verify cancellation delivery through Mason and native controls. |
| macOS | AppKit recognizer/scroll-wheel participant; normalize host coordinates and magnification separately | Trackpad magnification need not expose touch contacts; do not fabricate two fingers. Defer trackpad pinch until an explicit non-contact gesture contract is designed. |
| Linux / Windows | Adapt existing pointer owner, cancellation and scroll events; preserve lifetime contract | Existing pointer support does not establish pinch or suspension. Expose capability results and an explicit documented subset, never silent no-op support. |

On web, correlate only the claimed sequence's compatibility click with its original contact and dispatch origin. Expire that eligibility record at the next independent down and handle keyboard/virtual activation through the semantic bridge. A global boolean that consumes the next click is insufficient. On native, Pressable owns contact eligibility and semantic accessibility activation separately; raw Mason tap observers may still fire without activating the shared control. Keep native system slop for press jitter, separate from the configurable pan threshold; losing press eligibility does not require a pan winner.

```tsx
// Semantic activation needs no drag/pointer fabrication.
<Pressable onPress={event => {
  if (event.pointer === null) togglePlayback()
  else activateAt(event.pointer.position.local)
}} accessibilityLabel="Toggle playback" />
```

Preserve Enter/Space behavior, disabled state, focus, screen-reader action, and exactly-once press-out for a previously entered press. Drag must have a non-gesture route for the same important action: Close, Open panel, zoom controls, seek controls, or keyboard commands as appropriate. Raw onPan/onSwipe must not become the only accessible command surface. Suspension intentionally gates descendant keyboard/accessibility actions; ordinary drag claiming gates only pointer activation from that sequence.

## Compatibility and migration

Recommend an alpha hard cutover after qualification, with no parallel legacy recognizer path or compatibility aliases. Preserve familiar `onPan` and `onPinch` as simple conveniences backed by the new owner, using the new sample/terminal contract rather than legacy `state` unions. `gestures` is required for options/composition. Disallow convenience handlers and keyed definitions of the same kind on the same host; report configuration errors rather than recognizing twice.

```ts
// Proposed convenience callback contract: phase is explicit, cancellation has a reason.
export type GestureNotification<T> =
  | { phase: 'start' | 'update'; sample: T }
  | { phase: 'finish'; terminal: Terminal<T> }
// onPan?: (event: GestureNotification<PanSample>) => void
// onPinch?: (event: GestureNotification<PinchSample>) => void
```

| Current consumer | Cutover |
| --- | --- |
| `state === 'began'` | Use start only for claimed work; use press lifecycle for observation. |
| `dx/dy`, `vx/vy` | Use translation and nullable velocity. Audit terminal-only product actions. |
| `x/y`, `locationX/Y`, raw pinch focus | Choose position.local/window/screen explicitly; never silently reinterpret aliases. |
| zero-argument `onPress` | Existing `() => …` callbacks still assign; add ActivationEvent where positions are required. |
| `onSwipe` native direction bitmask | Remove. Derive swipe intent from successful pan release and app thresholds. Do not preserve an independent competing recognizer. |
| raw native pinch / synthetic pan cancel | Use keyed pinch/pan composition. |
| `useEffectEvent` solely for recognizer stability | Remove workaround after lifetime qualification. Keep it for unrelated manual subscriptions if needed. |
| `lockChatInput` + touch-action leaves | Replace with managed viewport policy and a suspension lease after adapter qualification. |

No release claim follows from accepting this document. The cutover needs a breaking Conventional Commit, user-facing release note with usage and official guide links, public gesture guide and TSDoc, maintained examples/recipes, and synchronized Octane skill guidance. Opals migration is a separate authorized task; its ten-second/300ms/media policies remain intact. Existing current-release guidance stays unchanged by this proposal.

## Staged delivery and validation gates

1. **Prove ownership feasibility first.** Build a temporary probe for horizontal parent over vertical Mason/browser scrolling and a nested button. Prove pre-recognition intent and synchronous suspension at offset 600 during an already-held gesture and during deceleration. Test unsupported foreign surfaces. Do not freeze a public suspension promise until adapters prove it.
2. **Land lifetime, payload, and signal core.** Stable host/key registrations, atomic committed handlers, sequence/contact identity, named coordinates, end/cancel separation, read-only state/support signals, and live boolean enablement. Prove urgent publication and branded handle/compiler ownership on web and native. Add optional frame/input sample publication without routing ownership through reactive effects. Adopt recorded press fixes without misrepresenting their published availability. Keep work behind an internal harness until the cutover; no public migration shim.
3. **Integrate scrolling and semantic presses.** All framework scroll owners and Pressable use the coordinator. Exercise scope membership, portal policy, reparenting, overlapping leases, unmount and callback reentrancy. Move Motion, sheets and leaf consumers off competing recognizers.
4. **Add pinch and composition.** Web/iOS first, then macOS feasibility; Android must also pass before mobile support is advertised. Validate second-finger cancellation, sticky exclusion until all up, and explicit simultaneous recognition. Trackpad gestures and arbitrary cross-host wait graphs remain separate decisions.
5. **Cut over public API and migrate examples.** Reconcile recipes, docs, TSDoc, skill and release notes in one breaking release; separately test linked-source and packed consumers. Remove replaced code after every participant has one owner.

Validation is a matrix of distinct evidence levels, not one green suite:

| Evidence | Required assertions | What it cannot prove |
| --- | --- | --- |
| Pure state-machine tests | Deterministic ties, invalid relations, contact IDs, active→one terminal, pointer-count transitions, lease overlap, callback-update snapshots, reentrancy, coherent signal snapshots, enable-source changes, frame coalescing and no stale terminal overwrite | Recognizer behavior or hit testing |
| Mounted handler/adapter tests | Latest committed handler, no observer churn, units and transforms, native cancellation mapping, density, independent signal cells for two hook instances, native render subscriptions, disposal, no resource leaks | Real presses, scrolling, pinch delivery |
| Recognizer integration | Native recognizer identity/count across self-triggered render; actual delegate/failure relationship; cancel reaching scroll driver; no running decelerator after lease | End-to-end app composition unless driven by real input |
| Browser engine input | Real mouse click on nested button; 7px jitter vs threshold; horizontal claim vs vertical scroll; held direction turn; pointer leaving host; capture loss; keyboard/virtual click after cancelled drag | Touchscreen behavior from mouse alone; dispatchEvent is not equivalent |
| OS input composition | Android 80px/800ms moving-header drag retains draft and next tap closes; iOS offset 600 held horizontal→vertical, close then vertical scroll; two-finger pinch→one-finger tail; interruption/background/unmount; pan regrab during animation | Hardware camera magnification or performance on untested devices |
| Packed consumer | Same cases with exact tarballs/native binaries, no linked checkout or private setter | Other release artifacts/targets |

For scroll acceptance, capture nonvisual telemetry at down, claim, held direction turn, release and close: sequence/session IDs, recognizer state, offset, transform, press count, momentum state, and timestamps. Compare freeze offsets within a declared sub-logical-unit tolerance; require positive normal-scroll movement before and after suspension. Include horizontal and nested viewports, flings, wheel/keyboard scrolling, content resize, programmatic scroll during lock, and descendants mounted while locked. Hold phases are essential: checking only release misses ongoing movement.

For coordinates, move/scale the host beneath a stationary finger and move the finger over a stationary host. Assert local point changes appropriately, translation follows frozen window motion, and initial displacement is preserved. Cover nonzero began, rotated transforms, singular matrices, pointer-up counts, stable targets through capture, stale velocity, and Android display density. For signals, assert lifecycle callbacks still deliver when start and finish occur in one batch, disable during start/update/batched writes, and disable then re-enable while fingers remain down. Cancel a queued frame just before terminal delivery and unmount; verify it cannot overwrite terminal state or write after disposal. Test read-only outputs, stable handles through self-triggered rerenders, subscription replacement after committed input-handle changes, and ordinary semantic activation with signal-backed enablement. Signal-only changes to touch-action reservation take effect for future contacts; they cannot reclaim a sequence already owned by the browser. For press, exercise jitter, cancelled drag with no following compatibility click, a fresh independent press, keyboard activation, and screen-reader activation. Never infer accessibility support from raw tap dispatch.

Future probes use the repository probe workflow and maintained tests through Turbo. Browser engines/device tests stay out of lightweight PR CI. Existing devices only: iOS `91D40099-A056-497D-A572-ADDDFD6A8F23`; Android `elegant-fir-probe`, no cloning/parallel workers. Reserve native build/device resources, shut down owned devices, and use textual state/log evidence only. Multi-touch input tooling must support actual concurrent contacts; two sequential swipes are not pinch. If unavailable, mark that gate unverified rather than substitute handler dispatch. No devices, screenshots, or OS input were used for this design task.

## Consequential review decisions

| Decision | Recommendation and tradeoff |
| --- | --- |
| Evolve callback plumbing or add owner? | Add owner beneath existing components. More framework coordination, far less repeated app arbitration. |
| Full suspension promise on every host? | Capability-gated, all-or-nothing scoped suspension; no silent best effort. Browser momentum and foreign hosts may limit initial availability. |
| Native gesture engine | Prove adapters over current engines before adopting a plugin. A new external lifecycle belongs in a leaf, and cannot solve browser ownership alone. |
| Recognition defaults | 8 logical units and 1.2 axis dominance for pan; system press slop; 4-unit span for pinch. These are recommended starting defaults, subject to real-input feel/accessibility qualification, not universal usability facts. |
| Nested-control policy | Observe across controls, claim only after intent; editable/native manipulation participants have priority unless an explicit dedicated drag handle owns the hit area. This preserves selection and sliders, at the cost of requiring handles for some whole-panel drags. |
| Multi-touch after pan | Cancel exact-one pan immediately and forbid resumption until all lift. Safer for camera dismissal; continuous one→two→one transforms require a future explicit rebase policy. |
| Cross-host arbitrary composition | Defer wait/failure graphs in public API. Same-binding relations and built-in nesting cover the identified needs without cyclic app graphs. |
| Reactive gesture API | Read-only hook-owned Octane signals for state; optional frame/input samples; live boolean enablement. More reactive integration, with explicit cadence and lifetime rules. Ownership and terminal actions stay synchronous. |
| Alpha compatibility | Hard cutover, keep component names and semantic press, remove translation aliases and independent swipe recognizers. Larger one-time migration, one coherent long-term contract. |

Put simply: let apps choose what a gesture does. Let the framework own who receives it, when it wins, and how it stops.

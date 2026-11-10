# Mobile Drawer ownership

`@octane-xplat/drawer` owns the navigation panel. UI must not import or re-export this leaf. The mobile implementation composes Mason views, shared semantic backdrop activation, and a one-contact pan attached through UI's internal gesture-input subpath. It no longer imports ui-drawer, calls install(), or requires gesturehandler. Other features/harnesses can still own those dependencies independently.

```tsx
import { Drawer } from '@octane-xplat/drawer'

<Drawer open={open} onOpenChange={setOpen} main={mainContent} drawer={navigationContent} />
```

## Input and presentation boundary

The common coordinator owns admission, native-control priority, claim, press cancellation, contact identity and terminal delivery. The leaf supplies physical-left edge eligibility (40 logical units), signed horizontal intent and destination policy. The default threshold is 10 logical units with 1.2 horizontal dominance. Like other shared horizontal pan hosts, the enabled Drawer reserves horizontal input across its subtree before OS recognition; vertical scroll remains available. Region admission prevents Drawer activation outside the edge, but does not provide region-specific native horizontal scroll policy. Use isGestureEnabled=false around flows that require native horizontal scrolling beneath a closed Drawer. A cancelled one-pointer pan stays excluded until every finger lifts. This is not full descendant input suspension or a claim to stop arbitrary scroll momentum.

A stable root host supplies frozen translation coordinates. Do not attach recognition to the moving panel or derive translation from its current local point. UI's internal leaf admission contract selects host coordinates; Motion keeps its existing parent-coordinate basis. Rebuilt callbacks/renderer commits must preserve the active contact registration.

The leaf owns measured width, revealed distance, clipping, backdrop and visible-state requests. A single UI scalar animation timeline writes eased panel/backdrop progress over 200ms (zero with reduced motion). No independent native animation may overwrite these properties. Stop reads the latest value already written; generations invalidate stale completion/error callbacks. Programmatic commands replace pending motion without callback echoes. User settlement notifies once; controlled state may accept in a queued render or restore the accepted endpoint. Cancellation restores accepted state without a dismissal request.

```tsx
<Drawer reducedMotion isGestureEnabled={false} main={mainContent} drawer={navigationContent} />
```

Native load/unload creates/disposes the input and presentation binding. Detachment cancels started input once and releases reservations/observers; later frames cannot write to retired hosts. Background accessibility isolation is restored to its original native flags. Android Back and the backdrop use the same dismissal controller. Visible semantic open/close controls remain required.

## Alpha host migration

The native host is no longer a PluginDrawer instance. Plugin imperative methods and plugin-specific ios/android bag settings are removed, with no compatibility alias. The leaf rejects engine-owned bag properties and function-valued native overrides rather than letting them bypass shared ownership. Ordinary host attributes and shared props remain. Root ids remain on the native host; internal main/panel/backdrop ids derive from a supplied root id for nonvisual test queries. Do not depend on plugin-private slot or recognizer fields.

```tsx
<>
  <Button label="Open navigation" onPress={() => setOpen(true)} />
  <Drawer open={open} onOpenChange={setOpen} width={320} main={mainContent} drawer={navigationContent} />
</>
```

The public leaf and export conditions stay stable; web/desktop retain their existing explicit-control subset. Npm dependency resolution no longer adds a Drawer-origin mobile plugin chain for web-only consumers. A host may still install gesturehandler for another feature, so test package costs with a minimal consumer rather than assuming it disappears from a whole app. NativeScript renderer/core peers and one Octane runtime remain required.

## Qualification boundaries

The maintained controller tests cover geometry readiness, controlled/uncontrolled requests, latest commands, regrab progress, stale settles, cancellation, errors and disposal. Common-owner tests cover edge/sign rejection before claim and sticky exclusion after extra pointers. Handler/adapter tests are separate from OS input; packed declarations/bundles are separate from installed native runtime.

Use `packages/drawer/tests/fixtures/drawer-input.tsrx` with real OS input and textual telemetry for edge open, nested-button close drag and fresh tap. Retain run evidence in local reports and Silo. No native gesture, scrolling or accessibility claim follows merely from a host mounting or a synthetic Back event.

Broader qualification obligations include held-contact scroll direction changes and momentum, system-edge navigation precedence, concurrent pinch, native editing/slider priority, resize/safe areas, OS reduced-motion and VoiceOver/TalkBack focus navigation. The maintained fixture covers scrolling before and after Drawer gestures; this does not prove all native input compositions. Physical left remains the contract; RTL logical-edge support is not claimed. Web Escape/focus wrapping/return focus remain distinct from native accessibility behavior. UI BottomSheet's private grabber pan and platform-authentic sheet presenters are unchanged.

The source investigation and alternatives are preserved in `~/dev/reports/octane-xplat/drawer-ownership-source-evidence-plaid-basalt.md` and the reviewed plan under `~/dev/plans/octane-xplat/`. The pinned ui-drawer 0.1.32 exposed useful layout/commands but lacked coherent public admission, continuous progress and animation interruption; this replacement reuses the common owner rather than maintaining another recognizer adapter.

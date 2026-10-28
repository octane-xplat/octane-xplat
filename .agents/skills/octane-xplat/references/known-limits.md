# Limits and evidence

Before promising behavior, read the relevant entries in the
[public known limits](../../../../docs/testing/known-limits.md) and the feature's
guide. That page owns consumer-facing support boundaries; do not treat this
skill as a duplicate support matrix. Match guidance to the installed package
version and check each entry's evidence/version stamp.

A typechecked export or successful build proves a different claim from a
running platform assertion. Object-driver tests do not establish OS input,
hit-testing, accessibility, or pixel parity. Follow [testing](testing.md) when
choosing checks and report only the targets actually run.

For a boundary or workaround investigation, read the applicable internal record:

- [Portal ownership](../../../docs/notes/portal-boundaries.md): independent-root
  fallbacks, platform exceptions, owner lifetime, and qualified fixtures.
- [Mason cutover](../../../docs/notes/masonkit-layout-evaluation.md): native
  layout implementation, migration boundaries, and remaining qualification gaps.
  Check the native artifact revision: a source fix reaches an app only after
  rebuilt artifacts are adopted. The [shared FontManager correction](../../../docs/notes/masonkit-layout-evaluation.md#shared-fontmanager-in-core-beta3)
  replaces core beta.2's conflicting iOS font packaging. Follow the
  [managed plugin and rebuild guidance](toolchain.md) when updating an app.
  Core beta.4 regressed Android nested-root shrinking; beta.5 corrects it.
  The [beta.5 qualification](../../../docs/notes/masonkit-layout-evaluation.md#nested-roots-and-ios-measurement)
  distinguishes the passing height/Android-width cases from an unresolved iOS
  inner-stage width report. Do not infer width parity from height checks.
- [AppKit verification](../../../docs/appkit-verification.md): geometry and
  lifecycle evidence, including CSS positioned edges after the layout cutover.
- [GTK UI parity](../../../docs/notes/linux-gtk-ui-parity.md): every native root export, source candidates versus runtime evidence, current work order and the task-local MasonCore build prerequisite. Follow the curated GTK barrel; a successful bundle does not qualify an omitted component.
- [Upstream limitations](../../../docs/upstream-limitations.md): how to verify
  and record upstream scope and local workarounds.
- [NativeScript runtimes: V8 without ICU](../../../docs/notes/nativescript-no-icu.md):
  NativeScript iOS/Android V8 lacks ICU — no built-in `Intl`, no `\p{…}` regexes (a
  literal fails its whole module at parse time), no normalization. Lingui,
  RollingText and internal Motion text segmentation initialize their own required
  Intl APIs on mobile; UI remains optional. See [leaf ownership](services/localization.md#leaf-owned-intl-initialization).

Uncharacterized lab flakes belong with their investigation records and Silo,
not in an undated skill list. A historical failure is not automatically a
current limitation, and a fixed fixture is not blanket platform qualification.

## Install the experimental Linux GTK renderer

After its first stable automated release, npm consumers install the optional renderer
at the same Xplat release. The `0.0.1` bootstrap stub is not usable. No Mason
binary ships: the default warns and uses approximate Gtk.Box layout; native
Mason needs a separately pinned host build. Use the [GTK guide](../../../../docs/platform/linux-gtk.md)
and [native setup](../../../../packages/linux-gtk-renderer/README.md#optional-native-layout).
Do not treat publication or AT-SPI names as production qualification.

```sh
bun add -D @octane-xplat/linux-gtk
bun run xplat workshop doctor
### GTK keyboard actions

Give a GTK Pressable accessibilityRole="button" for Return/Space activation, or
"link" for Return. A neutral gesture view adds no focus stop. Disabled controls
use native sensitivity; focus loss cancels held-key activation. Changing the
role replaces the native widget through the core's host recreation protocol;
keep refs current and do not retain a native widget across a role change. Child
widgets and their logical owners are retained. Other semantic roles and AT-client
behavior remain unqualified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'

export function SaveAction(props: { disabled: boolean; save: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Save" disabled={props.disabled} onPress={props.save}>
      <Text>Save</Text>
    </Pressable>
  )
}
```

### GTK text input

Use TextInput from the curated GTK root. Its controlled value, native handle,
clear/help/status affordances and retained editor have maintained Linux checks.
Keep width on the outer field owner and use the GTK status-variant policy
for hover/focus tooltips. Field and TextArea remain outside the root.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { TextInput } from '@octane-xplat/ui'
export function AccountEntry() {
  return <TextInput label="Account" defaultValue="12" hasClear width="75%" />
}
```

GTK Entry has no direct per-field return-key caption property in the inspected
4.14.5 GIR/4.24.1 API. returnKeyType warns once; onSubmit still receives Return.
Do not turn next into automatic focus movement. See the
[renderer evidence](../../../docs/notes/linux-gtk-renderer.md#gtk-entry-return-key-captions).

Keep the automatic Field wrapper and native editor key stable while chrome
or leading content changes. Compare the mounted widget, not just a captured
handle, when testing identity. Controlled native edits need reconciliation
even when the parent rejects a value without changing props; the existing
effect reads an edit revision for this. Pass original props to the control
and resolved defaults to the wrapper so composed hints are not doubled.

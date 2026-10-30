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
pnpm add -D @octane-xplat/linux-gtk
pnpm exec xplat workshop doctor
```

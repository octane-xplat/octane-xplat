# Windows children and text-slot repair

Task baseline: `64960eaf`, in the `roomy-bolt` worktree. This is a lab record,
not a public usage guide. The component inventory dispositions are unchanged.

## Reproduction and owning seams

The existing [content evidence](windows-ui.md#content-ownership-separate-normalization-text-slots-and-rich-text)
and inventory report ordinary JSX AvatarGroup max2 rendering all three avatars,
a decimal List putting two children under one marker, and bare Kbd text producing
an empty zero-height Layout. Explicit arrays were diagnostic comparisons, not
an API workaround.

A maintained ordinary-JSX object-driver test reproduced `[[first, second]]`
instead of `[[first], [second]]` before repair. Octane's compiler supplies a
`UniversalChildrenValue` whose `render` returns a plan-backed value. The old UI
helper only flattened JS arrays. NativeScript's driver folds primitive text into
TextBase; a Layout is not a text host.

The repair adds renderer-owned `Children.toArray/map` in Octane's universal
source. Transparent child groups, ranges, slots, and arrays are normalized
without mounting components or reading their context. Mapping propagates keys
to wrapper hosts. Keys are scoped to their collection, including through
compiler-generated single-slot wrappers; normalized entries keep their identity
when sliced and mapped again. Normalized-object bookkeeping uses a WeakMap.

Scoped blocks, control flow, providers, activities, and boundaries remain opaque
logical entries. The API does not render components or unpack those owners to
count final host views. Thus this repair is not a contract that an arbitrary
`@for`/`@if` scope producing several siblings becomes several List items. The
ordinary sibling and ordinary `.map` cases below are the verified scope.

Native collection leaves now use the supported runtime API. AvatarGroup, List,
and Carousel map wrappers with child identity rather than positional keys.
MetadataList inherits the shared normalizer; OverflowList's duplicate helper was
removed. Web collection boundaries use Octane's existing `descriptorChildren`
marker, so the same collection operations receive inspectable descriptors.
No opaque plans are inspected in UI leaves.

Kbd, Blockquote, and Button use an internal native TextSlot leaf. Consecutive
primitive text pieces share one Label, including updates such as `Ctrl A` to
`Ctrl B`. Supplied Text/components remain children of the Layout and retain their
own hosts and styling. The Kbd text class supplies font size without applying
its border twice. Generic Layout text behavior and rich-text driver insertion
ownership are unchanged; no driver hunks overlap the nested-rich-text task.

## Retained source and package integration

[The owning source patch](../patches/windows-children/octane-children-source.patch)
is based on upstream `octane@0.6.3`. It applies cleanly to the original source and
recreates the edited source exactly. The existing canonical Octane patch retains
all prior signal, hook, event, and compiler repairs. Only its two universal-core
ESM files and universal declarations changed; other canonical sections were
compared byte-for-byte. The generated config-package copy and yaml metadata are
in sync. Lockfile changes only substitute the new Octane patch hash.

Local Windows pins still specify core preview `7d0adce`, driver `0.2.4`,
Octane `0.6.3`, and runtime `0.1.0-alpha.144`. Guest pins could not be reread.
No dependencies or peers were added to UI.

## Verification

- `pnpm --filter @octane-xplat/ui test:native`: 7 Node tests plus 97 Vitest
  tests in 18 files passed. This is local universal/native-driver evidence,
  not Windows or mobile-device runtime evidence.
- The eight focused collection tests cover ordinary JSX sibling boundaries,
  decimal numbering and start updates, three actual Avatar children with max
  and overflow updates, keyed host/component reorder, context updates, dynamic
  insertion/removal, state-driven reactive changes, excluded-child mounting,
  cleanup on limits and unmount, nested key namespaces, and empty values.
- Carousel slide count/labels, MetadataList limits, and OverflowList child
  boundaries pass bounded object-driver checks. Their unrelated geometry and
  interaction adapters are mocked; no new OS-input claim is made.
- Installed NativeScript driver with mocked host classes verifies bare Kbd,
  supplied Text, Blockquote, one Label for adjacent text pieces, text updates
  retaining the Label, and host cleanup. This proves the host contract, not
  Windows geometry, fonts, or hit-testing.
- Ordinary web JSX collection limits pass in jsdom.
- UI web/native builds, declaration generation, no-emit typecheck, native-dist
  import check, frozen offline install, patch sync checks, and recipe checks pass.
- Repository lint/CSS checks remain blocked outside changed files. CSS reports
  39 unsupported declarations and 53 intentional drops; the new font-size rule
  is supported. UI pack-check still fails on existing macOS export declarations,
  Meter's svg declaration, drawer plugin references, and renderer references.
  Those repairs are outside this task; no UI peers were added to conceal them.

## Windows blocker and restoration

Read-only SSH attempts through `andromeda.local` failed before a guest session:
one exceeded a bounded 35-second timeout, another closed with
`Connection closed by UNKNOWN port 65535`. The jump host is accessible and its
forwarded TCP port2222 responds. This does not establish a healthy guest SSH
service, active desktop, or running app.

No guest mutation, build, app launch, OS probe, dependency swap, or binary swap
was performed. No VM lease was acquired, and no other owner's lock was removed.
There is nothing from this task to restore. Guest dependency/binary hashes and
the stable smoke bundle could not be verified over the failed connection;
restoration from earlier tasks is not presumed installed or certified here.

Reopen Windows validation after the exact supplied SSH command establishes a
session. Acquire the shared atomic mkdir lease in a separately checked operation
before every dependent guest write; record owner, original dependency/binary
hashes, and the smoke bundle. Run ordinary JSX cases through the session1
ScheduledTask launch, inspect native Label text and nonzero geometry, row order,
overflow, live insertion/removal, and cleanup. Restore originals and smoke bundle,
verify hashes/result, then release only this task's lease. No visual analysis is
needed or authorized.

## Documentation and local feedback

This restores existing public children/max/text contracts; no new usage syntax
or array workaround is required. Existing content-display docs and its maintained
demo already use ordinary JSX. Reviewed related recipes: `display-content` AC1
and AC4, `shared-overlays` (Carousel), and `resizable-workspace` (OverflowList).
Their criteria and examples remain applicable; recipe structure/links pass.
Runtime evidence above remains separate from that documentation coverage, and
Windows dispositions are not upgraded from local tests.

Silo feedback observation `c56f13c5-4751-4751-b4eb-2ddabd1af370` records the original
expectation and ordinary-JSX row mismatch. No other worktree's rows were changed.

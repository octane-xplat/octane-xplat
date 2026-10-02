# NativeScript rich-text ownership repair

Task lab record for Annotation3, based on main `64960eaf`. The driver candidate
implements normal nested Text JSX and passes source/package regressions and
bounded mobile native checks. **Windows qualification is parked:** the jump
host responds and its forwarded TCP port accepts connections, but guest SSH
repeatedly times out before authentication. No Windows guest writes, lease,
dependency swaps, binary swaps, preparation, or launch occurred in this task.
The preceding batch's restored smoke bundle and live process could not be
rechecked. This candidate is not integrated into the canonical package patch.

## Reproduction and ownership

The existing Windows record in [windows-ui.md](windows-ui.md#content-ownership-separate-normalization-text-slots-and-rich-text)
shows Label rejecting Span insertion. The local upstream driver reproduction
fails at the same insertion. The maintained suite against the current installed
package has eight failures and one explicit-FormattedString pass before repair.

Explicit FormattedString remains the control. Its recorded Windows inner
`nativeTextViewProtected` contains two Inlines with weights400/700 and correct
combined text. Inspecting Label's outer Border does not inspect those runs.

The repair lives in `packages/octane/src/driver.ts` in the owning
`@nativescript-community/octane@0.2.4` source:

- JSX host nodes remain the source tree. No component is evaluated manually,
  moved into another renderer root, or converted by a shared UI adapter.
- Each TextBase owns one ordered native FormattedString when rich children are
  present. Plain text before, between and after nested spans becomes native runs.
- Nested Span groups retain a logical core hierarchy for CSS, inherited
  properties, and load/unload. Generated native leaf runs project their text and
  supported Span style properties. Explicit flat FormattedString/Span instances
  retain their public identities.
- Text changes, style changes, omitted inline formatting keys, insertion, moves, removal and view replacement
  update that projection. Synchronization is scoped to the owning host; independent
  roots are not suppressed by another root's synchronization.
- Native run collections remove old ownership before adding reordered runs.
  Core adds before removing inside a single splice, so replacing with the same
  attached Span in one splice is unsafe.
- Generated linkTap listeners forward to source spans and are removed with the
  projection. Destroyed groups release logical parents, styles/listeners and
  native collections. Removing the last rich child restores plain TextBase text.
- Both text and tab batch queues are popped even when projection fails.

UniversalChildrenValue normalization and leaf text slots are separately owned.
No changes were made to Octane's universal runtime or the shared Text adapter.

## Durable artifacts and replay

- [Source repair and upstream regression tests](../patches/windows-rich-text/driver-source.patch)
- [Emitted package delta](../patches/windows-rich-text/driver-package.patch)
- [Maintained driver and compiled Text tests](../tests/windows-rich-text/vitest.config.mts)
- [Mobile native case](../tests/windows-rich-text/mobile-case.tsrx)
- [Windows native case](../tests/windows-rich-text/native-case.tsrx),
  [inspection entry](../tests/windows-rich-text/native-index.ts), and
  [output assertions](../tests/windows-rich-text/check-native-output.mjs)

The source patch applies to the unmodified upstream0.2.4 source. It includes the
existing source equivalents of the canonical undefined-prop and visibility
fixes. The package delta applies **after the current canonical0.2.4 patch**;
it only changes `dist/driver.js`. The existing intrinsics/ref hunk and every
canonical patch file, manifest, generated copy, yaml block and lock hash remain
unchanged. Parent magic-grouse owns combining/package integration. Do not
concatenate overlapping patches or bypass the normal sync/hash checks.

Prepare a fresh candidate from the repository root:

```sh
node .agents/tests/windows-rich-text/prepare-candidate.mjs \
  "$(opensrc path @nativescript-community/octane@0.2.4)"
RICH_TEXT_DRIVER=research/windows-rich-text/candidate/packages/octane/src/driver.ts \
  pnpm exec vitest run --config .agents/tests/windows-rich-text/vitest.config.mts
RICH_TEXT_DRIVER=research/windows-rich-text/candidate/package/dist/driver.js \
  pnpm exec vitest run --config .agents/tests/windows-rich-text/vitest.config.mts
```

The helper refuses to overwrite an existing output directory; pass a new third
argument to choose another. It applies both patches in isolated trees, checks
TypeScript, and requires the source emit to equal the patched package bytes.
It leaves installed workspace packages untouched. Omit `RICH_TEXT_DRIVER` to
reproduce the installed driver's failure.

## Verification and limits

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Owning upstream suite | 61 tests pass | Driver, registry/config, ListView and new rich-text lifecycle mocks |
| Maintained candidate source and emitted package | 12 tests pass each | Includes actual compiled Text JSX, context, signal updates, keyed reorder, removal and component cleanup |
| Driver strict TypeScript | Pass | Source/build evidence |
| Existing shared native suite | 88 tests pass | Universal/object-driver regressions; not native OS behavior |
| Android physical native case | Pass | TextView text and actual CustomTypefaceSpan typefaces; reactive text/formatting, ordered spans, rich removal |
| iOS simulator native case | Pass | UILabel attributed text and native bold/bold-italic font traits; formatting update and rich removal |
| Windows native run/geometry case | Parked | SSH handshake blocker; no candidate Windows runtime evidence |
| `pnpm check:patches`, `pnpm check:recipes` | Pass | Patch synchronization and recipe structure |

The compiled Text test retains two component mounts across updates/reorder,
observes one cleanup on keyed removal and the second on conditional removal,
then unmounts the root. Unit tests cover properties, multi-level nesting,
move between text owners, explicit instances, link routing/removal, view
replacement, and an observer updating another root with overlapping host IDs.
Link notification is synthetic; OS link activation and hit-testing are not
verified. CSS selector/font-family coverage is bounded by the cases run.

Android uses CustomTypefaceSpan, not Android StyleSpan. The first inspection
queried StyleSpan and failed; the source-directed inspection applies each
native custom span to TextPaint and reads the resulting Typeface style. This
corrects the inspected native object while retaining the styling requirement.
Mobile size records are for the label after rich removal: Android280×19.08 DIP,
iOS280×21.33 DIP. They do not establish Windows geometry or rich-run hit areas.

No component dispositions have been upgraded. Public docs, recipes and examples
remain unchanged because the canonical runtime has not changed; their existing
limits still apply. Integrating the candidate must reconcile any native nested
Text limitation wording with the qualified targets. No UI dependencies or peers
were added. No screenshots or images were captured or analyzed.

## Windows reopening and restoration

Reopen when this read-only command completes successfully:

```sh
ssh -o BatchMode=yes -o ConnectTimeout=10 -J andromeda.local \
  -p2222 octane@127.0.0.1 whoami
```

Then acquire the shared atomic mkdir lease at
`/Users/alec/dev/alloc/worktrees/octane-xplat/magic-grouse/octane-xplat/research/windows-ui/batch-vm.lock`
and confirm exit0 in a separate operation before any guest write. Record this task/topic in the owner file.
Back up and hash the guest driver, source entry/case, and stable smoke bundle.
Use the candidate driver in the isolated guest checkout and prepare/launch via
the existing interactive ScheduledTask workflow. Do not assume candidate
binaries from previous probes are installed.

Copy `native-case.tsrx` as `src/windows-ui-case.tsrx` and `native-index.ts` as
`src/index.ts`. The entry inspects the **inner TextBlock** at initial, update,
reorder, rich-removal and unmount stages. Read console.log as UTF8 and run:

```sh
node .agents/tests/windows-rich-text/check-native-output.mjs console.log
```

Passing requires ordered combined text, native weights400/700, inherited
bold/italic runs, bold-to-italic property replacement, positive inner/outer geometry with the requested280-DIP label
width, removal back to plain text, and released formatted ownership on unmount.
These are unexecuted Windows criteria, not recorded Windows results.

Restore the original driver/dependencies and any touched binaries with SHA256
comparison, restore and prepare the stable smoke bundle, verify its live state,
then release only this task's lease. This task needs no VM restoration because
it never changed guest state or acquired the lease. Its isolated mobile test
packages did not replace workspace packages; probe processes and reverse
mappings are cleaned by the runner.

[Sanitized evidence and candidate hashes](../tests/windows-rich-text/evidence.json)
retain the native assertions and measurements without local checkout paths or
device identifiers. Silo experiment `a448a683-eb61-48c3-8cdd-f2ba21b5cc34`
records source/mobile validation; `fff3b1d6-2dca-424e-b7ba-b3835fd7e009` records
parked Windows qualification. Local feedback observations preserve the initial
host insertion expectation and the mistaken Android font-span inspection.

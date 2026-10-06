# iOS editor backing-surface spike evidence

Date: 2026-10-05. Owner: editor-package maintainers; prepared by the iOS backing-surface design spike. Related record: [decision #101](../../ios-editor-backing-surface.md).

## Source inspection

Lexical iOS main at inspection: `d871c0ad2f22e2ba19226fe8187e8f72f1e99ca4` (2026-09-04). Source retrieved with `opensrc`; no third-party implementation copied into this repository. Inspected core Editor/ElementNode/Node/EditorState/LexicalView, list and history plugins, Package.swift, README, license and open accessibility issue #17.

Host: macOS arm64. `xcodebuild -version`: Xcode 27.0, build 27A266a.

`pnpm probe doctor` returned iOS available, Android available, and web/macOS unavailable because this worktree has no workspace dependencies installed. This is environment discovery, not an editor pass. No simulator was booted or existing device touched.

## Compile/link diagnostic: NOT RUN

The resource request for `native_builds: 1` failed before the compiler launched:

```text
nested reservation must use an active parent's resource subset; acquire the full set at the outermost command
```

The employee's parent reservation granted zero native builds. The supervisor was notified through `goddard-agent boss report-blocker`. No raw compiler bypass was used. The checked-in Swift and Objective-C inputs remain **uncompiled**; shell syntax validation passed. The diagnostic deliberately excludes HTML/Markdown dependencies and all document/runtime assertions.

Rerun with an editor-maintainer-owned build reservation and a fresh output directory. `opensrc` progress goes to stderr, leaving the checkout path on stdout:

```bash
lexical_source=$(opensrc path facebook/lexical-ios#d871c0ad2f22e2ba19226fe8187e8f72f1e99ca4)
probe_output="$(mktemp -d)/compiled"
goddard-agent resource run '{"resources":{"native_builds":1},"purpose":"iOS editor bridge diagnostic"}' -- \
  bash docs/notes/evidence/ios-editor-backing/compile.sh "$lexical_source" "$probe_output"
```

Expected success output, **not observed in this spike**:

```text
PASS: Lexical core + history + lists + custom ElementNode + Swift/Objective-C consumer compile/link
NOT RUN: NativeScript metadata, app mount, OS input, semantic roundtrip, VoiceOver
```

The diagnostic creates simulator dylibs and a generated Objective-C header in the output directory. It links the consumer but never executes it. The ProbeTaskNode has no Foxtrot fields or editing policy; it proves API availability only if compilation passes. It is not a Foxtrot adapter or test fixture.

## Checks run

- `bash -n docs/notes/evidence/ios-editor-backing/compile.sh`: passed.
- `pnpm check:decisions`: passed, with existing warnings for #15/#27 free-text statuses and #71/#92 divergent statements.
- `pnpm check:recipes`: passed structural/local-link checks. No recipe affected; design work does not close runtime criteria.

Not run: iOS engine/bridge compilation in this spike, NativeScript metadata/mount, all editing/device tests, VoiceOver, Android/web editor tests, visual analysis. Earlier standalone iOS build reports from the supplied migration plan remain attributed prior evidence, not upgraded to this spike's results.

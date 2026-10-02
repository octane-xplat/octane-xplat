# Windows Intl repair lab

Status: repaired and verified in native tests and the real x64 Windows app.
The source patch is retained for integration; no runtime release or production
support claim. No production support claim.

## Reproduction and source provenance

The Windows UI lab's `@nativescript/windows` 0.1.0-alpha.144 crashes in an
explicit-UTC `Intl.DateTimeFormat` constructor and throws an ICU error from
`Intl.NumberFormat.format`. Existing evidence is in [Windows UI lab](windows-ui.md).

The npm package has no `gitHead`, and its version is not a Git tag. Its npm
SLSA provenance resolves the released source to commit
`6061889cc5f810112b0dd51578b3767463976d62`. The prior opensrc snapshot differs;
use this resolved commit for the repair and build. Its classic runtime still
initializes V8 without registering ICU common data.

The runtime declares rusty_v8 `^147`; the controlled rebuild resolves147.4.0.
The matching API requires ICU77 common data with static lifetime
and at least 8-byte alignment (16 preferred). Its test startup registers data
before V8 initialization. `deno_core_icudata` 0.77.0 owns matching data in a
16-byte-aligned static allocation. The candidate adds this dependency only to
the classic engine and registers it inside the existing one-time initialization.
The reviewable upstream candidate is retained as
[an unapplied source patch](../patches/windows-runtime-icu77.patch), including
the regression test. It applies to the resolved release commit. This remains
a source-backed hypothesis until baseline and corrected binaries are tested.

## Native build prerequisites

The lab VM initially had no Rust or Visual Studio native build tools and about
28GB free. Installed Rust1.99.0 x64 MSVC (minimal profile, no PATH modification)
and Visual Studio Build Tools2022 17.14.41 with MSVC14.44.35207,
Windows SDK10.0.26100.0, and CMake tools. No reboot is required according to
Visual Studio installation metadata. The bootstrapper finished with exit0,
and the Windows SDK installer also finished with exit0/no restart. This setup
is shared with the layout task.

Build source is isolated from the app checkout. App/dependency replacement and
interactive probes require the shared VM lease. Native build output and logs
are temporary lab artifacts, not supported public setup instructions.

## Verification gates

- Rebuild the exact released source with a regression case; preserve the failure.
- Register matching ICU data and pass currency/date formatting for en-US, de-DE,
  ja-JP, and ar-EG; dates cover UTC, America/New_York, and Asia/Tokyo.
- Verify exact reference output for USD currency and an English UTC date.
- Load the corrected DLL into the real Windows app and verify no crash.
- Restore the stable smoke screen and original dependency after the session.

Public docs, recipes, UI implementation, and component dispositions remain
unchanged until runtime verification succeeds.

The first compile attempt began before SDK installation finished and failed to
link `kernel32.lib`; it is build-setup evidence, not an Intl runtime result.
The rerun uses a fresh developer shell.

Earlier investigation metadata said rusty_v8147.0.0, but this was not proven
for the shipped DLL. Pinning147.0.0 exposed ICU4X dependency drift; reconstructing
its older dependency graph then exposed missing FunctionTemplate APIs required
by the released source. This discarded build does not establish an Intl result.
147.4.0 exposes those APIs and the same ICU77 data-registration function. The
baseline and corrected rebuilds therefore use one lockfile resolved from the
actual source dependency declaration, with147.4.0. The shipped binary's exact
rusty_v8 crate version remains unverified; npm provenance identifies its source,
not every resolved dependency.

## Controlled native regression

Released source6061889 with resolved rusty_v8147.4.0 built successfully. Its
uncorrected regression failed with `Uncaught TypeError: Internal error. Icu error.`
from currency formatting:0 passed/1 failed, exit101.

With matching aligned ICU77 data registration added before V8 initialization,
the regression passed:1 passed/0 failed, exit0. It exercises en-US, de-DE,
ja-JP and ar-EG currencies/dates; UTC, America/New_York and Asia/Tokyo;
default-zone formatting; exact USD and English UTC date output. This controlled
comparison identifies missing common-data initialization as the native runtime
failure, rather than a Timestamp component bug. App DLL verification is still
required before any support disposition changes.

The stronger regression also passes with actual day/hour values across the
UTC→New York prior-day boundary and Tokyo conversion. The corrected x64
devtools DLL built successfully in the development profile, size56,166,400
bytes. The upstream-source fix is local detached commit `629c72a`; no branch,
push, release, or upstream PR was created. Native compiler warnings include existing dead-code/style
warnings and LNK4098 CRT-library conflict; none has been silently edited away.

## Real app verification and cleanup

The packaged Windows app loaded the rebuilt DLL with SHA256
`8A1A78A2121DF5A8CE16ED3590C0E40314C0F18FAA9DD66EEBF288BDD20353A1`.
The first probe reached PASS with process7940 responding in interactive session1.
The stronger Unicode probe also reached PASS with process9112 responding in
session1. It verified Japanese date characters and Arabic digits in JavaScript,
as well as locale/time-zone formatting and exact day/hour boundary assertions.

Raw console transport damaged non-ASCII output despite a UTF8 log read. ASCII
escaped output proves the formatter retains the correct characters: Japanese
`\u5e74`/`\u6708`/`\u65e5` and Arabic digits `\u0660`–`\u0669` are present.
The console encoding issue is recorded separately and remains parked; it is
not a remaining Intl formatting failure. Silo observation
`d22ba9ee-e0ec-4a62-9eaf-3c2385f735f9` records the original expectation.

The original runtime DLL was restored with SHA256 equality to its backup.
The stable public-root smoke was prepared successfully (exit0) and process4644
responds in session1. Stopping a process does not immediately release its DLL
file lock; await process termination before replacing the DLL. No gesture/core
or native-widget dependency changes were made by this task.

Experiment `88614d58-2b82-4d70-bb97-0d46b0559d67` is passed. Earlier failed
hypotheses and build attempts retain their original outcomes. The source patch
applies cleanly to release commit6061889. The meaningful regression lives in
the upstream-source patch; app diagnostics remain temporary under research.

Only x64 Windows was run. Verification uses the development/devtools DLL, not
an ARM64 or production-release build. The repaired runtime must be adopted in
a released dependency before Intl-dependent UI consumers can be unparked.
Public docs, recipes, examples, UI code, and the component census are unchanged;
no public workflow criteria are affected, so `check:recipes` is not applicable.

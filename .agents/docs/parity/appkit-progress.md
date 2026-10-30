# Native macOS maintenance and qualification

Use this page to find AppKit's current constraints and the records needed before
changing a platform claim. Source, unit tests, packaged runtime, OS input, and
assistive technology qualify different things. Never infer full support from an
export inventory or a passing object-driver test.

Operational state and raw reports live in Silo/local files. Use
[evidence lookup](../exploration.md#operational-evidence) instead of maintaining
a tracked run history.

## Find the owning guidance

| Task | Read |
| --- | --- |
| Verify geometry, overlays, or packaged consumers | [AppKit verification](../appkit-verification.md) |
| Change the JSC host or bridge | [Host constraints](../notes/macos-jsc-host.md), [native intrinsics](../notes/appkit-native-intrinsics.md) |
| Change layout or foreign native leaves | [Mason evaluation and upstream limits](../notes/masonkit-layout-evaluation.md) |
| Change component ownership or input | [Driver semantics](../../skills/octane-xplat/references/primitives/driver-semantics.md), [component guidance](../../skills/octane-xplat/references/primitives.md) |
| Change platform service lifetime | [Service guidance](../../skills/octane-xplat/references/services.md) |
| Change routed panes or modal ownership | [Routing contracts](../notes/routing-contracts.md), [navigation checks](../navigation-checks.md) |
| Assess export presence | [Dated desktop source audit](native-desktop-support.md) |
| Assess test-harness failures | [Test-debt findings](appkit-test-debt.md) |
| Build on Intel or diagnose metadata tooling | [Intel build-host qualification](appkit-intel.md) |

## Ownership boundaries

Keep state, subscriptions, presentation, and cleanup attached to their actual
owner. Unmount, replacement, dismissal, and stale async completion must not
update a retired owner. Current event handlers must read current props; native
callbacks, object-driver dispatch, and real keyboard/pointer activation need
separate evidence. Component-specific contracts remain in the references above
and the relevant [recipe](../recipes/README.md).

Host event delivery, native responder attachment, layout geometry, and accessible
relationships are distinct prerequisites. A bridge that can describe an action
does not prove native focus, hit testing, VoiceOver, or installed-app behavior.
Retain explicit limits for composition, controlled values, floating surfaces,
window ownership, and text/scroll geometry when changing the owning component.

## Desktop applicability decisions

Decision #134 sets the intended desktop subset:

| Area | AppKit boundary |
| --- | --- |
| Geofencing | Unsupported; one-time geolocation is the alternative |
| Haptics | Presets use the native feedback manager; patterns and realtime remain unsupported |
| Firebase Analytics and Crashlytics | Unsupported; use the PostHog and Sentry integrations respectively |
| System bars and software keyboard | Desktop-neutral warning/no-op behavior |
| Pull-to-refresh | Unsupported; provide a visible refresh action |
| Rich-text editing | WKWebView-hosted editors are the accepted path; native editing is separate work |

Still-image barcode decoding is not a hardware exclusion. Assess its Vision
implementation and tests on the current revision. Native symbol values, image orientation, decoding behavior, and the live-camera subset
need their own qualification; the desktop applicability decision does not close
them.

## Intel x86_64 support

Decision #135 requires Intel and Apple Silicon support. Universal packaging
carries both executable slices and architecture-specific metadata; do not restore
an arm64-only rejection. JSC fixtures, native-leaf values, renderer/Mason behavior,
packaged workflows, and notarization need independent evidence.

[The build-host record](appkit-intel.md) supersedes the earlier assumption that
all Intel native-leaf build hosts lack a usable libclang. Check the host's actual
CLT architecture and Swift/SDK compatibility. Keep the NativeScript runtimes
CMake workaround until the pinned upstream supports the requested architectures;
the build-host reference records the owning source and removal condition.

## Find local evidence

Look up AppKit reports in Silo's `local_artifacts` using the filename/topic,
following [operational evidence lookup](../exploration.md#operational-evidence).
Test-harness conclusions live in [the harness reference](appkit-test-debt.md);
pass counts, failures, pending checks, and artifact identities stay in Silo/local
reports. Verify the current checkout before repeating a historical diagnosis.

Keep packaged smoke, OS input, VoiceOver, layout, memory, installed consumers,
and universal distribution as separate gates. Recipe coverage and execution
remain independent assessments in Silo.

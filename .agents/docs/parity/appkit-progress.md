# Native macOS maintenance and qualification

Use this page to find AppKit's current constraints and the records needed before
changing a platform claim. Source, unit tests, packaged runtime, OS input, and
assistive technology qualify different things. Never infer full support from an
export inventory or a passing object-driver test.

The [dated qualification report](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md)
retains feature-by-feature investigations, commits, commands, artifacts, failed
predecessors, and bounded results. It is historical evidence, not an instruction
to repeat old approval gates or treat an earlier failure as current.

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

Still-image barcode decoding is not a hardware exclusion. The report records a
Vision implementation but only authored stub tests at that checkpoint. Native
symbol values, image orientation, decoding behavior, and the live-camera subset
need their own qualification; the desktop applicability decision does not close
them.

## Intel x86_64 support

Decision #135 requires Intel and Apple Silicon support. Universal packaging
carries both executable slices and architecture-specific metadata; do not restore
an arm64-only rejection. The dated report records Intel execution of the JSC
fixture, native-leaf values, and the renderer/Mason motion fixture. These bounded
results do not qualify every packaged workflow or notarization.

[The build-host record](appkit-intel.md) supersedes the earlier assumption that
all Intel native-leaf build hosts lack a usable libclang. Check the host's actual
CLT architecture and Swift/SDK compatibility. Keep the NativeScript runtimes
CMake workaround until the pinned upstream supports the requested architectures;
the report records the owning source and removal condition.

## Verification status and remaining gates

The report contains successive suite and typecheck results. The later
[test-debt record](appkit-test-debt.md) records 664/664 renderer tests passing,
repairs the keyboard typegen ordering gap, and corrects the earlier theory that
foreign-realm equality explained most failures. Its branch/revision and evidence
scope matter; it does not establish runtime qualification or a green result for
a different checkout.

Keep packaged smoke, OS input, VoiceOver, layout, memory, installed consumers,
and universal distribution gates explicit. A later 30-assertion smoke pass in
the report supersedes earlier interrupted runs for that revision only. Use the
maintained verification guide for commands, and inspect the current checkout
before attributing a historical blocker to it. Recipe coverage and execution
remain separate assessments in Silo.

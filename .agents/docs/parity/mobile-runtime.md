# Assess a composed mobile flow

Qualify navigation, authentication, persistence, and upload together when an app
relies on their lifetime and cancellation boundaries. Use [single-case probing](../probing.md)
for an investigation and promote lasting behavior to maintained tests.

## Evidence boundaries

Run the intended flow separately on iOS and Android. Keep real platform storage,
crypto, permission, and host behavior distinguishable from stubbed authentication
or server responses. A composed handler-level case does not establish OS input,
provider sign-in, remote service delivery, accessibility, performance, or a packed
consumer workflow.

Use current [navigation guidance](../../../docs/app/navigation.md) rather than
copying route calls from old probe output. Keep exact targets, revisions, inputs,
stubs, failures, and limits with the execution record in Silo/local files.

## Find local evidence

The historical mobile-flow report and raw per-target outputs are indexed in
`local_artifacts`. Follow [operational evidence lookup](../exploration.md#operational-evidence);
old assertion totals are not a current platform status.

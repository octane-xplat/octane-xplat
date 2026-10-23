# Query cache engine and ownership

Decision 121, 2026-10-22: retain Octane as the value authority. Replace the
current query wrapper's private owner discovery with explicit reader leases
and client disposal. Reusable definitions own keys, loaders and policy;
readers own observation; clients own account/request boundaries. Persistence
namespaces are immutable per client. There is no default server process cache.

This selects an implementation direction, not completed platform qualification.
The [commit plan](query-cache-plan.md) remains the delivery checklist.

## Evidence

The bounded experiment used Octane 0.14.0 and query-core 5.104.5. Temporary
probes live in ignored `research/query-engine/`. These results characterize
those adapters, not every possible integration with TanStack.

| Check | Browser | iOS simulator | macOS AppKit/JSC |
| --- | --- | --- | --- |
| Existing wrapper loads then accepts `optimistic$` | Loads, but optimistic operation throws | Same | Existing loader trace timed out before first assertion |
| Core observers deduplicate and retain another reader's request | Pass | Pass | Not established |
| Core clear fences transport ignoring cancellation | Pass | Pass | Not established |
| Signal mirror and core agree inside Octane adoption | Fail: native revision 2, core revision 1 until batch exit | Same | Not established |
| Native signal authority accepts adoption, rejects older receipt, retires on dispose | Pass | Interrupted before assertions; unverified | Initially missing UUID; passes after host fix below |

The existing cached wrapper is not an Octane source accepted by
`optimistic$`: it throws `optimistic$ requires an Octane signal source.` Its
private descriptor-owner registration also needs replacement. Retaining the
engine does not justify retaining those defects.

A production Vite 8.3 library build with `octane/signals` external produced
8.90 kB minified / 2.92 kB gzip for the current client and 45.05 kB / 10.95 kB
for core's QueryClient + QueryObserver exports. This is a baseline engine
cost, not feature-equivalent bundles: core includes more functionality and
its Octane adapter is absent. Browser creation of 10,000 empty clients had a
1 ms median for each across seven samples; the timer resolution does not
support a startup-speed claim. Import parsing and application startup remain
unmeasured.

## Contract for implementation

One native signal cell owns each confirmed record. Optimistic views compose
with that cell through Octane's public `optimistic$` and `action$` APIs;
confirmed receipts must become visible to cache reads within the same action.
Persistence subscribes only to confirmed authority. No observer mirror may
become a second authority. Readers expose native signal handles, while explicit
leases and component hook cleanup own their lifetime. No private owner fields
or guessed internal symbols are permitted in the replacement.

Definitions are reusable immutable objects. Clients reject another definition
using an already registered family instead of silently choosing its loader.
Selections are canonical JSON values. A reader's selection change releases the
old lease, and account change disposes the old client. Disposal fences pending
fetches, restores, actions and new durable writes. Already queued confirmed
snapshots drain in the original namespace before disposal resolves; explicit
durable purge queues after those writes and is awaitable. Server code creates a client per request.

An alternative core integration could route every Octane adoption synchronously
through core. That would need a supported mutation protocol beyond the tested
observer bridge and still needs native signal ownership, disposal, and
persistence integration. The measured engine cost plus that semantic work
outweighs adopting core for this milestone. Revisit if upstream exposes an
atomic external-authority contract or the cache's scheduling maintenance cost
exceeds this tradeoff. Do not advertise TanStack API compatibility.

## Qualification limits and upstream follow-up

Octane 0.14.0's action operation identity requires `crypto.randomUUID()`.
The decision-time AppKit host did not provide it, verified by the isolated
native-authority probe. The host now supplies UUIDs through Foundation; the
repeated authority probe passes three assertions. This is a host capability,
not a cache-specific operation-ID fallback. The
combined macOS trace timed out in the existing cache before the core adapter
ran, so it provides no comparative core result.

The first full-cache AppKit probe also exposed a missing global
`AbortController`. The host now embeds the same `abort-controller` 3.0.0
engine already used by the DnD leaf, preserving existing providers and bundling
both MIT notices. The supported host subset is `aborted`, abort events, and
controller abort; newer AbortSignal static helpers/reasons are not promised.
It adds a separate host payload, with no new UI dependency. The repeated
full-cache probe passes four assertions: shared tentative values, confirmed
value isolation, receipt publication, and disposal. Real OS lifecycle/network
qualification remains separate.

No Android, Windows, or Linux runtime qualification has run for this decision.
Cross-platform composed workflows remain required by step 12. The new public
contracts must acquire maintained regression tests as they land; temporary
probe success does not establish a shipped cache feature.

The replacement's maintained ownership tests also establish that raw Scope
cells must be created outside rendering. The hook acquires its lease in a
committed effect and returns no reader until then; it releases the old lease
on selection changes/unmount. Raw Scope signals and derived handles retain
client-owned identity. A declarative `signal$` factory cannot be substituted
under `runWithSignalOwner(scope, ...)`: its descriptor still uses the
renderer/document declaration contract. The replacement does not bypass
Octane's render write guard or depend on descriptor internals.

# Query cache engine and ownership

Decision 121 retains Octane as value authority, with explicit reader leases and
client disposal. Reusable definitions own keys, loaders, and policy; readers own
observation; clients own account/request boundaries. Persistence namespaces are
immutable per client. There is no default server-process cache.

The decision-time observer bridge could lag Octane adoption until batch exit,
violating synchronous confirmed reads. Retaining Octane authority avoids that
second authority. It does not justify private descriptor-owner discovery or a
wrapper that cannot compose with Octane optimistic operations. The experiment
compared bounded adapters, not every possible TanStack integration. The
[public comparison](../../docs/app/data.md#tanstack-query-as-an-opt-in) owns the
reasons an app may choose another cache.

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


## Host and upstream constraints

Octane 0.14.0 action identities require `crypto.randomUUID()`. AppKit supplies
UUIDs through Foundation as a host capability, not a cache-specific fallback.
Its embedded `abort-controller` 3.0.0 engine supports `aborted`, abort events,
and controller abort; newer AbortSignal static helpers/reasons are not promised.
Keep both bundled MIT notices and avoid a new UI dependency for host machinery.
OS lifecycle/network behavior needs separate target qualification.

The replacement's maintained ownership tests also establish that raw Scope
cells must be created outside rendering. The hook acquires its lease in a
committed effect and returns no reader until then; it releases the old lease
on selection changes/unmount. Raw Scope signals and derived handles retain
client-owned identity. A declarative `signal$` factory cannot be substituted
under `runWithSignalOwner(scope, ...)`: its descriptor still uses the
renderer/document declaration contract. The replacement does not bypass
Octane's render write guard or depend on descriptor internals.


## Verification and evidence

Use the [maintained checks](query-cache-qualification.md). Engine comparisons,
bundle measurements, and original probe results are preserved under Silo
`local_artifacts` keys `.agents/design/query-cache-engine.md` and
`.agents/design/query-cache-plan.md`. Follow
[operational evidence](../docs/exploration.md#operational-evidence); delivery
checklists and current qualification do not belong in this decision record.

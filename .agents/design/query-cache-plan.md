# Query cache commit plan

Status: steps 1–11 implemented. [Engine decision 121](query-cache-engine.md)
selects native signal authority. The cache now has explicit ownership,
bounded retention, retry/network scheduling, lifecycle refresh, typed writes,
prefetch, shared native optimistic actions, cached cursor pagination, and opt-in
metadata inspection. The maintained list/detail/edit/account workflow and guide
make the official cache the shared-data default.

Current focused evidence: 60 cache tests, seven inspection tests, and two
composed workflow tests pass. The docs build passes. Earlier commits also
qualified nine universal object-driver tests, five environment adapter tests,
and packed web/native/macOS type contracts in Bundler/NodeNext modes. Packed
builds prove the development gate removes inspection from production output.

Step 12 is limited to headless qualification at the user's request on
2026-10-23. Run one check at a time with Turbo concurrency 1; preserve passing
results instead of repeating broad suites. Actual OS lifecycle/device
qualification is deferred, and source/typecheck/mock evidence must not be
reported as platform runtime parity.

Make the official cache the easiest reliable choice for an Octane Xplat app
that loads shared data, edits it, navigates between screens, and recovers from
network interruptions. Success means those workflows need less application
plumbing while retaining Octane signals, explicit ownership, and consistent
platform behavior.

## Starting point and scope

The [current implementation](../../packages/ui/src/query-cache.ts) and
[public guide](../../docs/app/data.md#the-shared-query-cache) establish shared
requests, stale-while-revalidate, keyed invalidation, isolated clients, and
opt-in persistence. [Decision 99](decisions.md) intentionally leaves mutations
to application code. Optimistic actions already exist in Octane; pagination
exists in [a separate list store](../../packages/ui/src/async-list.ts).

Prioritize the reasons a new Xplat app would otherwise need another cache:
automatic recovery, bounded retention, shared cache updates, prefetching,
cached pagination, and useful inspection. Preserve an honest TanStack opt-in
for existing applications and capabilities outside this milestone.

Durable offline mutation replay, conflict resolution across devices, normalized
entity graphs, cross-tab synchronization, and a visual devtools panel are
deferred. Cached reads surviving a restart do not establish offline writes.
SSR cache hydration is a separate follow-up; request isolation must still be
preserved by the foundation below.

## Commit sequence

Each implementation commit includes its focused regressions, declaration
comments, relevant public guide updates, recipe changes, and Octane skill
review. The later documentation and qualification commits compose the pieces;
they do not postpone those obligations.

| # | Proposed Conventional Commit | Result | Depends on |
| --- | --- | --- | --- |
| 1 | `docs(data): decide query cache engine and ownership contract` | One engine decision backed by bounded experiments | — |
| 2 | `feat(data)!: separate query definitions from reader and client lifetimes` | Predictable identity and account/request isolation | 1 |
| 3 | `feat(data): collect inactive query entries` | Bounded retention after readers leave | 2 |
| 4 | `feat(data): add retry and network scheduling policies` | Automatic recovery with observable paused work | 3 |
| 5 | `feat(data): integrate query refresh with platform lifecycle` | Resume, reconnect, and optional polling across hosts | 4 |
| 6 | `feat(data): publish typed cache updates across readers` | Saves and server events update shared records immediately | 2–3 |
| 7 | `feat(data): prefetch queries outside component lifetimes` | Navigation can warm the same cache screens consume | 4–6 |
| 8 | `feat(data): reconcile optimistic actions with shared queries` | Concurrent edits settle without corrupting other readers | 6 |
| 9 | `feat(data): add shared cursor query pagination` | Paged feeds share caching, invalidation, and persistence | 4–8 |
| 10 | `feat(cli): expose query cache inspection` | People and agents can explain query behavior | 5–9 |
| 11 | `docs(data): make the official cache the shared data default` | One maintained app workflow and clear API selection | 5–10 |
| 12 | `test(data): qualify shared query workflows across platforms` | End-to-end evidence for the supported workflows | 11 |

Land in numbered order. Commits 1–5 form the first useful milestone;
commits 6–9 remove application-level glue; commits 10–12 improve diagnosis,
adoption, and confidence. Mark additional commits breaking with `!` wherever
they replace an existing API or observable behavior. Remove replaced surfaces
in that commit, following the alpha hard-cutover policy.

### 1. Decide the engine and ownership contract

Compare the existing signal-backed cache with a small `@tanstack/query-core`
adapter before expanding either. Use the same traces: two independent roots
sharing one request, one reader leaving during a shared request, account
disposal during restore/fetch, and an optimistic action receiving an older
server response. Inspect the public API first; inspect implementation only
when the public contract cannot establish the required behavior.

- Prove the adapter boundary on web, then iOS, then macOS. Include Android in
  the later qualification milestone; distinguish host tests from real runtime
  results. Measure added shipped bytes and startup work using the same fixture.
- Require one authoritative cache, preservation of Octane ownership and action
  semantics, and an explicit supported seam for publishing cached values.
  Address [open questions 44 and 46](open-questions.md): owner registration and
  publishing a value currently rely on upstream implementation details.
- Prefer the proven engine if it satisfies those contracts with acceptable
  integration cost. Retain the existing engine only with a concrete mismatch
  or cost comparison, rather than familiarity with the current implementation.
- Keep temporary alternatives in `research/`. Retain conclusions and required
  regression cases. Record the decision in Silo before adding its allocated
  number to the ledger. This plan itself makes no new architectural decision.

**Completion:** a short decision states the selected engine, public ownership
contract, measured costs, platform evidence, and rejected alternative. If
`query-core` wins, insert a dedicated engine-adoption commit before commit 2,
using a leaf package and migrating consumers in one hard cutover. Do not add
dependencies or peers to `packages/ui`, retain two competing official caches,
or silently substitute one engine's semantics for Octane's. Rewrite package
paths in this plan once that decision is made.

### 2. Separate definitions, readers, and client lifetimes

Introduce a reusable typed query definition that owns the family key, loader,
and defaults. Each reader supplies its selection and has an independent
Octane owner. Cache identity remains client boundary + family + canonical
selection. Reusing a family must never silently select the first reader's
selector; incompatible definitions for the same family fail explicitly.

| Entity | Owns | Must not own |
| --- | --- | --- |
| Query definition | Typed selection/result contract and loader | Mutable account or screen state |
| Reader | Current selection and observation lifetime | Another reader's selection |
| Cache entry | Shared value, request, freshness, and retry state | Application authentication policy |
| Query client | Memory boundary, persistence namespace, disposal generation | A process-wide server request fallback |

Make the client's persistence namespace immutable and align it with its memory
boundary. Account changes replace/dispose the old client; disposal retires
readers, requests, restores, timers, and optimistic work. Separate ordinary
eviction from sign-out disposal and provide awaitable durable purge when
requested. A disposed client cannot continue displaying or publishing old
account data. No authentication-package dependency is needed.

**Touch:** query core, data entrypoints, ownership tests, account guidance.
**Prove:** two selections in one owner stay independent; equal keys across
clients stay isolated; A→B→A selection changes reject obsolete results;
disposal during asynchronous persistence cannot restore or save into a new
account; request-scoped server clients share no mutable cache.

### 3. Collect inactive entries

Track actual reader and operation leases, release registrations on owner
retirement, and add `gcTimeMs` independently from `staleTimeMs`. Proposed
default: collect entries five minutes after their last lease ends. Explicit
prefetches own temporary leases. Dispose timers with the client; do not keep a
server process alive for cache maintenance. Memory collection does not purge
otherwise valid durable records.

**Touch:** entry retention, owner subscriptions, disposal.
**Prove:** after visiting 1,000 distinct selections and advancing the clock,
inactive entries and registrations return to the expected live set; observed
entries survive; remount before expiry reuses data; remount after expiry
reloads or restores. Define and test cancellation when the last lease ends,
including a transport that ignores its abort signal.

### 4. Add retry and network scheduling

Use one scheduler per shared request, with a maximum attempt count, configurable
backoff, cancellation, and an application-supplied retry predicate. Expose
fetching/paused/idle independently from whether usable data exists. Let callers
disable connectivity gating for loaders that do not require a network.

| Proposed policy | Initial default | Required behavior |
| --- | --- | --- |
| `staleTimeMs` | `0`, retaining the current default | Controls freshness, not polling or retention |
| `gcTimeMs` | `300_000` | Starts after the last lease ends |
| Retry count | `2` retries after the first attempt | Never retry abort, disposal, or explicit cancellation |
| Retry delay | Exponential from `1_000` ms, capped at `30_000` ms | Configurable, with deterministic clock tests |
| Network mode | Require connectivity for remote queries | Unknown host connectivity must not permanently block work |

These are proposed defaults, to be frozen with the contract and represented by
explicit types and unit-bearing names. The cache does not infer HTTP status
from arbitrary errors or automatically retry application writes.

**Prove:** bounded attempts; one shared retry sequence; offline pause/resume;
manual refresh coalescing; invalidation during backoff; disposal during delay;
abort ignored by transport; retained data plus visible refresh failure. Policy
changes must not produce duplicate requests or unhandled rejections.

### 5. Connect platform lifecycle and polling

Reuse existing [connectivity services](../../packages/platform/src/connectivity.ts)
and app-state facilities through platform leaves. UI already depends on
`@octane-xplat/platform`; avoid another service dependency. Attach lazily to
active clients, release subscriptions on disposal, and provide an injectable
environment for tests and custom hosts. Keep browser globals out of shared code.

Propose refresh-on-resume and refresh-on-reconnect enabled for stale, observed
queries. Polling is opt-in through a millisecond interval, pauses in the
background/offline by default, and shares the request scheduler. Coalesce
simultaneous resume/reconnect events and prevent catch-up request bursts.

**Prove:** foreground/background transitions and reconnect on web, iOS,
Android, and macOS; no interval work while inactive; one refresh per eligible
key; clean listener teardown. Report unsupported host capabilities explicitly
for experimental desktop hosts. A mocked event proves scheduling only; actual
host lifecycle events are required for platform qualification.

### 6. Publish typed cache updates

Add definition-based get/update operations that infer result types from the
query definition. Publish immutable updates to every matching reader and the
persisted record. Treat a write as a new cache revision so an older fetch or
restore cannot overwrite it; an explicitly newer refetch can reconcile it.
Support updating matching existing entries without inventing list/detail
normalization or guessing which unrelated queries a mutation affects.

**Touch:** cache write path, public types, persistence ordering.
**Prove:** a save response or socket event updates two screens immediately;
wrong update types fail compilation; older fetches/restores cannot overwrite
the update; exact/family matching behaves consistently; updates after disposal
fail predictably. Document freshness and invalidation behavior after a write.

### 7. Prefetch outside component lifetimes

Add awaitable prefetch and ensure-data operations using the same typed
definition, key, policy, and in-flight request as a mounted reader. Ensure-data
returns a value or rejects; prefetch returns a documented result without
requiring a mounted owner. Cancellation releases the caller's lease without
aborting work another reader still needs.

**Touch:** client operations and a maintained navigation example. Use existing
route-loader composition; avoid redesigning the router.
**Prove:** navigation prefetch and screen mount make one request; fresh data
does not refetch; failed prefetch is recoverable; cancellation and account
disposal leave no background work. Verify a caller can distinguish failure
from successful completion without inspecting an unrelated reader.

### 8. Reconcile optimistic actions with shared records

Compose with Octane's existing `action$`/`optimistic$` model. Establish one
operation identity and settlement policy for the shared record, preserve
selection/account fencing, and publish confirmed server receipts through the
cache write path. Supply a small official helper only where composition
otherwise requires repeated application bookkeeping; do not add a competing
mutation engine simply to mirror TanStack names.

**Prove:** optimistic changes are visible to all participating readers;
rejection removes only that operation's contribution; two overlapping edits
settle in either order; an older server revision cannot replace newer
authority when a comparator is configured; refetches and account changes do
not resurrect overlays. Keep uncertain server outcomes explicit and do not
persist tentative values as confirmed data.

### 9. Add cached cursor pagination

Add a typed paginated query over the selected cache engine. Its record owns
pages, page parameters, next/previous readiness, and an optional retained-page
limit. Define one cache identity per feed/filter/sort selection and a clear
refetch order. Compose with list presentation and selection rather than
replacing `useAsyncList`'s independent local collection role.

**Prove:** two screens share pages and a next-page request; a failed page
retains earlier rows and retries the same cursor; refresh and load-more cannot
duplicate or overwrite pages; changing filters retires obsolete work; page
limits bound retention; persisted page state restores coherently. Show a
maintained list→detail→back workflow using the same cached feed.

### 10. Expose inspection to people and agents

Add a development-only snapshot/event interface and connect it to existing CLI
and app development transports. Start with structured text/JSON rather than a
new visual UI. Use opaque IDs and allowlisted diagnostic labels; raw key parts,
payloads, error messages, and persistence scopes may contain private data.

An illustrative proposed snapshot makes the inspection boundary concrete:

```json
{
  "clientId": "client-1",
  "queryId": "query-12",
  "label": "users.detail",
  "status": "ready",
  "fetchStatus": "paused",
  "stale": true,
  "observers": 2,
  "failureCount": 1,
  "lastTrigger": "reconnect"
}
```

Include bounded event history explaining load, retry, pause, invalidation,
write, restore, and eviction. Inspection must be observational and excluded
from production by default. The current [diagnostics transport](agent-diagnostics.md)
does not provide general application snapshots; qualify the new bridge per
target and return explicit unavailable results where it cannot connect.

**Prove:** live state matches actual cache transitions; event buffers are
bounded; production artifacts omit collection; snapshots do not expose secret
keys/data; CLI selection cannot inspect a different app/client accidentally.
Avoid a general native command-bridge rewrite as an incidental dependency.

### 11. Make the official path easy to choose

Lead the data guide with a small shared-cache example and retain plain
`query$` for owner-local async work and streams. Add a concise TanStack mapping
that distinguishes supported equivalents, differing semantics, and remaining
gaps. Publish only capabilities established by preceding commits.

Extend the existing maintained data fixture into one coherent workflow: shared
list/detail data, edit success/failure, navigation prefetch, pagination,
reconnect, account switching, and restored data. Link it from the guide and
agent skill. Keep advanced policies after the first working screen.

**Touch:** `docs/app/data.md`, data fixture/examples, API migration guidance,
`fetch-remote-data` recipe, and `.agents/skills/octane-xplat/`.
**Prove:** a fresh packed consumer follows the guide without private imports;
examples typecheck; an agent following the skill chooses the official cache
for the demonstrated workflow. Record any remaining reason to use TanStack
instead of concealing it in the comparison.

### 12. Qualify the composed workflow

Promote the proved scenarios into maintained browser/native harness checks.
Use deterministic transport fixtures with controlled latency, failure, and
response order. Preserve focused regressions in every earlier commit; this
commit verifies integration through the public installed package.

| Scenario | Observable acceptance |
| --- | --- |
| Two independent roots | One request; both show the same settled record |
| Shared request ownership | Removing one reader does not cancel another's work |
| Resume and reconnect | Stale active data refreshes once; fresh/inactive data does not |
| Concurrent saves | Confirmed newer authority survives older success or failure |
| Navigation and pagination | Prefetch is reused; pages and selection survive the intended route flow |
| Account switch during fetch/restore/save | No old-account result becomes visible or persistent in the new boundary |
| App restart | Eligible confirmed data restores; expired/incompatible records do not |
| Long session | Inactive entries, readers, timers, and diagnostic history are reclaimed |

Qualify web, then iOS, then macOS; include Android before claiming mobile
parity. For Linux/Windows, state concrete capability and evidence limits rather
than inheriting a pass from shared source. Keep browser installation and device
emulation outside the lightweight PR checks. Record actual runtime targets and
failures separately from source, typecheck, and object-driver evidence.

## Validation and delivery rules

Run each touched package's checks through Turbo. For a change contained in UI,
the existing task names are:

```sh
pnpm exec turbo run test test:native --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:ui-barrels
pnpm check:recipes
```

Add the corresponding touched-package/dependents typecheck for `platform`,
`cli`, or a selected engine leaf. Run focused CLI/platform tests when those
packages change; do not run unrelated packages. For public guide changes,
validate the docs build through its existing task:

```sh
pnpm exec turbo run build --filter=@xplat/docs
```

Use [the probe workflow](../docs/testing.md) for bounded platform questions,
reserve native resources, and promote required behavior into maintained tests.
Use text assertions and logs; this plan does not require visual analysis.
Ensure newly maintained runtime checks have Turbo tasks with appropriate
dependencies and uncached execution for host/device side effects.

The primary affected recipe is
[fetch-remote-data](../docs/recipes/fetch-remote-data.md), especially AC3, AC4,
AC6–AC9. Extend criteria for the new recovery, prefetch, and inspection
workflows without weakening existing requirements. Review linked navigation
and diagnostics recipes when their public workflows change. Store criterion
coverage and actual verification separately in Silo; update upstream-limit
notes when a new workaround is required.

Each commit is independently reviewable, includes migrations for its hard
cutovers, and leaves no hidden dependency on unfinished later commits. Keep
the generated changelog untouched. The plan adds no mandatory dependency,
new public API, runtime claim, or release until the corresponding work lands.

## Comparison references

The sequence addresses capabilities documented in TanStack's
[query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults),
[cache operations](https://tanstack.com/query/latest/docs/reference/QueryClient),
[infinite queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries),
[mutation persistence](https://tanstack.com/query/latest/docs/framework/react/guides/mutations),
and [devtools](https://tanstack.com/query/latest/docs/framework/react/devtools).
These explain the comparison; they do not establish compatibility of its
React tooling with an Octane or NativeScript host.

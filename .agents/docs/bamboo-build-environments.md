# Bamboo build participation

`@bamboocss/vite@1.56.2` treats every configured environment as a build
participant. In `packages/vite/src/css.ts`, `configResolved` sets
`expectedEnvironments` from `config.environments`; the pre `buildApp` hook
replaces it with keys from `builder.environments`. Neither registry describes
the schedule of a custom builder. Source: [Bamboo css.ts](https://github.com/gajus/bamboocss/blob/8e4a70b4a7b57b2ed1be8e15c32e37b931e42725/packages/vite/src/css.ts).

A Cloudflare SPA plus Worker can configure `ssr`, `coreframe_demo_api`, and
`client`, then build only the latter two. The supplied fresh isolated consumer
log reproduced the incomplete-run warning on Vite 8.3.5 while retaining the
probe's red color and 13px padding. No missing required probe styles were
observed. This does not establish correctness of the full application's CSS;
its build was blocked by unrelated removed query exports.

Xplat's opt-in `buildEnvironments` adapter gives only Bamboo's two accounting
hooks a projected registry. Other plugins and Vite retain every environment.
It rejects unknown names and any actual build outside the declared list.
It neither disables pruning nor filters diagnostics. Keep every actual SSR
target, including assetless ones, in that list. Default behavior is unchanged.
See the [consumer example](../../packages/bamboo/README.md#custom-builders-with-unused-environments).

The maintained `packages/bamboo/tests/build-environments.test.mjs` uses real
Vite 8.3.0 builds in child processes so `beforeExit` warnings are observable. It
covers the unused SSR registry, an incomplete declared run, excluded/unknown
targets, written CSS and HTML/manifest references, pruning an unreachable
module, and SSR-only styles retained with either build order. The existing
platform test also verifies CSS reaching the native consumer hook. These are
host build checks, not browser or device runtime evidence.

## Upstream contract needed

Bamboo should expose an explicit participating-environment list (or a builder
run lifecycle that knows when scheduling is complete). A registry key alone
must not imply participation. All scheduled environments must contribute their
reachability before deferred sheets are finalized, regardless of order or
asset emission. A declared participant that fails or never completes must
remain an error/warning, and an undeclared build must not silently prune away
SSR-only classes. Discovering only the environments started so far is unsafe:
a later SSR build can restore CSS removed from an earlier client output.

Replace this adapter when an adopted Bamboo version exposes that contract.
The adapter currently depends on the named `bamboocss:css` plugin's
`configResolved` and `buildApp` hooks and fails if those anchors disappear.
Automatic scheduling discovery is not implemented. Real SSR with Xplat
`@platform` conditions remains separately unsupported.

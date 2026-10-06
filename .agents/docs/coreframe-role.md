# Coreframe's role after the Xplat migration

Coreframe is the app platform: scaffold, dev orchestration, Worker/API hosting,
data and auth plumbing, deploy, and ops surfaces. Xplat is the client runtime:
components, navigation, platform services, and renderers for web, iOS/Android,
and desktop. This reference records where the boundary is expected to land once
Coreframe migrates onto octane-xplat, for two audiences: agents working on
octane-xplat (what Coreframe absorbs vs. what the framework must provide) and
agents planning downstream app migrations such as Foxtrot and TextCoral (which
services they can assume vs. what the app owns).

This is a direction document, not a contract. The
[open questions](#open-questions) section lists boundary seams that are not yet
decided; check them before treating an assumption as load-bearing.

Snapshot: 2026-10-04; octane-xplat `2f595b0c`, coreframe `f4aeaa59d`. See
[foxtrot-migration-gaps.md](foxtrot-migration-gaps.md) for the concrete gap
analysis this boundary is grounded in.

## The three owners

| Owner              | Scope after migration                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **octane-xplat**   | Client runtime on every target: UI core, routing/navigation, signals/stores/query, styling normalization, platform services, capability leaves, DOM + NativeScript + desktop renderers, `xplat` build/doctor/typecheck.                                |
| **Coreframe**      | App platform: generated project and upgrade path, dev/preview orchestration, Worker hosting and typed API contract, auth server, database workflow, deploys, dashboard, managed assets, i18n pipeline, Leylines, diagnostics, recipes and agent rules. |
| **The app itself** | Product code: screens and features, domain state, API route definitions and handlers, schema, product engines (editors, sync, media pipelines), and platform files for product-specific capabilities.                                                  |

## What Coreframe keeps owning

These survive the migration essentially unchanged; they were never renderer
concerns.

- **Project lifecycle**: `create-coreframe`, the generated template,
  `coreframe-upgrade`, versioned `recipes/`, and the fractal
  `.agents/rules/**` conventions.
- **Dev orchestration**: `coreframe dev` supervision (Vite web dev, Worker dev,
  local database sidecars — PostgreSQL or `turso dev`), Leylines log capture,
  managed-dev sessions, Panda codegen. How native targets join this loop is an
  open question below.
- **API and hosting**: the typed route contract shared by client and Worker,
  Worker handlers and request-scoped middleware (`ctx.db`, auth identity),
  scheduled jobs (`@coreframe/jobs`), object storage and signed uploads.
- **Accounts**: Better Auth server, sessions, passkey/email/social
  configuration, SES email. The native _client_ side of sessions is undecided —
  see open questions.
- **Data workflow**: Drizzle schema and migrations, local database lifecycle,
  deploy-time and held migrations, both PostgreSQL and SQLite/libSQL dialects.
- **Shipping**: `coreframe build`/`preview`, staging and production deploys,
  Worker environment and secrets, sourcemaps and release checks, diagnostics.
- **Ops surfaces**: the `/__dashboard` plugin dashboard, managed static assets
  (B2/S3), the Lingui catalog + generation pipeline (the Worker catalog is
  renderer-independent either way).
- **Browser-only entrypoints**: dashboard, PWA, and the WXT browser-extension
  lifecycle remain browser builds; they are not native requirements.

## What octane-xplat owns

- **UI and navigation**: `@octane-xplat/ui` primitives, stacks, overlays,
  `AppShell`, route tables (`defineRoutes`/`addRoutes`, programmatic routes
  exist specifically because Coreframe generates routes from a content
  directory — decision #67, #96), theme, animation/gesture facades.
- **Client state**: signals (`$`-suffixed), `createStore`/`useStore`,
  `cachedQuery$` + `platformQueryStorage`. Whether apps keep TanStack Query is
  an open question.
- **Platform services**: `@octane-xplat/platform` capabilities plus leaves —
  `secure-storage`, `sqlite`, `files`, `media`, `auth`/`authSession`,
  `biometrics`, `share`, `haptics`, `push`/`notifications`, and the editor
  leaves (`richtext`, `tiptap`, `lexical`) with their known limits.
- **Renderers and targets**: DOM for web, NativeScript for iOS/Android,
  experimental AppKit for macOS, `desktop-webview` for desktop hosting.
- **Toolchain**: `xplat` dev/build/doctor/typecheck, suffix module resolution,
  seam lint rules, the `create` scaffolder, and the lockstep package release.

## What the app owns

- Screens, feature UI, and the platform-file splits that need them.
- Domain state and product engines. Foxtrot's ProseMirror/Yjs editor, sync
  protocol, semantic-search indexes, and Groq voice workflow are app-side
  regardless of which renderer hosts them — Xplat leaves supply reusable
  transport/capability pieces, not product semantics.
- API route definitions, handlers, validation schemas, and migrations.
- Platform adapters for product capabilities that have no leaf: Foxtrot's
  directory-watch workspace and desktop voice/shell bridges are the recorded
  examples.
- Web-only presentation choices inside retained browser surfaces.

## For agents migrating an app

What you can assume exists, and what you must build or verify.

| Assume Coreframe provides                                        | Assume Xplat provides                                                        | The app must build/port                                                                                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Worker, typed API contract, auth server, DB, deploys — unchanged | Components, routes, signals/stores, styling normalization on every target    | React/Panda screens → Octane components; Valtio → signals or app-owned stores                                                       |
| Dev server and preview for the web/worker loop                   | `secure-storage`, `sqlite`, `files`, `media`, `share`, `haptics` leaves      | Nothing — `createHostedAuth` in `@octane-xplat/auth` carries the ceremony; Coreframe owns its Worker contract as a `HostedAuthFlow` |
| Dashboard, managed assets, i18n catalogs, Leylines               | `authSession` hosted ceremonies; native WebAuthn is deliberately unsupported | Product engines inside a suitable host (e.g. editor in an isolated `WebView`)                                                       |
| Upgrade path and recipes for adopted integrations                | Suffix resolution for `.web`/`.mobile`/`.ios`/`.android` platform files      | App-specific capability adapters (workspace FS watch, voice, desktop shell bridges)                                                 |

Do not assume: browser SDKs (`posthog-js`, Fontsource, PWA plugins, browser
Leylines) have native equivalents; DOM globals or React node views run in
shared native code; a bare `ui.WebView` reproduces Coreframe's Flutter host
contract (loopback proxy, fixed origin, HttpOnly cookie session, capability
bridge) — that contract must be re-established, not presumed.

## Open questions

The boundary is genuinely undecided at these seams. Treat the "keeps owning"
lists above as direction; these are the edges that still need a decision.

1. **Dev orchestration split**: does `coreframe dev` orchestrate `xplat` for
   iOS/Android targets, or does the app run two CLIs? Who owns the web Vite
   config — Coreframe's plugin set or `xplat dev`'s?
2. **Native session/auth contract**: resolved in the generic direction —
   `createHostedAuth` in `@octane-xplat/auth` runs an `authSession`-hosted
   PKCE ceremony against a product-supplied `HostedAuthFlow` (attempt →
   callback → credential exchange → refresh/revoke), persists credentials in
   `secure-storage`, and attaches/refreshes Bearer on authorized API calls.
   Coreframe owns its Worker contract (`/api/auth/native/*`) as such a flow;
   no Coreframe names or paths live in xplat. Coreframe's Flutter shell still
   uses a same-origin loopback proxy (fixed port `55901`, `/api` allowlist,
   host-only HttpOnly cookies, Worker validating the exact origin); that
   contract is unchanged and remains the Flutter transport.
3. **Styling**: Panda CSS is Coreframe's web styling system; Xplat normalizes
   through `styled()`/CSS. Do migrated apps drop Panda, keep it web-only, or
   does Xplat absorb a styling contract?
4. **Query layer**: TanStack Query with persistence policies vs.
   `cachedQuery$`/`platformQueryStorage`. Retaining TanStack is only coherent
   inside retained DOM UI.
5. **Retained-DOM mode**: does Coreframe keep a whole-app WebView composition
   as a migration on-ramp (preserving React code), and if so who owns that
   host contract — Coreframe or an Xplat package?
6. **Flutter tooling**: `coreframe_flutter`, `flutter-tools`, and the Dart
   capability bridge are replaced in scope by NativeScript hosts, but desktop
   parity (menus, updater, folder chooser) is a separate gate, not automatic.
7. **Assets and fonts on native**: the managed-asset and Fontsource pipeline
   targets browsers; native delivery is unmapped.
8. **Browser sub-builds in an xplat project**: how dashboard/extension/PWA
   entrypoints are expressed when the client framework is Octane rather than
   React Router.

## Evidence

- Coreframe ownership scope: [coreframe AGENTS.md](../../../coreframe/AGENTS.md),
  [docs index](../../../coreframe/docs/index.md),
  [runtime model](../../../coreframe/docs/coreframe-model.md),
  [commands reference](../../../coreframe/docs/reference/commands.md),
  [template config](../../../coreframe/template/coreframe.config.ts).
- Xplat surface: [repository orientation](repository.md),
  [status](../../docs/notes/status.md),
  [UI barrel](../../packages/ui/src/index.shared.ts),
  [platform barrel](../../packages/platform/src/index.ts).
- Concrete boundary analysis: [foxtrot-migration-gaps.md](foxtrot-migration-gaps.md),
  especially the "Recommended home / action" column and architectural gates.

Coverage: direction doc only; no public behavior, recipes, or maintained
examples changed. Evidence is source-level, not a runtime qualification of the
post-migration stack.

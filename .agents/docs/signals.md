# Signals and data fetching

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

- **Octane signals** (`octane/signals`, `octane/signals/client`) — the
  framework's reactive state engine. `signal$(initial)` for module-level
  shared state (document-local on web), `useSignal$` for component-local,
  `derived$` for computed values, `query$(select, load)` for async data
  (return `skip` from the selector for "no request"; read via
  `.snapshot()`/`.get()` under `@try`/`@pending`/`@catch`). Native `.get()`
  reads in render subscribe automatically — no compiler flags needed. Every
  consuming module needs a runtime import of `octane/signals` (or /client).
  `$`-suffix naming (`count$`, `user$`) tells the compiler to preserve native
  reads through caches and props. `query$` is the default data-fetching path
  — see `docs/data.md`. `@octanejs/tanstack-query` is a supported opt-in for
  apps that want TanStack's cache machinery; on native it needs the entry
  shims documented in `docs/data.md`.

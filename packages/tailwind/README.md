# Xplat Tailwind integration development

This private workspace is the implementation of the Xplat-owned integration.
It uses the official Tailwind v4 compiler and reads the renderer target from
Xplat's platform CSS preset. It is not ready to publish: native adaptation,
framework utility separation, consumer qualification and release setup remain
required by the [styling constraints](../../.agents/docs/notes/styling-notes.md#original-shared-pipeline).

The current compiler path is exercised through this workspace's tests and
filtered typecheck. Native entry compilation fails explicitly until its adapter
is qualified; ordinary CSS is not filtered by a Tailwind property allowlist.

Compilation is configured during Vite's `config` hook after platform CSS setup.
Changing PostCSS in `configResolved` misses the per-environment configuration.
The compiler preserves its AST for source maps and leaves minification to Vite;
Tailwind's own optimize pass reparses generated CSS without original locations.
Vite's production CSS extraction does not emit a CSS source-map asset; do not
claim production CSS maps from compiler or development-map evidence.

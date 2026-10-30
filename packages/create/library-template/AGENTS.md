# Library package notes

- Use Bun 1.4.4 for package management.
- Keep build dependencies in `catalog:xplat`. Use `bunx @octane-xplat/cli@latest upgrade --check` to preview a workspace-wide version/patch update and `bunx @octane-xplat/cli@latest upgrade` to apply it. Keep consumer peer ranges under the library's control; run `bun run xplat doctor` and the package checks afterward.
- Keep the public API in `src/index.ts` and `src/index.web.ts`; both barrels
  must export the same names and types.
- Put shared prop contracts in `src/props.ts` and document public exports.
- The unsuffixed `.tsx` file is the NativeScript implementation. Add a
  `.web.tsx` sibling when browser behavior or markup needs to differ. Native
  files start with `/** @jsxImportSource @octane-xplat/jsx */`; browser files
  start with `/** @jsxImportSource @octane-xplat/jsx/dom */`.
- Keep DOM globals out of native files. Use the shared `@octane-xplat/ui`
  elements when behavior can be shared.
- Give every exported function and value an explicit type; `bun run typegen`
  writes each file's declarations on its own and reports missing ones.
- Declare every imported package. Runtime plugins belong in `dependencies`;
  Octane and renderer packages belong in `peerDependencies` when consumers
  supply the runtime.
- Before publishing, run `bun run typecheck`, `bun run lint`, `bun run test`,
  `bun run typegen`, and `bun run test:packed`.

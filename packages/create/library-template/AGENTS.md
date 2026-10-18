# Library package notes

- Use pnpm for package management.
- Keep build dependencies in `catalog:xplat`. Use `pnpm dlx @octane-xplat/cli@latest upgrade --check` to preview a workspace-wide version/patch update and `pnpm dlx @octane-xplat/cli@latest upgrade` to apply it. Keep consumer peer ranges under the library's control; run `pnpm xplat doctor` and the package checks afterward.
- Keep the public API in `src/index.ts` and `src/index.web.ts`; both barrels
  must export the same names and types.
- Put shared prop contracts in `src/props.ts` and document public exports.
- The unsuffixed `.tsx` file is the NativeScript implementation. Add a
  `.web.tsx` sibling when browser behavior or markup needs to differ. Native
  files start with `/** @jsxImportSource @nativescript-community/octane */`.
- Keep DOM globals out of native files. Use the shared `@octane-xplat/ui`
  elements when behavior can be shared.
- Declare every imported package. Runtime plugins belong in `dependencies`;
  Octane and renderer packages belong in `peerDependencies` when consumers
  supply the runtime.
- Before publishing, run `pnpm typecheck`, `pnpm lint`, `pnpm test`,
  `pnpm typegen`, and `pnpm test:packed`.

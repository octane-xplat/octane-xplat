### Native dev boot in hoisted pnpm workspaces

Apps inside a `nodeLinker: hoisted` pnpm workspace (where the app's own
`node_modules` is empty and packages install at the workspace root) crashed
on iOS/Android dev boot with `TypeError: __octaneUniversalPlan is not a
function`. The dev server could not read the package's `package.json` at
`<app>/node_modules`, so a vendored package's deep `dist/` specifier never
folded back to its bare package id and the device vendor registry missed
it. The patch now resolves installed package metadata through Node's
ancestor `node_modules` chain, matching pnpm hoisted, npm, and Yarn classic
workspace layouts — no app changes needed.

```yaml
# pnpm-workspace.yaml at the workspace root
packages:
  - 'apps/*'
nodeLinker: hoisted
```

See the [toolchain guide](https://octane-xplat.goddardai.org/toolchain).

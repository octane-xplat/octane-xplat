// Ambient types for the virtual module served by `devtoolsPanels`
// (src/host/panels.ts) — wired into the generated `xplat devtools` config and
// the apps/devtools harness config.
declare module 'virtual:octane-devtools-panels' {
  import type { DevtoolsPanelPlugin } from '../panel/index.ts'

  const plugins: readonly DevtoolsPanelPlugin[]

  export default plugins
}

// `@octane-xplat/tweaks/devtools` — the Tweaks tab for the devtools desktop
// app. Discovered by `devtoolsPanels` through this package's
// `octaneXplat.devtoolsPanel` field; the module must default-export a
// DevtoolsPanelPlugin.
import { defineDevtoolsPanel } from '@octane-xplat/devtools/panel'
import { TweaksPanel } from './Panel.tsrx'

export default defineDevtoolsPanel({
  id: 'tweaks',
  title: 'Tweaks',
  Panel: TweaksPanel,
})

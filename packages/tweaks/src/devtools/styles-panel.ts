import { defineDevtoolsPanel } from '@octane-xplat/devtools/panel'
import { StylesPanel } from './Panel.tsrx'

export default defineDevtoolsPanel({
  id: 'styles',
  title: 'Styles',
  Panel: StylesPanel,
})

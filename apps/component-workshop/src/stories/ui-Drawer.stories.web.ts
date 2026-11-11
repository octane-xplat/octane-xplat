import { DrawerExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'ui-drawer/basic',
  title: 'Drawer / Basic',
  componentId: '@octane-xplat/ui#Drawer',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})

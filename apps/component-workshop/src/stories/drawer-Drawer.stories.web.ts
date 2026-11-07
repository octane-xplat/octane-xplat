import { DrawerExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'drawer-drawer/basic',
  title: 'Drawer (drawer) / Basic',
  componentId: '@octane-xplat/drawer#Drawer',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})

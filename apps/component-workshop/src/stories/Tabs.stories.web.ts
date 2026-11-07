import { TabsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tabs/basic',
  title: 'Tabs / Basic',
  componentId: '@octane-xplat/ui#Tabs',
  targets: ['web'],
  component: Example,
  args: {},
})

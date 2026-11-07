import { RouteOutletExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'routeoutlet/basic',
  title: 'RouteOutlet / Basic',
  componentId: '@octane-xplat/ui#RouteOutlet',
  targets: ['web'],
  component: Example,
  args: {},
})

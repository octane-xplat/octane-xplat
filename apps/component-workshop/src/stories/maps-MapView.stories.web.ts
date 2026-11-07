import { MapView as Example } from '@octane-xplat/maps'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'maps-mapview/basic',
  title: 'MapView (maps) / Basic',
  componentId: '@octane-xplat/maps#MapView',
  targets: ['web'],
  capabilities: ['map-provider-configuration'],
  component: Example,
  args: {},
})

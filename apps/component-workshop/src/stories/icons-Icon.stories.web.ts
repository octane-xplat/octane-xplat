import { IconExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'icons-icon/basic',
  title: 'Icon (icons) / Basic',
  componentId: '@octane-xplat/icons#Icon',
  gallery: { group: 'primitives' },
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})

import { defineStory } from '@octane-xplat/workshop'
import { Badge } from './Badge'

export const Basic = defineStory({
  id: 'badge/basic',
  title: 'Badge / Basic',
  componentId: 'library/Badge',
  targets: ['web', 'ios', 'android'],
  component: Badge,
  args: { label: 'Ready' },
  controls: { label: { type: 'string' } },
})

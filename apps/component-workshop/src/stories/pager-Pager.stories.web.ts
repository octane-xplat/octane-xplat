import { PagerExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'pager-pager/basic',
  title: 'Pager (pager) / Basic',
  componentId: '@octane-xplat/pager#Pager',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})

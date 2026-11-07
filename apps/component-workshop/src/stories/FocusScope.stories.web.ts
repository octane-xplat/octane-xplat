import { FocusScopeExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'focusscope/basic',
  title: 'FocusScope / Basic',
  componentId: '@octane-xplat/ui#FocusScope',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})

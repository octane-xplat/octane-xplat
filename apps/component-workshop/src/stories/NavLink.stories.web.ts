import { NavLinkExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'navlink/basic',
  title: 'NavLink / Basic',
  componentId: '@octane-xplat/ui#NavLink',
  targets: ['web'],
  component: Example,
  args: {},
})

import { NavigationMenuExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'navigationmenu/basic',
  title: 'NavigationMenu / Basic',
  componentId: '@octane-xplat/ui#NavigationMenu',
  targets: ['web'],
  component: Example,
  args: {},
})

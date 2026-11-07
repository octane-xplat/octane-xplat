// Uses the maintained FormLayoutShowcase example; do not copy its implementation here.
import { FormLayoutShowcase as Example } from '@xplat/astryx-sandbox/examples/formlayout/FormLayoutShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'formlayout/basic',
  title: 'FormLayout / Basic',
  componentId: '@octane-xplat/ui#FormLayout',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})

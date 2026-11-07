// Uses the maintained TextInputShowcase example; do not copy its implementation here.
import { TextInputShowcase as Example } from '@xplat/astryx-sandbox/examples/textinput/TextInputShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'textinput/basic',
  title: 'TextInput / Basic',
  componentId: '@octane-xplat/ui#TextInput',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})

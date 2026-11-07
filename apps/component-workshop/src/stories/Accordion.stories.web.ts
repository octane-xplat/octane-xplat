import { AccordionExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'accordion/basic',
  title: 'Accordion / Basic',
  componentId: '@octane-xplat/ui#Accordion',
  targets: ['web'],
  component: Example,
  args: {},
})

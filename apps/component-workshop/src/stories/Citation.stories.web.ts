// Uses the maintained CitationShowcase example; do not copy its implementation here.
import { CitationShowcase as Example } from '@xplat/astryx-sandbox/examples/citation/CitationShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'citation/basic',
  title: 'Citation / Basic',
  componentId: '@octane-xplat/ui#Citation',
  targets: ['web'],
  component: Example,
  args: {},
})

// Uses the maintained InternationalizationProvider03RtlDirection example; do not copy its implementation here.
import { InternationalizationProvider03RtlDirection as Example } from '@xplat/astryx-sandbox/examples/internationalization/InternationalizationProvider03RtlDirection.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'pagination/basic',
  title: 'Pagination / Basic',
  componentId: '@octane-xplat/ui#Pagination',
  targets: ['web'],
  component: Example,
  args: {},
})

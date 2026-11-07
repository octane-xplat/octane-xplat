// Uses the maintained CalendarShowcase example; do not copy its implementation here.
import { CalendarShowcase as Example } from '@xplat/astryx-sandbox/examples/calendar/CalendarShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'calendar/basic',
  title: 'Calendar / Basic',
  componentId: '@octane-xplat/ui#Calendar',
  targets: ['web'],
  component: Example,
  args: {},
})

// Uses the maintained BottomSheetSwitcherReviewFlow example; do not copy its implementation here.
import { BottomSheetSwitcherReviewFlow as Example } from '@xplat/astryx-sandbox/examples/bottomsheet/BottomSheetSwitcherReviewFlow.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'bottomsheetswitcher/basic',
  title: 'BottomSheetSwitcher / Basic',
  componentId: '@octane-xplat/ui#BottomSheetSwitcher',
  targets: ['web'],
  component: Example,
  args: {},
})

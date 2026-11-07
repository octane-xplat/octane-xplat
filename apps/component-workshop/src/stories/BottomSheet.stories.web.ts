// Uses the maintained BottomSheetShowcase example; do not copy its implementation here.
import { BottomSheetShowcase as Example } from '@xplat/astryx-sandbox/examples/bottomsheet/BottomSheetShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'bottomsheet/basic',
  title: 'BottomSheet / Basic',
  componentId: '@octane-xplat/ui#BottomSheet',
  targets: ['web'],
  component: Example,
  args: {},
})

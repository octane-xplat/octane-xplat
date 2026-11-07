// Uses the maintained AlertDialogAsyncAction example; do not copy its implementation here.
import { AlertDialogAsyncAction as Example } from '@xplat/astryx-sandbox/examples/dialog/AlertDialogAsyncAction.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'alertdialog/basic',
  title: 'AlertDialog / Basic',
  componentId: '@octane-xplat/ui#AlertDialog',
  targets: ['web'],
  component: Example,
  args: {},
})

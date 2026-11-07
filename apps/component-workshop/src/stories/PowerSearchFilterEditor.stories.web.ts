import { PowerSearchFilterEditorExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'powersearchfiltereditor/basic',
  title: 'PowerSearchFilterEditor / Basic',
  componentId: '@octane-xplat/ui#PowerSearchFilterEditor',
  targets: ['web'],
  component: Example,
  args: {},
})

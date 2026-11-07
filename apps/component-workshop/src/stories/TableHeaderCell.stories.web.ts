import { TablePartsExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tableheadercell/basic',
  title: 'TableHeaderCell / Basic',
  componentId: '@octane-xplat/ui#TableHeaderCell',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})

// Uses the maintained MetadataListItemShowcase example; do not copy its implementation here.
import { MetadataListItemShowcase as Example } from '@xplat/astryx-sandbox/examples/metadatalistitem/MetadataListItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'metadatalistitem/basic',
  title: 'MetadataListItem / Basic',
  componentId: '@octane-xplat/ui#MetadataListItem',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})

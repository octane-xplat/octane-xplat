// Uses the maintained MetadataListShowcase example; do not copy its implementation here.
import { MetadataListShowcase as Example } from '@xplat/astryx-sandbox/examples/metadatalist/MetadataListShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'metadatalist/basic',
  title: 'MetadataList / Basic',
  componentId: '@octane-xplat/ui#MetadataList',
  targets: ['web'],
  component: Example,
  args: {},
})

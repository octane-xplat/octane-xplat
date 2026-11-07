// Uses the maintained BreadcrumbItemShowcase example; do not copy its implementation here.
import { BreadcrumbItemShowcase as Example } from '@xplat/astryx-sandbox/examples/breadcrumbitem/BreadcrumbItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'breadcrumbitem/basic',
  title: 'BreadcrumbItem / Basic',
  componentId: '@octane-xplat/ui#BreadcrumbItem',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})

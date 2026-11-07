// Uses the maintained InternationalizationProvider01ShippedLocale example; do not copy its implementation here.
import { InternationalizationProvider01ShippedLocale as Example } from '@xplat/astryx-sandbox/examples/internationalization/InternationalizationProvider01ShippedLocale.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'internationalizationprovider/basic',
  title: 'InternationalizationProvider / Basic',
  componentId: '@octane-xplat/ui#InternationalizationProvider',
  targets: ['web'],
  component: Example,
  args: {},
})

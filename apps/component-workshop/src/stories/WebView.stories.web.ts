import { WebViewExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'webview/basic',
  title: 'WebView / Basic',
  componentId: '@octane-xplat/ui#WebView',
  targets: ['web'],
  component: Example,
  args: {},
})

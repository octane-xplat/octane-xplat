import { MarkdownPluginNodeRendererExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'markdownpluginnoderenderer/basic',
  title: 'MarkdownPluginNodeRenderer / Basic',
  componentId: '@octane-xplat/ui/markdown#MarkdownPluginNodeRenderer',
  targets: ['web'],
  component: Example,
  args: {},
})

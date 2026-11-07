// Uses the maintained AppShellShowcase example; do not copy its implementation here.
import { AppShellShowcase as Example } from '@xplat/astryx-sandbox/examples/appshell/AppShellShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'appshell/basic',
  title: 'AppShell / Basic',
  componentId: '@octane-xplat/ui#AppShell',
  targets: ['web'],
  component: Example,
  args: {},
})

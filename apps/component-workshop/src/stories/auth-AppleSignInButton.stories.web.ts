import { AppleSignInButton as Example } from '@octane-xplat/auth'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'auth-applesigninbutton/basic',
  title: 'AppleSignInButton (auth) / Basic',
  componentId: '@octane-xplat/auth#AppleSignInButton',
  targets: ['web'],
  capabilities: ['provider-credentials'],
  component: Example,
  args: {},
})

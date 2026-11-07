import { GoogleSignInButton as Example } from '@octane-xplat/auth'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'auth-googlesigninbutton/basic',
  title: 'GoogleSignInButton (auth) / Basic',
  componentId: '@octane-xplat/auth#GoogleSignInButton',
  targets: ['web'],
  capabilities: ['provider-credentials'],
  component: Example,
  args: {},
})

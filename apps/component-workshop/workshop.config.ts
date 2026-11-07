import { defineWorkshopConfig } from '@octane-xplat/workshop'

export default defineWorkshopConfig({
  defaultView: 'gallery',
  providerModules: ['./src/providers.web.tsrx'],
  stories: { include: ['src/stories/*.stories.ts', 'src/stories/*.stories.web.ts'] },
})

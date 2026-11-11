import { defineConfig } from '@bamboocss/dev'
import { xplatBambooConfig } from '@octane-xplat/bamboo'

export default defineConfig({
  ...xplatBambooConfig,
  include: ['src/**/*.ts'],
  outdir: 'src/styled-system',
})

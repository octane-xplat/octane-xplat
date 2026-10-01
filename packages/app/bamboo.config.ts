import { defineConfig } from '@bamboocss/dev'
import { xplatBambooConfig } from '@octane-xplat/bamboo'

export default defineConfig({
	...xplatBambooConfig,
	include: ['src/**/*.{ts,tsx,js,jsx}'],
	outdir: 'src/styled-system',
})

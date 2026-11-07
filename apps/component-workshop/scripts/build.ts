import { workshopBuild } from '@octane-xplat/workshop/node'
import './coverage.ts'

await workshopBuild({ outDir: 'dist', base: '/workshop/' })

await import('./copy-assets.ts')

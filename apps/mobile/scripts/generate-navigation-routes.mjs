import { fileURLToPath } from 'node:url'
import { generateRoutes } from '../../../packages/cli/dist/route-generator.js'

await generateRoutes(
  fileURLToPath(new URL('../navigation-project/', import.meta.url)),
  undefined,
  undefined,
  { bake: true },
)

import { fileURLToPath } from 'node:url'
import { generateRoutes } from '../../../packages/cli/dist/commands/routes.js'

await generateRoutes(
	fileURLToPath(new URL('../navigation-project/', import.meta.url)),
	undefined,
	undefined,
	{ bake: true },
)

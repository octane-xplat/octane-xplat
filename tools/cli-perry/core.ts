import { runCatalog } from './catalog.ts'
import { runProject } from './project.ts'
import { runIo } from './io.ts'

const command = process.argv[2]
if (!command || command === '--help' || command === 'catalog' || command === 'schema') {
	runCatalog(command === 'catalog' ? [] : process.argv.slice(2))
} else if (command === 'discover' || command === 'platforms' || command === 'binding') {
	runProject(process.argv.slice(2))
} else if (command === 'http' || command === 'child') {
	runIo(process.argv.slice(2))
} else {
	console.error('Unknown prototype command')
	process.exitCode = 2
}

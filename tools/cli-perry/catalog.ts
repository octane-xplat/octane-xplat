import { catalogPayload, commandSchema } from './cli/agent/catalog.ts'
import { AGENT_COMMANDS } from './cli/agent/commands.ts'

export function runCatalog(args: string[]): void {
	const name = args[0]
	if (name === '--help') {
		console.log(AGENT_COMMANDS.map((command) => `${command.name}: ${command.summary}`).join('\n'))
	} else if (name === 'schema') {
		const command = AGENT_COMMANDS.find((command) => command.name === args[1])
		if (!command) {
			console.error('Unknown command')
			process.exit(2)
		}
		console.log(JSON.stringify(commandSchema(command)))
	} else {
		console.log(JSON.stringify(catalogPayload()))
	}
}

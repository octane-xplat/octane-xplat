import { discoverWorkspace, detectPlatforms, resolveFrameworkBinding } from './cli/mcp/discovery.ts'

export function runProject(args: string[]): void {
	const root = args[1]
	if (args[0] === 'binding') {
		console.log(JSON.stringify(resolveFrameworkBinding(root, args[2])))
	} else if (args[0] === 'platforms') {
		console.log(JSON.stringify(detectPlatforms(root)))
	} else {
		console.log(JSON.stringify(discoverWorkspace(root)))
	}
}

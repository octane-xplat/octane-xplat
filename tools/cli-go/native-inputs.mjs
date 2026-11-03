import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
export function nativeInputs(root) {
	const files = ['packages/cli/go', 'tools/cli-go'].flatMap((directory) =>
		readdirSync(join(root, directory), { recursive: true })
			.filter((file) => /\.(go|mod|sum|json|mjs|txt)$/.test(file))
			.map((file) => directory + '/' + file.replaceAll('\\', '/')),
	)
	for (const directory of ['packages/cli/src/agent', 'packages/cli/src/mcp/contracts']) {
		for (const file of readdirSync(join(root, directory))) {
			if (file.endsWith('.ts')) {
				files.push(directory + '/' + file)
			}
		}
	}
	files.push(
		'packages/cli/package.json',
		'packages/create/compatibility.json',
		'packages/cli/src/cli-channel.ts',
	)
	return Object.fromEntries(
		files.sort().map((file) => [file, sha256(readFileSync(join(root, file)))]),
	)
}

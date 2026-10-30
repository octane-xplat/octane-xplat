import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

// Operational output belongs outside Git, even when a caller supplies a path.
export function localOutputFile(path, root = process.cwd()) {
	const output = resolve(root, path)
	const rel = relative(root, output)
	const outside = isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)

	if (!outside) {
		const ignored = spawnSync('git', ['check-ignore', '--no-index', '--quiet', '--', rel], {
			cwd: root,
		})

		if (ignored.status !== 0) {
			throw new Error('Operational output must be Git-ignored or outside the repository: ' + path)
		}
	}

	mkdirSync(dirname(output), { recursive: true })
	return output
}

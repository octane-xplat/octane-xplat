import { execFileSync } from 'node:child_process'

/** On-demand vendor submodule init. `git worktree add` and plain clones do not
 *  populate the `src/vendor` checkouts, and the failure surfaces much later as
 *  a typegen/module-resolution error. Runs inside the turbo graph via
 *  `//#submodules` so it executes only when a task that needs it is scheduled;
 *  `git submodule status` is a cheap no-op check when everything is initialized. */
try {
	const status = execFileSync('git', ['submodule', 'status'], { encoding: 'utf8' })
	const missing = status
		.split('\n')
		.filter((line) => line.startsWith('-'))
		.map((line) => line.slice(1).trim().split(/\s+/)[1])

	if (missing.length > 0) {
		console.log(`submodules: initializing ${missing.join(', ')}`)
		execFileSync('git', ['submodule', 'update', '--init', '--', ...missing], { stdio: 'inherit' })
	}
} catch (error) {
	console.warn(`submodules: skipped (${error})`)
}

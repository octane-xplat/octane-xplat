// @ts-nocheck — shared legacy diagnostic probes; native callers own the process tree.
import { execFileSync } from 'node:child_process'

export const runDoctorTool = (cmd, args, cwd = process.cwd(), timeout = 15000) => {
	try {
		// Windows package managers commonly expose .cmd shims. Keep this shell
		// exception limited to fixed version commands; other argv stays literal.
		const shell =
			process.platform === 'win32' &&
			['bun', 'pnpm'].includes(cmd) &&
			args.length === 1 &&
			args[0] === '--version'

		return {
			ok: true,
			out: execFileSync(shell ? `${cmd} --version` : cmd, shell ? [] : args, {
				shell,
				encoding: 'utf8',
				cwd,
				timeout,
				stdio: ['ignore', 'pipe', 'pipe'],
			})
				.trim()
				.split('\n')[0],
		}
	} catch (error) {
		return {
			ok: false,
			out: [error.stdout, error.stderr].filter(Boolean).join('\n').trim(),
		}
	}
}

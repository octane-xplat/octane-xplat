// @ts-nocheck — shared legacy diagnostic probes; native callers own the process tree.
import { execFileSync } from 'node:child_process'

export const runDoctorTool = (cmd, args, cwd = process.cwd(), timeout = 15000) => {
	try {
		return {
			ok: true,
			out: execFileSync(cmd, args, {
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

// Structured checks are shared with explicit native-worker operations.
import { command } from '@alloc/cmd-ts'
import * as p from '@clack/prompts'
import { inspectDoctor } from '../doctor-checks.ts'
export { findMissingPluginDeclarations, findHmrScopeGaps } from '../doctor-checks.ts'

export const doctor = command({
	name: 'doctor',
	description: 'Check the toolchain required by this project’s declared targets',
	args: {},
	handler: async () => {
		p.intro('xplat doctor')
		const report = await inspectDoctor({
			onMessage: (message) => p.log[message.level](message.text),
		})
		for (const row of report.rows) {
			if (row.ok) {
				p.log.success(`${row.name} — ${row.detail || 'ok'}`)
			} else {
				p.log.warn(`${row.name} — ${row.detail || 'missing'}${row.hint ? ` (${row.hint})` : ''}`)
			}
		}
		p.outro(report.summary)
		if (report.exitCode) {
			if (report.diagnosticStderr) {
				console.error(report.diagnosticStderr)
			}

			process.exitCode = report.exitCode
		}
	},
})

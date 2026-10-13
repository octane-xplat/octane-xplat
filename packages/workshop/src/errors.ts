/** Failure phases surfaced by the workshop shell and CLI. */
export type WorkshopErrorPhase =
	| 'discovery'
	| 'compile'
	| 'fixture'
	| 'mount'
	| 'interaction'
	| 'cleanup'
	| 'launch'
	| 'connection'

export class WorkshopError extends Error {
	readonly phase: WorkshopErrorPhase
	readonly storyId?: string
	readonly sourceLocation?: string

	constructor(
		phase: WorkshopErrorPhase,
		message: string,
		options?: { storyId?: string; cause?: unknown; sourceLocation?: string },
	) {
		super(message)
		this.name = 'WorkshopError'
		this.phase = phase
		this.storyId = options?.storyId
		this.sourceLocation = options?.sourceLocation
		if (options?.cause !== undefined) {
			;(this as { cause?: unknown }).cause = options.cause
		}
	}
}

export function describeCause(cause: unknown): string {
	if (cause instanceof Error) {
		// JSC stacks often start directly at a `fn@file:line` frame without the
		// `Name: message` head — keep the message visible either way.
		const head = `${cause.name}: ${cause.message}`
		const tail = cause.stack?.split('\n').slice(0, 3).join('\n')
		if (!tail) { return head }
		return tail.startsWith(head) ? tail : `${head}\n${tail}`
	}

	return String(cause)
}

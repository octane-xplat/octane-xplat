// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Session, job, and ownership contract — see sessions.d.ts.

import { randomUUID } from 'node:crypto'
import { contractError } from './errors.ts'

export const SESSION_STATES = ['starting', 'ready', 'disconnected', 'stopped']
export const JOB_STATES = ['queued', 'running', 'succeeded', 'failed', 'cancelling', 'cancelled']
export const JOB_TERMINAL_STATES = ['succeeded', 'failed', 'cancelled']

const live = (job) =>
	job.state === 'queued' || job.state === 'running' || job.state === 'cancelling'

export function createSessionRegistry() {
	const sessions = new Map()
	const cleanups = new Map()

	return {
		bindOwned(input) {
			const session = {
				sessionId: `sess_${randomUUID()}`,
				appId: input.appId,
				platform: input.platform,
				targetId: input.targetId,
				ownership: 'owned',
				state: 'starting',
				createdAt: new Date().toISOString(),
				processKind: null,
				detail: input.detail,
			}

			sessions.set(session.sessionId, session)
			cleanups.set(session.sessionId, input.cleanup ?? null)
			return { ...session }
		},

		attach(input) {
			const session = {
				sessionId: `sess_${randomUUID()}`,
				appId: input.appId,
				platform: input.platform,
				targetId: input.targetId,
				ownership: 'attached',
				state: 'ready',
				createdAt: new Date().toISOString(),
				processKind: input.processKind ?? null,
				buildIdentity: input.buildIdentity,
				detail: input.detail,
			}

			sessions.set(session.sessionId, session)
			return { ...session }
		},

		get(sessionId) {
			const session = sessions.get(sessionId)
			return session ? { ...session } : null
		},

		requireUsable(sessionId) {
			const session = sessions.get(sessionId)
			if (!session) {
				return {
					usable: false,
					error: contractError('not_found', `No session "${sessionId}".`, {
						recovery: { action: 'List current sessions with xplat_sessions and rebind.' },
					}),
				}
			}

			if (session.state === 'disconnected') {
				return {
					usable: false,
					error: contractError(
						'disconnected_runtime',
						`Session "${sessionId}" is disconnected; last-known data is historical, not current.`,
						{ retryable: true, recovery: { action: 'Reattach or start a new session.' } },
					),
				}
			}

			if (session.state === 'stopped') {
				return {
					usable: false,
					error: contractError(
						'stale_identity',
						`Session "${sessionId}" has stopped; its identity is stale.`,
						{
							recovery: { action: 'Start a new session — restarting always gets a new identity.' },
						},
					),
				}
			}

			return { usable: true, session: { ...session } }
		},

		markReady(sessionId, meta = {}) {
			const session = sessions.get(sessionId)
			if (!session || session.state === 'stopped') {
				return null
			}

			session.state = 'ready'
			if (meta.processKind) {
				session.processKind = meta.processKind
			}

			if (meta.buildIdentity) {
				session.buildIdentity = meta.buildIdentity
			}

			return { ...session }
		},

		markDisconnected(sessionId, detail) {
			const session = sessions.get(sessionId)
			if (!session || session.state === 'stopped') {
				return null
			}

			session.state = 'disconnected'
			session.detail = detail ?? session.detail
			return { ...session }
		},

		async end(sessionId) {
			const session = sessions.get(sessionId)
			if (!session) {
				return { sessionId, ended: false }
			}

			if (session.state === 'stopped') {
				// Idempotent: a second end reports the already-completed cleanup.
				return { sessionId, ended: true }
			}

			session.state = 'stopped'

			if (session.ownership === 'attached') {
				return {
					sessionId,
					ended: true,
					preserved: ['attached user-owned session left running'],
				}
			}

			const cleanup = cleanups.get(sessionId)
			cleanups.delete(sessionId)
			let released = []
			try {
				const out = cleanup ? await cleanup() : undefined
				released = out?.released ?? []
			} catch {
				released = ['cleanup reported a failure — inspect target state manually']
			}

			return { sessionId, ended: true, released }
		},

		async shutdown() {
			const results = []
			for (const sessionId of sessions.keys()) {
				results.push(await this.end(sessionId))
			}

			return results
		},

		list() {
			return [...sessions.values()].map((s) => ({ ...s }))
		},
	}
}

export function createJobRegistry(options = {}) {
	const historyLimit = options.historyLimit ?? 200
	const jobs = new Map()
	const controllers = new Map()

	const trim = () => {
		const finished = [...jobs.values()].filter((j) => JOB_TERMINAL_STATES.includes(j.state))
		if (finished.length <= historyLimit) {
			return
		}

		finished
			.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
			.slice(0, finished.length - historyLimit)
			.forEach((j) => jobs.delete(j.jobId))
	}

	const snapshot = (job) => ({ ...job, progress: job.progress ? { ...job.progress } : undefined })

	const runJob = async (job, run, controller) => {
		job.state = 'running'
		try {
			const result = await run(controller.signal, (progress) => {
				job.progress = { ...job.progress, ...progress }
			})

			job.state = job.state === 'cancelling' ? 'cancelled' : 'succeeded'
			job.result = result
		} catch (error) {
			job.state = job.state === 'cancelling' ? 'cancelled' : 'failed'
			if (job.state === 'failed') {
				job.error = isContractErrorLike(error)
					? error
					: contractError('execution_failure', error?.message ?? 'Job failed')
			}
		} finally {
			job.finishedAt = new Date().toISOString()
			controllers.delete(job.jobId)
			trim()
		}
	}

	const isContractErrorLike = (value) =>
		typeof value === 'object' && value !== null && typeof value.code === 'string'

	return {
		start(input) {
			if (input.requestKey) {
				for (const job of jobs.values()) {
					if (
						live(job) &&
						job.requestKey === input.requestKey &&
						job.kind === input.kind &&
						job.sessionId === input.sessionId
					) {
						return { job: snapshot(job), deduplicated: true }
					}
				}
			}

			const job = {
				jobId: `job_${randomUUID()}`,
				kind: input.kind,
				sessionId: input.sessionId,
				requestKey: input.requestKey,
				state: 'queued',
				createdAt: new Date().toISOString(),
			}

			jobs.set(job.jobId, job)

			if (input.run) {
				const controller = new AbortController()
				controllers.set(job.jobId, controller)
				void runJob(job, input.run, controller)
			}

			return { job: snapshot(job), deduplicated: false }
		},

		status: (jobId) => {
			const job = jobs.get(jobId)
			return job ? snapshot(job) : null
		},

		setProgress(jobId, progress) {
			const job = jobs.get(jobId)
			if (!job || !live(job)) {
				return null
			}

			job.progress = { ...job.progress, ...progress }
			return snapshot(job)
		},

		succeed(jobId, result) {
			const job = jobs.get(jobId)
			if (!job || !live(job)) {
				return null
			}

			job.state = job.state === 'cancelling' ? 'cancelled' : 'succeeded'
			job.result = result
			job.finishedAt = new Date().toISOString()
			controllers.delete(jobId)
			trim()
			return snapshot(job)
		},

		fail(jobId, error) {
			const job = jobs.get(jobId)
			if (!job || !live(job)) {
				return null
			}

			job.state = job.state === 'cancelling' ? 'cancelled' : 'failed'
			job.error = error
			job.finishedAt = new Date().toISOString()
			controllers.delete(jobId)
			trim()
			return snapshot(job)
		},

		cancel(jobId) {
			const job = jobs.get(jobId)
			if (!job) {
				return null
			}

			if (!live(job)) {
				return snapshot(job)
			}

			job.state = 'cancelling'
			const controller = controllers.get(jobId)
			if (controller) {
				controller.abort()
			} else {
				// No runner attached (queued provider-driven job): nothing in flight.
				job.state = 'cancelled'
				job.finishedAt = new Date().toISOString()
			}

			return snapshot(job)
		},

		list() {
			return [...jobs.values()].map(snapshot)
		},
	}
}

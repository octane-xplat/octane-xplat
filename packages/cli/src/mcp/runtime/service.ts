// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Runtime service — work item D (plans/octane-xplat-mcp.md): build, launch,
// attach, logs, status and cleanup for consumer apps on all six platforms.
// Platform mechanics live in ./adapters/*; this service owns the shared
// contract behavior: explicit app+target binding, target-busy contention,
// job dedupe/cancellation, ownership-safe cleanup, bounded logs, and
// capability-matrix entries. Spawned commands are always the app's own
// toolchain (`pnpm exec vite`, `ns run`, the app's installed CLI), so a
// session behaves like the app's installed framework version.

import {
	retainedDiagnostics,
	diagnosticsFromLogs,
	validateDiagnosticsSelection,
} from '../../diagnostics.ts'
import { contractError, toContractError } from '../contracts/errors.ts'
import { createAdapters } from './adapters/index.ts'
import { createLogBuffer } from './logs.ts'
import { cachedExec, execText } from './process.ts'
import { resolveSelection } from '../status.ts'

const JOB_LOG_LIMIT = 40

export function createRuntimeService(context, options = {}) {
	const deps = {
		exec: options.exec ?? cachedExec({ exec: options.execFile ?? execText }),
		spawn: options.spawn,
		fetch: options.fetch,
		host: options.host ?? process.platform,
		env: options.env ?? process.env,
		launchTimeoutMs: options.launchTimeoutMs,
	}

	const adapters = options.adapters ?? createAdapters()
	/** sessionId → { logs, disposers, disposed } — logs kept after end as history. */
	const runtime = new Map()
	const jobLogs = new Map()
	/** appId|platform|targetId → jobId for in-flight launch dedupe. */
	const pendingLaunches = new Map()
	/** requestKey → jobId for build dedupe (job records don't carry platform). */
	const pendingBuilds = new Map()

	const requireApp = () => {
		const selection = resolveSelection(context)
		if (selection.state !== 'bound') {
			return {
				error: contractError(
					selection.state === 'ambiguous' ? 'ambiguous_selection' : 'invalid_selection',
					selection.state === 'ambiguous'
						? 'Several apps are detected — runtime work needs an explicit app binding.'
						: 'No Octane Xplat app is bound.',
					{
						recovery: {
							action: 'Bind an app first — xplat_select_app (MCP) or `xplat app select` (CLI).',
							detail:
								selection.state === 'ambiguous'
									? `Candidates: ${selection.candidates.map((a) => a.id).join(', ')}`
									: undefined,
						},
					},
				),
			}
		}

		return { app: selection.app }
	}

	const requireRuntime = () => {
		const check = context.policy.require('runtime-actions')
		return check.granted ? null : check.error
	}

	const adapterFor = (platform) => {
		const adapter = adapters.get(platform)
		if (!adapter) {
			return {
				error: contractError('invalid_selection', `Unknown platform "${platform}".`, {
					recovery: {
						action: 'Use one of: web, ios, android, macos, linux, windows.',
					},
				}),
			}
		}

		return { adapter }
	}

	const requirePlatform = (app, platform) => {
		if (!app.platforms.includes(platform)) {
			return contractError(
				'invalid_selection',
				`App "${app.id}" does not declare the "${platform}" platform.`,
				{
					recovery: {
						action: 'Pick a declared platform or add the target to the app.',
						detail: `Declared: ${app.platforms.join(', ') || 'none'}`,
					},
				},
			)
		}

		return null
	}

	const liveSessionOn = (appId, platform, targetId) =>
		context.sessions
			.list()
			.find(
				(s) =>
					s.state !== 'stopped' &&
					s.appId === appId &&
					s.platform === platform &&
					s.targetId === targetId,
			)

	const resourcesFor = (sessionId) => {
		let entry = runtime.get(sessionId)
		if (!entry) {
			entry = { logs: createLogBuffer(), disposers: [], disposed: false }
			runtime.set(sessionId, entry)
		}

		return entry
	}

	/** Dispose owned resources for a session — idempotent; keeps the log buffer. */
	const disposeResources = async (sessionId) => {
		const entry = runtime.get(sessionId)
		if (!entry || entry.disposed) {
			return []
		}

		entry.disposed = true
		const released = []
		for (const disposer of [...entry.disposers].reverse()) {
			try {
				const out = await disposer.dispose()
				if (out) {
					released.push(out)
				}
			} catch {
				released.push(
					`cleanup of ${disposer.describe?.() ?? 'a resource'} failed — inspect the target`,
				)
			}
		}

		return released
	}

	const recordJobEvidence = (kind, state, { jobId, session, detail, buildIdentity } = {}) => {
		context.evidence.record({
			kind: 'job',
			summary: `${kind} ${state}${detail ? ` — ${detail}` : ''}`,
			provenance: {
				capturedAt: new Date().toISOString(),
				appId: session?.appId,
				platform: session?.platform,
				targetId: session?.targetId,
				sessionId: session?.sessionId,
				buildIdentity: buildIdentity ?? session?.buildIdentity,
				mechanism: 'none',
			},
			data: { jobId, state, detail },
		})
	}

	const targetBusyError = (session) =>
		contractError(
			'target_busy',
			`Target "${session.targetId}" already has a ${session.ownership} ${session.state} session.`,
			{
				retryable: true,
				context: { sessionId: session.sessionId, ownership: session.ownership },
				recovery: {
					action:
						'End that session with xplat_session_end, or pick a different target. A session owned by another agent/user is never taken over implicitly.',
				},
			},
		)

	const liveJobById = (jobId) => {
		const job = jobId && context.jobs.status(jobId)
		return job && ['queued', 'running', 'cancelling'].includes(job.state) ? job : null
	}

	return {
		adapters,
		deps,

		/** Inspection only receives endpoint metadata from this session's launch. */
		observationTarget(sessionId) {
			const checked = context.sessions.requireUsable(sessionId)
			if (!checked.usable) {
				return { error: checked.error }
			}

			const { app, error } = requireApp()
			if (error) {
				return { error }
			}

			if (checked.session.appId !== app.id) {
				return {
					error: contractError(
						'stale_identity',
						'This session belongs to a different app. Select its app before observing it.',
					),
				}
			}

			return { session: checked.session, endpoint: runtime.get(sessionId)?.endpoint }
		},

		/** Register one capability provider per platform into the shared registry. */
		registerCapabilities() {
			for (const adapter of adapters.values()) {
				context.capabilities.register({
					platform: adapter.platform,
					describe: (app) => adapter.describe(app, deps),
				})
			}
		},

		/** Target discovery for the bound app: availability + busy/ownership state. */
		async listTargets({ platform } = {}) {
			const { app, error } = requireApp()
			if (error) {
				return { error }
			}

			const wanted = platform ? [platform] : app.platforms
			const platforms = []
			for (const name of wanted) {
				const { adapter, error: platformError } = adapterFor(name)
				if (platformError) {
					return { error: platformError }
				}

				if (!app.platforms.includes(name)) {
					platforms.push({
						platform: name,
						declared: false,
						targets: [],
						reason: `App "${app.id}" does not declare this platform.`,
					})

					continue
				}

				const found = await adapter.discoverTargets(app, deps)
				platforms.push({
					platform: name,
					declared: true,
					reason: found.reason,
					targets: found.targets.map((target) => {
						const bound = liveSessionOn(app.id, name, target.targetId)
						return {
							...target,
							busy: Boolean(bound),
							...(bound
								? {
										session: {
											sessionId: bound.sessionId,
											ownership: bound.ownership,
											state: bound.state,
										},
									}
								: {}),
						}
					}),
				})
			}

			return { app: app.id, platforms }
		},

		/** Build job for a declared platform — deduped by requestKey. */
		async build({ platform, requestKey } = {}) {
			const { app, error } = requireApp()
			if (error) {
				return { error }
			}

			const permission = requireRuntime()
			if (permission) {
				return { error: permission }
			}

			const selection = requirePlatform(app, platform)
			if (selection) {
				return { error: selection }
			}

			const { adapter, error: adapterError } = adapterFor(platform)
			if (adapterError) {
				return { error: adapterError }
			}

			if (requestKey) {
				const existing = liveJobById(pendingBuilds.get(`${platform}|${requestKey}`))
				if (existing) {
					return { job: existing, deduplicated: true }
				}
			}

			const logs = createLogBuffer()
			const started = context.jobs.start({
				kind: 'build',
				requestKey,
				run: async (signal, report) => {
					report({ phase: 'starting', platform })
					try {
						const result = await adapter.build({
							app,
							logs,
							signal,
							report: (p) => report({ ...p, platform }),
							deps,
						})

						recordJobEvidence('build', 'succeeded', {
							jobId: started.job.jobId,
							session: { appId: app.id, platform },
							detail: result.summary,
							buildIdentity: result.buildIdentity,
						})

						return { platform, appId: app.id, ...result }
					} catch (buildError) {
						recordJobEvidence('build', 'failed', {
							jobId: started.job.jobId,
							session: { appId: app.id, platform },
							detail: buildError.message,
						})

						throw buildError
					}
				},
			})

			jobLogs.set(started.job.jobId, logs)
			if (jobLogs.size > JOB_LOG_LIMIT) {
				jobLogs.delete(jobLogs.keys().next().value)
			}

			if (requestKey) {
				pendingBuilds.set(`${platform}|${requestKey}`, started.job.jobId)
			}

			return { job: started.job, deduplicated: started.deduplicated }
		},

		/**
		 * Owned dev-session launch: binds the session first (a second caller
		 * sees target_busy immediately), then runs the adapter's launch as a
		 * job. The job completes at readiness; the process stays owned by the
		 * session. A failed job ends the session.
		 */
		async launch({ platform, targetId, requestKey, browserMode = 'headless' } = {}) {
			const { app, error } = requireApp()
			if (error) {
				return { error }
			}

			const permission = requireRuntime()
			if (permission) {
				return { error: permission }
			}

			const selection = requirePlatform(app, platform)
			if (selection) {
				return { error: selection }
			}

			const { adapter, error: adapterError } = adapterFor(platform)
			if (adapterError) {
				return { error: adapterError }
			}

			// Pick the target: explicit id, or the only available one.
			const { targets, reason } = await adapter.discoverTargets(app, deps)
			let target
			if (targetId) {
				target = targets.find((t) => t.targetId === targetId)
				if (!target) {
					return {
						error: contractError('invalid_selection', `No ${platform} target "${targetId}".`, {
							recovery: {
								action: 'Pick a targetId from xplat_targets.',
								detail:
									reason ?? `Available: ${targets.map((t) => t.targetId).join(', ') || 'none'}`,
							},
							context: { targets: targets.map((t) => t.targetId) },
						}),
					}
				}
			} else if (targets.length === 1) {
				target = targets[0]
			} else if (targets.length === 0) {
				return {
					error: contractError(
						'prerequisite_missing',
						`No ${platform} targets are available${reason ? ` — ${reason}` : ''}.`,
						{ recovery: { action: 'Connect a device/emulator or fix the toolchain, then retry.' } },
					),
				}
			} else {
				return {
					error: contractError(
						'ambiguous_selection',
						`Several ${platform} targets are available — pick one explicitly.`,
						{
							recovery: { action: 'Pass targetId from xplat_targets.' },
							context: { targets: targets.map((t) => ({ targetId: t.targetId, name: t.name })) },
						},
					),
				}
			}

			// An in-flight launch for the same target IS the same operation —
			// converge on its job instead of failing busy. A ready/attached
			// session on the target is a real conflict.
			const key = `${app.id}|${platform}|${target.targetId}`
			const pending = liveJobById(pendingLaunches.get(key))
			if (pending) {
				return {
					session: context.sessions.get(pending.sessionId),
					job: pending,
					deduplicated: true,
				}
			}

			const busy = liveSessionOn(app.id, platform, target.targetId)
			if (busy) {
				return { error: targetBusyError(busy) }
			}

			const session = context.sessions.bindOwned({
				appId: app.id,
				platform,
				targetId: target.targetId,
				detail: `launch on ${target.name}`,
				cleanup: async () => {
					pendingLaunches.delete(key)
					return { released: await disposeResources(session.sessionId) }
				},
			})

			const resources = resourcesFor(session.sessionId)

			const started = context.jobs.start({
				kind: 'launch',
				sessionId: session.sessionId,
				requestKey,
				run: async (signal, report) => {
					try {
						const outcome = await adapter.launch({
							app,
							target,
							session,
							logs: resources.logs,
							signal,
							report,
							claim: (disposer) => resources.disposers.push(disposer),
							browserMode,
							deps,
						})

						resources.endpoint = { url: outcome.url, browser: outcome.browser }
						context.sessions.markReady(session.sessionId, {
							processKind: outcome.processKind ?? 'fresh',
							buildIdentity: outcome.buildIdentity,
						})

						outcome.mainProcess?.exit.then(({ code, signal: sig }) =>
							context.sessions.markDisconnected(
								session.sessionId,
								`launch process exited (code=${code ?? 'null'}${sig ? `, signal=${sig}` : ''})`,
							),
						)

						recordJobEvidence('launch', 'succeeded', {
							jobId: started.job.jobId,
							session: context.sessions.get(session.sessionId),
							detail: outcome.detail,
						})

						return outcome
					} catch (launchError) {
						// Failed launch ends the owned session — its resources are
						// released through the registered cleanup, and the binding
						// identity stays stale rather than pretending to be usable.
						recordJobEvidence('launch', 'failed', {
							jobId: started.job.jobId,
							session: context.sessions.get(session.sessionId),
							detail: launchError.message,
						})

						await context.sessions.end(session.sessionId)
						throw launchError
					}
				},
			})

			pendingLaunches.set(key, started.job.jobId)
			return { session, job: started.job, deduplicated: false }
		},

		/** Bind a compatible pre-existing dev session — never restarts it. */
		async attach({ platform, targetId } = {}) {
			const { app, error } = requireApp()
			if (error) {
				return { error }
			}

			const permission = requireRuntime()
			if (permission) {
				return { error: permission }
			}

			const selection = requirePlatform(app, platform)
			if (selection) {
				return { error: selection }
			}

			const { adapter, error: adapterError } = adapterFor(platform)
			if (adapterError) {
				return { error: adapterError }
			}

			if (typeof adapter.attachables !== 'function') {
				return {
					error: contractError('unsupported_capability', `${platform} has no attach provider.`, {
						recovery: { action: 'Launch an owned session instead.' },
					}),
				}
			}

			const candidates = await adapter.attachables(app, deps)
			let pick
			if (targetId) {
				pick = candidates.find((c) => c.targetId === targetId)
				if (!pick) {
					return {
						error: contractError(
							'invalid_selection',
							`No attachable ${platform} session "${targetId}".`,
							{
								recovery: { action: 'Check xplat_attach candidates or start a dev session first.' },
								context: { candidates: candidates.map((c) => c.targetId) },
							},
						),
					}
				}
			} else if (candidates.length === 1) {
				pick = candidates[0]
			} else if (candidates.length === 0) {
				return {
					error: contractError(
						'not_found',
						`No running ${platform} development sessions were found for "${app.id}".`,
						{
							recovery: {
								action:
									'Start the dev session yourself and retry, or launch an owned session with xplat_launch.',
							},
						},
					),
				}
			} else {
				return {
					error: contractError(
						'ambiguous_selection',
						`Several ${platform} sessions look attachable — pick one explicitly.`,
						{ context: { candidates }, recovery: { action: 'Pass targetId.' } },
					),
				}
			}

			const busy = liveSessionOn(app.id, platform, pick.targetId)
			if (busy) {
				return { error: targetBusyError(busy) }
			}

			const session = context.sessions.attach({
				appId: app.id,
				platform,
				targetId: pick.targetId,
				processKind: pick.processKind ?? 'warm',
				buildIdentity: pick.buildIdentity,
				detail: pick.detail,
			})

			const resources = resourcesFor(session.sessionId)
			if (typeof adapter.attach === 'function') {
				try {
					await adapter.attach({
						app,
						target: pick,
						logs: resources.logs,
						claim: (disposer) => resources.disposers.push(disposer),
						deps,
					})
				} catch (attachError) {
					// The session binding still stands — report the tap failure in
					// the log rather than losing the session over a partial tap.
					resources.logs.note(`attach log capture failed: ${attachError.message}`)
				}
			} else {
				resources.logs.note('attached — this platform captures no post-attach app output')
			}

			return { session, detail: pick.detail }
		},

		/** Read diagnostic envelopes for retained runs or host-owned captures. */
		async readDiagnostics(args = {}) {
			try {
				validateDiagnosticsSelection(args)
				if (args.sessionId || args.jobId) {
					const logs = this.readLogs(args)
					return logs.error ? logs : diagnosticsFromLogs(logs)
				}
				const selected = requireApp()
				if (selected.error) {
					return selected
				}
				return await retainedDiagnostics(selected.app.root, args)
			} catch (error) {
				return { error: toContractError(error) }
			}
		},

		/** Internal bounded log read for a session or build job. */
		readLogs({ sessionId, jobId, cursor, limit, stream } = {}) {
			if (jobId) {
				const logs = jobLogs.get(jobId)
				if (!logs) {
					return {
						error: contractError('not_found', `No log capture for job "${jobId}".`, {
							recovery: { action: 'Job log history is bounded — check xplat_job_status.' },
						}),
					}
				}

				return logs.read({ cursor, limit, stream })
			}

			const session = context.sessions.get(sessionId)
			if (!session) {
				return {
					error: contractError('not_found', `No session "${sessionId}".`, {
						recovery: { action: 'List current sessions with xplat_sessions.' },
					}),
				}
			}

			const entry = runtime.get(sessionId)
			if (!entry) {
				return {
					records: [],
					note: 'No captured output for this session — it was bound before the runtime service saw it.',
				}
			}

			const page = entry.logs.read({ cursor, limit, stream })
			return {
				...page,
				sessionState: session.state,
				// Last-known data after disconnect/stop is historical, not live.
				historical: session.state === 'disconnected' || session.state === 'stopped',
			}
		},

		/** Ownership-safe end: our taps die on attached sessions too — the user's app never does. */
		async endSession(sessionId) {
			const session = context.sessions.get(sessionId)
			let taps = []
			if (session?.ownership === 'attached') {
				// The registry deliberately skips cleanup for attached sessions —
				// our claimed log taps are server-owned, so we dispose them first.
				taps = await disposeResources(sessionId)
			}

			const result = await context.sessions.end(sessionId)
			return taps.length ? { ...result, released: [...(result.released ?? []), ...taps] } : result
		},

		/** Server shutdown: release everything the runtime owns. */
		async endAll() {
			for (const session of context.sessions.list()) {
				if (session.ownership === 'attached') {
					await disposeResources(session.sessionId)
				}
			}

			return context.sessions.shutdown()
		},

		recordJobEvidence,
	}
}

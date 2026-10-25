// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Runtime service — work item D (plans/octane-xplat-mcp.md): build, launch,
// attach, logs, status and cleanup for consumer apps on all six platforms.
// Platform mechanics live in ./adapters/*; this service owns the shared
// contract behavior: explicit app+target binding, target-busy contention,
// job dedupe/cancellation, ownership-safe cleanup, bounded logs, and
// capability-matrix entries. Spawned commands are always the app's own
// toolchain (`pnpm exec vite`, `ns run`, the app's installed CLI), so a
// session behaves like the app's installed framework version.

import { randomUUID } from 'node:crypto'
import { createDevLogCapture, listRetainedSessions, endRetainedSession } from '../../dev-logs.ts'
import { PLATFORMS } from '../contracts/identity.ts'
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
		// Simulator boot commands must bypass the discovery cache.
		execCommand: options.exec ?? options.execFile ?? execText,
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
	/** appId|platform|targetId → pending session and request key. */
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
					!['stopped', 'failed', 'disconnected'].includes(s.state) &&
					s.appId === appId &&
					s.platform === platform &&
					s.targetId === targetId,
			)

	const resourcesFor = (sessionId, app, binding) => {
		let entry = runtime.get(sessionId)
		if (!entry) {
			const session = binding ?? context.sessions.get(sessionId)
			const capture = createDevLogCapture(app.root, {
				platform: session.platform,
				targetId: session.targetId,
				sessionId,
				appId: app.id,
				origin: 'agent',
				ownership: session.ownership,
			})
			const logs = createLogBuffer()
			logs.watch((record) => {
				capture.observeNativeOutput(record.line)
				capture.append(record)
			})
			entry = { logs, capture, disposers: [], lateDisposals: [], disposed: false }
			capture.update(session)
			capture.onStop(() => context.runtime.endSession(sessionId))
			runtime.set(sessionId, entry)
		}

		return entry
	}

	context.sessions.watch((session) => runtime.get(session.sessionId)?.capture.update(session))

	/** Dispose owned resources for a session — idempotent; keeps the log buffer. */
	const disposeResources = async (sessionId) => {
		const entry = runtime.get(sessionId)
		if (!entry) {
			return []
		}
		if (entry.disposalPromise) {
			return entry.disposalPromise
		}
		entry.disposed = true
		entry.controller?.abort()
		entry.disposalPromise = (async () => {
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
		})()
		return entry.disposalPromise
	}

	const finishCapture = (entry, detail) => {
		entry.capture.close(detail)
		options.onWorkChanged?.()
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
		 * sees target_busy immediately), then reports asynchronous launch progress
		 * on that session. Failures remain readable after owned resources close.
		 */
		async launch(input = {}) {
			if (
				Object.keys(input).some((key) => !['target', 'requestKey', 'browserMode'].includes(key))
			) {
				return {
					error: contractError(
						'invalid_selection',
						'Unknown launch option. Pass target as a target id or platform name.',
					),
				}
			}
			const { target: selector, requestKey, browserMode = 'headless' } = input
			const { app, error } = requireApp()
			if (error) {
				return { error }
			}
			const permission = requireRuntime()
			if (permission) {
				return { error: permission }
			}
			const wanted = app.platforms
			const available = []
			const reasons = []
			for (const platform of wanted) {
				if (!app.platforms.includes(platform)) {
					continue
				}
				const adapter = adapters.get(platform)
				if (!adapter) {
					continue
				}
				const found = await adapter.discoverTargets(app, deps)
				if (found.reason) {
					reasons.push(found.reason)
				}
				for (const target of found.targets) {
					if (target.availability === 'unavailable') {
						continue
					}
					if (PLATFORMS.includes(target.targetId) && target.targetId !== platform) {
						continue
					}
					available.push({ platform, adapter, target })
				}
			}
			const candidates = available.filter(
				(item) =>
					!selector ||
					(PLATFORMS.includes(selector)
						? item.platform === selector
						: item.target.targetId === selector),
			)
			if (candidates.length !== 1) {
				return {
					error: contractError(
						candidates.length
							? 'ambiguous_selection'
							: selector
								? 'invalid_selection'
								: 'prerequisite_missing',
						candidates.length
							? 'Several eligible targets match; select an exact target id.'
							: 'No eligible target matches.',
						{
							context: {
								candidates: (candidates.length ? candidates : available).map(
									({ platform, target }) => ({ platform, ...target }),
								),
								reasons,
							},
							recovery: {
								action: 'Use xplat targets to discover an exact target id or platform name.',
							},
						},
					),
				}
			}
			const { platform, adapter, target } = candidates[0]
			const key = `${app.id}|${platform}|${target.targetId}`
			const pending = pendingLaunches.get(key)
			if (pending) {
				if (requestKey && pending.requestKey && requestKey !== pending.requestKey) {
					return { error: targetBusyError(context.sessions.get(pending.sessionId)) }
				}
				return { session: context.sessions.get(pending.sessionId), deduplicated: true }
			}
			const busy = liveSessionOn(app.id, platform, target.targetId)
			if (busy) {
				return { error: targetBusyError(busy) }
			}
			const sessionId = `sess_${randomUUID()}`
			let resources
			try {
				resources = resourcesFor(sessionId, app, {
					sessionId,
					appId: app.id,
					platform,
					targetId: target.targetId,
					ownership: 'owned',
					state: 'starting',
				})
			} catch (error) {
				return { error: toContractError(error) }
			}
			const session = context.sessions.bindOwned({
				sessionId,
				appId: app.id,
				platform,
				targetId: target.targetId,
				detail: `launch on ${target.name}`,
				cleanup: async () => {
					pendingLaunches.delete(key)
					return { released: await disposeResources(sessionId) }
				},
			})
			const controller = new AbortController()
			resources.controller = controller
			pendingLaunches.set(key, { sessionId, requestKey })
			context.sessions.setLaunch(sessionId, { phase: 'starting' })
			resources.launchPromise = Promise.resolve().then(async () => {
				try {
					if (controller.signal.aborted) {
						return
					}
					const outcome = await adapter.launch({
						app,
						target,
						session,
						logs: resources.logs,
						signal: controller.signal,
						report: (progress) => context.sessions.setLaunch(sessionId, progress),
						claim: (disposer) => {
							if (resources.disposed) {
								resources.lateDisposals.push(Promise.resolve().then(() => disposer.dispose()))
							} else {
								resources.disposers.push(disposer)
							}
						},
						browserMode,
						deps,
					})
					if (controller.signal.aborted) {
						await disposeResources(sessionId)
						return
					}
					resources.endpoint = { url: outcome.url, browser: outcome.browser }
					context.sessions.setLaunch(sessionId, {
						phase: 'ready',
						readiness: outcome.readiness ?? 'confirmed',
						browser: outcome.browser,
					})
					context.sessions.markReady(sessionId, {
						processKind: outcome.processKind ?? 'fresh',
						buildIdentity: outcome.buildIdentity,
					})
					outcome.mainProcess?.exit.then(({ code, signal }) => {
						context.sessions.markDisconnected(
							sessionId,
							`launch process exited (code=${code}, signal=${signal})`,
						)
						if (!resources.disposed) {
							finishCapture(resources, 'Launch process exited.')
						}
					})
				} catch (error) {
					if (!controller.signal.aborted) {
						context.sessions.markFailed(sessionId, toContractError(error))
					}
					await context.sessions.end(sessionId)
				} finally {
					pendingLaunches.delete(key)
					if (context.sessions.get(sessionId)?.state === 'failed') {
						await Promise.allSettled(resources.lateDisposals)
						finishCapture(resources, 'Session resources released.')
					}
				}
			})
			return { session: context.sessions.get(sessionId), deduplicated: false }
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

			const resources = resourcesFor(session.sessionId, app)
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

		/** Keep the host alive until asynchronous session cleanup finishes. */
		hasPendingCleanup() {
			return [...runtime.values()].some((entry) => entry.disposed && !entry.capture.closed)
		},
		listSessions() {
			const selected = resolveSelection(context)
			const apps = selected.state === 'bound' ? [selected.app] : context.discovery.apps
			const sessions = new Map(
				apps
					.flatMap((app) => listRetainedSessions(app.root))
					.map((session) => [session.sessionId, session]),
			)
			for (const session of context.sessions.list()) {
				if (apps.some((app) => app.id === session.appId)) {
					sessions.set(session.sessionId, { ...sessions.get(session.sessionId), ...session })
				}
			}
			return {
				sessions: [...sessions.values()].sort((a, b) =>
					(b.startedAt ?? b.createdAt).localeCompare(a.startedAt ?? a.createdAt),
				),
			}
		},
		sessionStatus(sessionId) {
			const session = this.listSessions().sessions.find(
				(session) => session.sessionId === sessionId,
			)
			return session
				? { session }
				: {
						error: contractError(
							'not_found',
							'No retained session with this id for the selected app.',
						),
					}
		},

		async readDiagnostics(args = {}) {
			try {
				validateDiagnosticsSelection(args)
				if (args.jobId) {
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
			if (!session) {
				const selected = requireApp()
				if (selected.error) {
					return { sessionId, ended: false, error: selected.error }
				}
				return endRetainedSession(selected.app.root, sessionId)
			}
			let taps = []
			if (session?.ownership === 'attached') {
				// The registry deliberately skips cleanup for attached sessions —
				// our claimed log taps are server-owned, so we dispose them first.
				taps = await disposeResources(sessionId)
			}

			const result = await context.sessions.end(sessionId)
			await disposeResources(sessionId)
			const entry = runtime.get(sessionId)
			await entry?.launchPromise
			await Promise.allSettled(entry?.lateDisposals ?? [])
			if (entry) {
				finishCapture(entry, 'Session resources released.')
			}
			return taps.length ? { ...result, released: [...(result.released ?? []), ...taps] } : result
		},

		/** Server shutdown: release everything the runtime owns. */
		async endAll() {
			for (const session of context.sessions.list()) {
				if (session.ownership === 'attached') {
					await disposeResources(session.sessionId)
				}
			}

			const results = []
			for (const session of context.sessions.list()) {
				results.push(await this.endSession(session.sessionId))
			}
			return results
		},

		recordJobEvidence,
	}
}

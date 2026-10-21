// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Development-action service (package G): discovery + listing + invocation
// policy over the dev-bridge transport.
//
// Discovery model: a running dev app announces its registry (identity +
// revision + typed declarations) to its dev server; the bridge keeps it. This
// service scans the bound app's bridge session files, polls each reachable
// bridge, and maintains the live instance model. Every list/invoke refreshes
// — nothing here claims a stale registry is live.
//
// Execution policy (design "Execution and trust boundaries"):
// - serialized by default within an app instance, bounded queue → target_busy
// - declared 'overlap' actions run concurrently, still under a modest cap
// - a stable requestKey dedupes live jobs; the same requestId never re-runs
// - stale revision, wrong/disconnected instance, invalid input, unavailable
//   action, and missing grants are all rejected before dispatch
// - a declared externalEffects action requires the 'external-effects' grant
// - timeouts, disconnects, and aborts report unknown/partial state honestly —
//   nothing is ever silently retried

import { randomUUID } from 'node:crypto'
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import {
	DEV_ACTIONS_DEFAULT_TIMEOUT_MS,
	DEV_ACTIONS_MAX_TIMEOUT_MS,
	DEV_ACTIONS_OVERLAP_LIMIT,
	DEV_ACTIONS_QUEUE_LIMIT,
	DEV_ACTIONS_STALE_AFTER_MS,
	actionAvailability,
	isDevActionAnnouncement,
	validateActionInput,
	validateActionOutput,
} from '../contracts/actions.ts'

import { contractError } from '../contracts/errors.ts'
import {
	awaitInvocation,
	cancelInvocation,
	fetchBridgeRegistry,
	scanBridgeEndpoints,
	submitInvocation,
} from './bridge.ts'

const LIVE_JOB_STATES = new Set(['queued', 'running', 'cancelling'])

// Map app-reported failure codes onto the shared vocabulary; anything else is
// an ordinary execution failure.
const APP_ERROR_CODES = new Set([
	'invalid_selection',
	'stale_identity',
	'cancelled',
	'unavailable',
	'target_busy',
])

const appError = (code, message, options = {}) =>
	contractError(APP_ERROR_CODES.has(code) ? code : 'execution_failure', message, options)

/**
 * deps:
 *  - jobs: JobRegistry (job contract owns queueing/dedupe/terminal states)
 *  - policy: PolicyStore (action-time grant checks)
 *  - endpoints(appRoot): override for tests — defaults to the session-file scan
 */
export function createDevActionsService({ jobs, policy, endpoints = scanBridgeEndpoints }) {
	// Last-known announcements: 'serverId/instanceId' → { endpoint, announcement, lastSeen, gone }
	const instances = new Map()
	// Per-instance serialization chains for 'serialized' actions.
	const chains = new Map()
	// jobId → invocation metadata the Job contract doesn't carry.
	const invocations = new Map()

	const keyOf = (endpoint, announcement) => `${endpoint.serverId}/${announcement.appInstanceId}`

	// A registry only belongs to the app its bridge session file was written
	// for — rebinding another app never exposes a foreign instance. The dev
	// server records a canonical root while discovery may hold a symlinked
	// path (macOS /tmp, /var), so ownership compares real paths.
	const samePath = (a, b) => {
		if (resolve(a) === resolve(b)) {
			return true
		}

		try {
			return realpathSync(a) === realpathSync(b)
		} catch {
			return false
		}
	}

	const belongsTo = (entry, app) => !app || samePath(entry.endpoint.appRoot, app.root)

	async function refreshEndpoint(endpoint, now) {
		const registry = await fetchBridgeRegistry(endpoint)
		if (!registry.ok) {
			for (const [key, entry] of instances) {
				if (entry.endpoint.serverId === endpoint.serverId) {
					instances.set(key, { ...entry, gone: true })
				}
			}

			return { endpoint, reachable: false, announced: 0, error: registry.error }
		}

		const announced = new Set()
		for (const announcement of registry.data?.instances ?? []) {
			if (!isDevActionAnnouncement(announcement)) {
				continue
			}

			const key = keyOf(endpoint, announcement)
			announced.add(key)
			instances.set(key, { endpoint, announcement, lastSeen: now, gone: false })
		}

		// An instance that vanished from a reachable bridge has exited its realm.
		for (const [key, entry] of instances) {
			if (entry.endpoint.serverId === endpoint.serverId && !announced.has(key)) {
				instances.set(key, { ...entry, gone: true })
			}
		}

		return { endpoint, reachable: true, announced: announced.size }
	}

	/** Re-scan the app's bridge endpoints and refresh every reachable registry. */
	async function refresh(app) {
		const found = app ? endpoints(app.root) : []
		const now = Date.now()

		// An endpoint whose session file vanished can no longer be verified —
		// its instances are disconnected destinations, not live registries.
		const foundIds = new Set(found.map((endpoint) => endpoint.serverId))
		for (const [key, entry] of instances) {
			if (belongsTo(entry, app) && !foundIds.has(entry.endpoint.serverId)) {
				instances.set(key, { ...entry, gone: true })
			}
		}

		const results = await Promise.all(found.map((endpoint) => refreshEndpoint(endpoint, now)))
		return { endpoints: found, results }
	}

	const publicInstance = (key, entry, now = Date.now()) => {
		const a = entry.announcement
		const stale = now - entry.lastSeen > DEV_ACTIONS_STALE_AFTER_MS
		return {
			key,
			appInstanceId: a.appInstanceId,
			serverId: entry.endpoint.serverId,
			appLabel: a.appLabel ?? null,
			platform: a.platform,
			revision: a.revision,
			announcedAt: a.announcedAt,
			state: entry.gone ? 'disconnected' : stale ? 'stale' : 'ready',
			actions: a.actions.map((action) => ({
				...action,
				liveAvailability: actionAvailability(action, a.platform),
			})),
		}
	}

	/**
	 * Live registry view. Distinguishes: no bridge files (dev server not
	 * running / plugin absent), bridge unreachable, bridge live with no app
	 * instance announced, and instances with zero declared actions.
	 */
	async function list(app) {
		const { endpoints: found, results } = await refresh(app)
		const unreachable = results.filter((r) => !r.reachable)
		const announcedTotal = results.reduce((n, r) => n + (r.announced ?? 0), 0)

		const all = [...instances.entries()]
			.filter(([, entry]) => belongsTo(entry, app))
			.map(([key, entry]) => publicInstance(key, entry))

		const live = all.filter((i) => i.state !== 'disconnected')
		const disconnected = all.filter((i) => i.state === 'disconnected')

		let state
		let detail
		if (!found.length && !all.length) {
			state = 'no-bridge'
			detail =
				'No development bridge is running for this app. Start the app in dev mode (xplat dev); the xplatDevBridge vite plugin ships in the xplatNative preset and the scaffolded web config.'
		} else if (found.length && unreachable.length === found.length) {
			state = 'bridge-unreachable'
			detail = `Dev-bridge session files exist but no endpoint answered (${unreachable.map((r) => r.error?.message).join('; ')}).`
		} else if (!live.length && !announcedTotal) {
			state = 'no-instance'
			detail =
				'A development bridge is reachable but no app instance has announced a registry — the app may not be running, or it did not start the dev-actions bridge.'
		} else {
			state = 'live'
		}

		return {
			state,
			detail,
			instances: live,
			disconnected: disconnected.map(({ actions, ...rest }) => ({
				...rest,
				actionCount: actions.length,
			})),
		}
	}

	const fail = (error) => ({ error })

	const liveInvocationsFor = (instanceKey) =>
		[...invocations.values()].filter((meta) => {
			if (meta.instanceKey !== instanceKey) {
				return false
			}

			const job = jobs.status(meta.jobId)
			return job && LIVE_JOB_STATES.has(job.state)
		})

	/**
	 * Validate + dispatch an invocation. Returns { job, ... } or { error } —
	 * every rejection happens before the app runs anything.
	 */
	async function invoke(app, params) {
		const runtime = policy.require('runtime-actions')
		if (!runtime.granted) {
			return fail(runtime.error)
		}

		// Recheck the live registry immediately before execution.
		await refresh(app)

		let entry
		if (params.appInstanceId) {
			for (const [key, candidate] of instances) {
				if (
					belongsTo(candidate, app) &&
					candidate.announcement.appInstanceId === params.appInstanceId
				) {
					entry = { key, ...candidate }
				}
			}

			if (!entry) {
				return fail(
					contractError('not_found', `No app instance "${params.appInstanceId}".`, {
						recovery: {
							action: 'List live instances with xplat_dev_actions and pick an appInstanceId.',
						},
					}),
				)
			}
		} else {
			const ready = [...instances.entries()]
				.map(([key, e]) => ({ key, ...e }))
				.filter((e) => !e.gone && belongsTo(e, app))

			if (ready.length === 0) {
				return fail(
					contractError('unavailable', 'No live app instance announced a registry.', {
						recovery: { action: 'Start the app in dev mode, then call xplat_dev_actions.' },
					}),
				)
			}

			if (ready.length > 1) {
				return fail(
					contractError(
						'ambiguous_selection',
						'Several app instances announced registries; invocation targets are never shared silently.',
						{
							recovery: { action: 'Pass appInstanceId from xplat_dev_actions.' },
							context: {
								candidates: ready.map((e) => ({
									appInstanceId: e.announcement.appInstanceId,
									platform: e.announcement.platform,
									appLabel: e.announcement.appLabel ?? null,
								})),
							},
						},
					),
				)
			}

			entry = ready[0]
		}

		const { endpoint, announcement } = entry
		if (entry.gone) {
			return fail(
				contractError(
					'disconnected_runtime',
					`App instance "${announcement.appInstanceId}" is disconnected; its last registry is historical.`,
					{ retryable: true, recovery: { action: 'Relist with xplat_dev_actions.' } },
				),
			)
		}

		if (
			params.registryRevision !== undefined &&
			params.registryRevision !== announcement.revision
		) {
			return fail(
				contractError(
					'stale_identity',
					`Registry revision ${params.registryRevision} is stale (current ${announcement.revision}).`,
					{
						retryable: true,
						recovery: {
							action: 'Rediscover with xplat_dev_actions and invoke against the new revision.',
						},
					},
				),
			)
		}

		const action = announcement.actions.find((a) => a.id === params.actionId)
		if (!action) {
			return fail(
				contractError('invalid_selection', `No action "${params.actionId}" in the live registry.`, {
					recovery: {
						action: 'Pick an id from xplat_dev_actions.',
						detail: announcement.actions.map((a) => a.id).join(', ') || 'registry is empty',
					},
				}),
			)
		}

		const availability = actionAvailability(action, announcement.platform)
		if (!availability.ready) {
			return fail(
				contractError(
					'unavailable',
					`Action "${action.id}" is unavailable: ${availability.reason}.`,
					{ retryable: true },
				),
			)
		}

		if (action.effects?.externalEffects) {
			const external = policy.require('external-effects')
			if (!external.granted) {
				return fail(external.error)
			}
		}

		const input = validateActionInput(action.input, params.input)
		if (!input.ok) {
			return fail(
				contractError('invalid_selection', `Invalid input for "${action.id}".`, {
					context: { errors: input.errors },
					recovery: { action: 'Fix the input against the declared contract and retry.' },
				}),
			)
		}

		// Bounded queues: serialized actions queue behind one execution slot per
		// instance; overlap actions only respect the global cap.
		const live = liveInvocationsFor(entry.key)
		const serialized = action.execution?.concurrency !== 'overlap'
		const saturated = serialized
			? live.length >= DEV_ACTIONS_QUEUE_LIMIT
			: live.length >= DEV_ACTIONS_OVERLAP_LIMIT

		if (saturated) {
			return fail(
				contractError(
					'target_busy',
					`The invocation queue for this app instance is full (${live.length} pending).`,
					{
						retryable: true,
						recovery: { action: 'Wait for a running action to finish, or cancel one.' },
					},
				),
			)
		}

		const requestId = params.requestKey ?? `req_${randomUUID()}`
		const timeoutMs = Math.min(
			action.execution?.timeoutMs ?? DEV_ACTIONS_DEFAULT_TIMEOUT_MS,
			DEV_ACTIONS_MAX_TIMEOUT_MS,
		)

		const started = jobs.start({
			kind: 'dev-action',
			requestKey: params.requestKey,
			run: (signal, report) =>
				runSerialized(entry.key, serialized, report, () =>
					execute({
						endpoint,
						announcement,
						action,
						requestId,
						input: input.value,
						timeoutMs,
						signal,
						report,
					}),
				),
		})

		if (!started.deduplicated) {
			if (invocations.size > 500) {
				invocations.delete(invocations.keys().next().value)
			}

			invocations.set(started.job.jobId, {
				jobId: started.job.jobId,
				instanceKey: entry.key,
				requestId,
			})
		}

		return {
			job: started.job,
			deduplicated: started.deduplicated,
			requestId,
			action: { id: action.id, title: action.title },
			registryRevision: announcement.revision,
		}
	}

	/** Invocation metadata for status reports: which instance/request a job is. */
	function describeJob(jobId) {
		const meta = invocations.get(jobId)
		const job = jobs.status(jobId)
		return job ? { job, ...meta } : null
	}

	// Serialized actions chain on a per-instance FIFO; overlap actions bypass it.
	function runSerialized(key, serialized, report, work) {
		if (!serialized) {
			return work()
		}

		const previous = chains.get(key)
		const next = (previous ?? Promise.resolve()).catch(() => {}).then(work)
		chains.set(
			key,
			next.catch(() => {}),
		)

		if (previous) {
			report({ phase: 'queued', message: 'serialized behind a running action' })
		}

		return next
	}

	async function execute({
		endpoint,
		announcement,
		action,
		requestId,
		input,
		timeoutMs,
		signal,
		report,
	}) {
		const submitted = await submitInvocation(endpoint, {
			requestId,
			appInstanceId: announcement.appInstanceId,
			actionId: action.id,
			registryRevision: announcement.revision,
			input,
		})

		if (!submitted.ok) {
			throw contractError(
				submitted.error?.code === 'unreachable' ? 'disconnected_runtime' : 'execution_failure',
				`Invocation was not delivered: ${submitted.error?.message ?? 'bridge error'}. Its outcome is unknown — the app may have received it.`,
				{ context: { outcome: 'unknown', requestId } },
			)
		}

		report({ phase: 'dispatched', message: `invocation ${requestId} accepted by the dev bridge` })

		const deadline = Date.now() + timeoutMs
		while (Date.now() < deadline) {
			const wait = await awaitInvocation(
				endpoint,
				requestId,
				Math.min(25_000, Math.max(1_000, deadline - Date.now())),
				signal,
			)

			if (signal.aborted) {
				if (action.execution?.cancellable) {
					await cancelInvocation(endpoint, requestId)
					// Bounded grace for the app to confirm its cooperative cancel.
					const grace = await awaitInvocation(endpoint, requestId, 5_000)
					if (grace.ok && grace.data?.outcome) {
						return { outcome: grace.data.outcome }
					}
				}

				return {
					outcome: {
						requestId,
						status: 'cancelled',
						partialEffects: [
							'cancellation was best-effort — the app may still have completed the action',
						],
						completedAt: new Date().toISOString(),
					},
				}
			}

			if (!wait.ok) {
				if (wait.status === 0) {
					throw contractError(
						'disconnected_runtime',
						`Lost the dev bridge while "${action.id}" was in flight. The outcome is unknown and was not retried.`,
						{ context: { outcome: 'unknown', requestId } },
					)
				}

				continue
			}

			const outcome = wait.data?.outcome
			if (!outcome) {
				continue // accepted but unfinished — keep waiting
			}

			if (outcome.status === 'succeeded') {
				const output = validateActionOutput(action.result, outcome.result)
				if (!output.ok) {
					throw contractError(
						'execution_failure',
						`Action "${action.id}" ran but its output failed the declared result contract. The action was not undone.`,
						{
							context: {
								errors: output.errors,
								partialEffects: outcome.partialEffects ?? ['unknown'],
							},
						},
					)
				}

				return { outcome: { ...outcome, result: output.value } }
			}

			if (outcome.status === 'failed') {
				// Structured per-handler failure detail the app reported; only
				// known fields cross the process boundary.
				const failures = Array.isArray(outcome.error?.failures)
					? outcome.error.failures.slice(0, 20).map((entry) => ({
							handler: entry?.handler,
							...(typeof entry?.label === 'string' ? { label: entry.label } : {}),
							name: entry?.name,
							message: entry?.message,
							...(typeof entry?.stack === 'string' ? { stack: entry.stack } : {}),
							...(typeof entry?.sourceStack === 'string'
								? { sourceStack: entry.sourceStack }
								: {}),
						}))
					: undefined
				throw appError(outcome.error?.code, outcome.error?.message ?? 'action failed', {
					context: {
						partialEffects: outcome.partialEffects,
						...(failures?.length ? { failures } : {}),
					},
				})
			}

			if (outcome.status === 'cancelled') {
				throw contractError(
					'cancelled',
					`Action "${action.id}" reported cancelled${outcome.partialEffects?.length ? ' after partial effects' : ''}.`,
					{ context: { partialEffects: outcome.partialEffects } },
				)
			}

			// 'unknown' — the app could not establish whether it ran.
			throw contractError(
				'execution_failure',
				`Action "${action.id}" finished with an unknown outcome — check app state manually.`,
				{ context: { partialEffects: outcome.partialEffects ?? ['unknown'], requestId } },
			)
		}

		// Bounded timeout: request cancellation, then report the honest unknown.
		await cancelInvocation(endpoint, requestId)
		throw contractError(
			'timeout',
			`Action "${action.id}" exceeded its ${timeoutMs}ms bound. Cancellation was requested; whether it ran is unknown.`,
			{ context: { outcome: 'unknown', requestId } },
		)
	}

	return { list, invoke, refresh, describeJob }
}

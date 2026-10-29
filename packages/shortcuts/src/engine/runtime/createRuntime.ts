import type { ShortcutEvent } from '../types/public.js'
import { compileBinding, normalizeScopes } from '../bindings/compileBinding.js'
import {
	compileBlocklist,
	compileBlocklistCombo,
	findBlockedEntries,
	findBlocklistMatches,
	toShortcutValidationError,
} from '../blocklists/compileBlocklist.js'
import type { ShortcutHost } from '../../host-types.js'
import { normalizeKeyboardEvent } from '../events/normalizeKeyboardEvent.js'
import { chooseWinner, evaluateEditablePolicy, applyConsumption, matchesStep } from './dispatch.js'
import { PauseState } from './pauseState.js'
import { RecordStateController } from './recordState.js'
import { resolveActiveScopes, pickMatchedScope } from '../scopes/resolveActiveScopes.js'
import { SequenceMachine } from '../sequences/SequenceMachine.js'
import { buildWhenContext } from '../when/buildWhenContext.js'
import { compileWhenClause } from '../when/compileWhenClause.js'
import type {
	BindingHandle,
	BindingInput,
	BindingSet,
	BindingSpec,
	BindingSnapshot,
	CanDispatchTrace,
	CandidateTrace,
	ErrorInfo,
	EvaluationTrace,
	RecordOptions,
	RecordingSession,
	ShortcutCandidate,
	RunnableInput,
	ShortcutHandler,
	ShortcutOptions,
	ShortcutRuntime,
	ShortcutValidationResult,
	WhenTrace,
} from '../types/public.js'
import type { BindingRecord, Candidate, EvaluateResult } from '../types/internal.js'
import { RESERVED_CONTEXT_NAMES } from '../types/internal.js'

type BindingSetState = {
	slotOrder: number
	bindingIds: string[]
	disposed: boolean
}

/**
 * Creates a keyboard shortcut runtime for a document or element boundary.
 *
 * The runtime normalizes keyboard events, resolves active scopes, tracks
 * in-progress sequences, evaluates `when` clauses, and dispatches at most one
 * winning binding for each event.
 *
 * @example
 * ```ts
 * import { createShortcuts } from "@octane-xplat/shortcuts";
 *
 * const shortcuts = createShortcuts({ target: document });
 *
 * shortcuts.bind({
 *   combo: "Mod+k",
 *   preventDefault: true,
 *   handler: () => openCommandPalette(),
 * });
 * ```
 */
export function createShortcuts(options: ShortcutOptions, host: ShortcutHost): ShortcutRuntime {
	const runtimeTarget = options.target
	const sequenceTimeout = options.sequenceTimeout ?? 1000
	if (!Number.isFinite(sequenceTimeout) || sequenceTimeout <= 0) {
		throw new TypeError('sequenceTimeout must be a positive number of milliseconds')
	}
	const defaultEditablePolicy = options.editablePolicy ?? 'ignore-editable'
	const getActiveScopes = options.getActiveScopes
	const canDispatch = options.canDispatch
	const onError = options.onError
	const platform = options.platform ?? host.platform()
	const compiledBlocklist = compileBlocklist(options.blocklist, platform)
	const hasNativeBlocklist = compiledBlocklist.some(({ entry }) => entry.category === 'browser')

	const bindings = new Map<string, BindingRecord>()
	const bindingOrder: string[] = []
	const bindingSetByBindingId = new Map<string, BindingSetState>()
	const whenCache = new Map<string, ReturnType<typeof compileWhenClause>>()
	const pauseState = new PauseState()
	const recordState = new RecordStateController(host)
	const sequenceMachine = new SequenceMachine()
	let disposed = false
	let nextBindingId = 1
	let nextSlotOrder = 1
	let userContext: Record<string, unknown> = {}

	const handleNativeEvent = (event: ShortcutEvent): void => {
		if (!disposed) {
			evaluateKeyboardEvent(event, true)
		}
	}

	const handleBlockedEvent = (event: ShortcutEvent): void => {
		if (disposed) {
			return
		}
		if (host.boundaryDepth(runtimeTarget, event) == null) {
			return
		}
		const normalized = normalizeKeyboardEvent(event)
		if (findBlockedEntries(compiledBlocklist, normalized).length > 0) {
			event.preventDefault()
		}
	}

	const releaseHost = host.subscribe(runtimeTarget, {
		key: handleNativeEvent,
		capture: hasNativeBlocklist ? handleBlockedEvent : undefined,
		reset: () => sequenceMachine.clear(),
	})

	function bind(input: BindingInput, handler?: ShortcutHandler): BindingHandle {
		ensureNotDisposed()
		const compiled = compileRuntimeBinding(input, handler, nextSlotOrder++, 0)
		registerBinding(compiled)

		return {
			id: compiled.id,
			dispose() {
				return unbind(compiled.id)
			},
		}
	}

	function bindWithin(
		within: object,
		input: BindingInput,
		handler?: ShortcutHandler,
	): BindingHandle {
		if (typeof input === 'string') {
			if (!handler) {
				throw new TypeError('A handler is required when binding from a string')
			}
			return bind({ combo: input, within, handler })
		}
		return bind({ ...input, within }, handler)
	}

	function unbind(binding: BindingHandle | string): boolean {
		const id = typeof binding === 'string' ? binding : binding.id
		const bindingSet = bindingSetByBindingId.get(id)
		if (!removeBinding(id)) {
			return false
		}
		if (bindingSet) {
			bindingSet.bindingIds = bindingSet.bindingIds.filter((bindingId) => bindingId !== id)
		}
		return true
	}

	function createBindingSet(): BindingSet {
		ensureNotDisposed()
		const bindingSet: BindingSetState = {
			slotOrder: nextSlotOrder++,
			bindingIds: [],
			disposed: false,
		}

		return {
			replace(next: readonly BindingSpec[]): void {
				ensureBindingSetUsable(bindingSet)
				const nextBindings = next.map((input, index) =>
					compileRuntimeBinding(input, undefined, bindingSet.slotOrder, index),
				)
				replaceBindingSetBindings(bindingSet, nextBindings)
			},

			clear(): void {
				ensureBindingSetUsable(bindingSet)
				replaceBindingSetBindings(bindingSet, [])
			},

			getBindings(): readonly BindingSnapshot[] {
				if (disposed || bindingSet.disposed) {
					return []
				}
				return bindingSet.bindingIds
					.map((id) => bindings.get(id))
					.filter((binding): binding is BindingRecord => !!binding)
					.map(toBindingSnapshot)
			},

			dispose(): void {
				if (bindingSet.disposed || disposed) {
					return
				}
				bindingSet.disposed = true
				for (const id of bindingSet.bindingIds) {
					removeBinding(id)
				}
				bindingSet.bindingIds = []
			},
		}
	}

	function pause(scope?: string): void {
		ensureNotDisposed()
		pauseState.pause(scope)
	}

	function resume(scope?: string): void {
		pauseState.resume(scope)
	}

	function record(options?: RecordOptions): RecordingSession {
		ensureNotDisposed()
		return recordState.start(runtimeTarget, sequenceTimeout, options)
	}

	function setContext(path: string, value: unknown): void {
		ensureNotDisposed()
		const segments = splitPath(path)
		if (segments.length === 0) {
			throw new TypeError('Context path must not be empty')
		}
		if (RESERVED_CONTEXT_NAMES.has(segments[0]!)) {
			throw new TypeError(`Context path "${path}" uses a reserved namespace`)
		}
		userContext = cloneContextTree(userContext)
		setNestedValue(userContext, segments, value)
	}

	function getContext(path: string): unknown {
		const segments = splitPath(path)
		if (segments.length === 0) {
			return undefined
		}
		return getNestedValue(userContext, segments)
	}

	function deleteContext(path: string): boolean {
		ensureNotDisposed()
		const segments = splitPath(path)
		if (segments.length === 0) {
			return false
		}
		if (RESERVED_CONTEXT_NAMES.has(segments[0]!)) {
			throw new TypeError(`Context path "${path}" uses a reserved namespace`)
		}
		userContext = cloneContextTree(userContext)
		return deleteNestedValue(userContext, segments)
	}

	function batchContext(update: Record<string, unknown>): void {
		ensureNotDisposed()
		const nextContext = cloneContextTree(userContext)
		for (const [path, value] of Object.entries(update)) {
			const segments = splitPath(path)
			if (segments.length === 0) {
				continue
			}
			if (RESERVED_CONTEXT_NAMES.has(segments[0]!)) {
				throw new TypeError(`Context path "${path}" uses a reserved namespace`)
			}
			setNestedValue(nextContext, segments, value)
		}
		userContext = nextContext
	}

	function isAvailable(input: RunnableInput): boolean {
		const activeScopes = resolveActiveScopes(getActiveScopes)
		const matchedScope = pickMatchedScope(normalizeScopes(input.scope), activeScopes)
		if (!matchedScope) {
			return false
		}
		if (!input.when) {
			return true
		}

		const context = buildRuntimeContext(undefined, activeScopes, matchedScope)
		const when = getCompiledWhenClause(input.when)

		try {
			return when.evaluate(context)
		} catch {
			return false
		}
	}

	function getBindings(): readonly BindingSnapshot[] {
		return getBindingRecords().map(toBindingSnapshot)
	}

	function getActiveSequences() {
		return sequenceMachine.snapshots(Date.now())
	}

	function validateShortcut(combo: string): ShortcutValidationResult {
		ensureNotDisposed()
		try {
			const step = compileBlocklistCombo(combo, platform)
			const matches = findBlocklistMatches(compiledBlocklist, step)
			if (matches.length === 0) {
				return { valid: true, combo, canonicalCombo: step.expression }
			}
			return {
				valid: false,
				combo,
				canonicalCombo: step.expression,
				errors: matches.map(({ entry }) =>
					toShortcutValidationError(combo, step.expression, entry),
				),
			}
		} catch (error) {
			return {
				valid: false,
				combo,
				errors: [
					{
						code: 'invalid-shortcut',
						combo,
						error: error instanceof Error ? error : new Error(String(error)),
					},
				],
			}
		}
	}

	function explain(event: ShortcutEvent): EvaluationTrace {
		return evaluateKeyboardEvent(event, false).trace
	}

	function dispose(): void {
		if (disposed) {
			return
		}
		disposed = true
		try {
			releaseHost()
		} finally {
			clearRuntime()
		}
	}

	function clearRuntime(): void {
		bindings.clear()
		bindingOrder.length = 0
		bindingSetByBindingId.clear()
		sequenceMachine.clear()
		pauseState.clear()
		recordState.dispose()
		whenCache.clear()
		userContext = {}
	}

	function evaluateKeyboardEvent(nativeEvent: ShortcutEvent, mutate: boolean): EvaluateResult {
		const boundaryMatched = host.boundaryDepth(runtimeTarget, nativeEvent) != null
		const normalized = normalizeKeyboardEvent(nativeEvent)
		if (!boundaryMatched) {
			return { trace: { event: normalized, candidates: [] } }
		}

		const blockedBy = findBlockedEntries(compiledBlocklist, normalized)
		if (mutate && blockedBy.length > 0) {
			nativeEvent.preventDefault()
		}
		const blockedTrace = blockedBy.length > 0 ? { blockedBy } : {}

		const now = Date.now()
		if (mutate) {
			sequenceMachine.prune(now)
		}

		const traceCandidates = new Map<string, CandidateTrace>()
		const recordingIntercepted = recordState.handle(normalized, nativeEvent, mutate, onError)
		if (recordingIntercepted.intercepted) {
			return { trace: { event: normalized, ...blockedTrace, candidates: [] } }
		}
		if (normalized.composing) {
			return { trace: { event: normalized, ...blockedTrace, candidates: [] } }
		}

		const activeScopes = resolveActiveScopes(getActiveScopes)
		const activeScopesAfterPause = pauseState.applyToScopes(activeScopes)
		const sourceStates = sequenceMachine.cloneActive(now, activeScopesAfterPause)
		const nextStates = [] as ReturnType<typeof sequenceMachine.cloneActive>
		const candidates: Candidate[] = []

		for (const binding of getBindingRecords()) {
			const matchedScope = pickMatchedScope(binding.scopes, activeScopesAfterPause)
			const trace: CandidateTrace = {
				bindingId: binding.id,
				matchedScope: matchedScope ?? undefined,
				matcherMatched: false,
			}

			if (!matchedScope) {
				trace.rejectedBy = pauseOrScopeRejection(
					binding.scopes,
					activeScopes,
					activeScopesAfterPause,
				)
				traceCandidates.set(binding.id, trace)
				continue
			}

			const boundaryDepth = host.boundaryDepth(binding.within, nativeEvent)
			if (boundaryDepth == null) {
				trace.rejectedBy = 'boundary'
				traceCandidates.set(binding.id, trace)
				continue
			}

			const editableResult = evaluateEditablePolicy(
				binding,
				host.isEditableTarget(normalized.target),
				normalized.modifiers,
			)
			if (!editableResult.allowed) {
				trace.rejectedBy = 'editable-policy'
				traceCandidates.set(binding.id, trace)
				continue
			}

			if (binding.type === 'combo') {
				if (
					binding.keyEvent !== normalized.type ||
					(normalized.repeat && !binding.allowRepeat) ||
					!matchesStep(normalized, binding.steps[0]!)
				) {
					trace.rejectedBy = 'matcher'
					traceCandidates.set(binding.id, trace)
					continue
				}
				trace.matcherMatched = true
				candidates.push({
					binding,
					matchedScope,
					kind: 'combo',
					sequenceLength: 1,
					boundaryDepth,
				})
				traceCandidates.set(binding.id, trace)
				continue
			}

			const sequenceResult = sequenceMachine.evaluateBinding(
				binding,
				matchedScope,
				normalized,
				now,
				sequenceTimeout,
				sourceStates,
				nextStates,
				boundaryDepth,
			)

			if (sequenceResult.producedCandidate) {
				trace.matcherMatched = true
				candidates.push(sequenceResult.candidate!)
			} else if (!sequenceResult.keptState) {
				trace.rejectedBy = 'matcher'
			}
			traceCandidates.set(binding.id, trace)
		}

		const eligibleCandidates: Candidate[] = []
		for (const candidate of candidates) {
			const trace = traceCandidates.get(candidate.binding.id)!
			let context: Record<string, unknown> | undefined
			const getContext = (): Record<string, unknown> =>
				(context ??= buildRuntimeContext(
					normalized,
					activeScopesAfterPause,
					candidate.matchedScope,
				))

			const whenTrace = evaluateWhen(candidate.binding, getContext)
			if (whenTrace) {
				trace.when = whenTrace
				if (!whenTrace.result) {
					trace.rejectedBy = 'when'
					continue
				}
			}

			const canDispatchTrace = evaluateCanDispatch(candidate, normalized, getContext, mutate)
			if (canDispatchTrace) {
				trace.canDispatch = canDispatchTrace
				if (!canDispatchTrace.result) {
					trace.rejectedBy = 'can-dispatch'
					continue
				}
			}
			eligibleCandidates.push(candidate)
		}

		const winner = chooseWinner(eligibleCandidates, activeScopesAfterPause)
		if (winner) {
			for (const candidate of eligibleCandidates) {
				if (candidate.binding.id !== winner.binding.id) {
					const trace = traceCandidates.get(candidate.binding.id)
					if (trace && !trace.rejectedBy) {
						trace.rejectedBy = 'conflict'
					}
				}
			}
		}

		if (mutate) {
			sequenceMachine.commit(nextStates)
			if (winner) {
				applyConsumption(winner.binding, nativeEvent)
				dispatchWinner(winner, normalized, activeScopes)
			}
		}

		return {
			winner,
			trace: {
				event: normalized,
				...blockedTrace,
				candidates: [...traceCandidates.values()],
				winner: winner?.binding.id,
			},
		}
	}

	function dispatchWinner(
		candidate: Candidate,
		normalized: ReturnType<typeof normalizeKeyboardEvent>,
		activeScopes: readonly string[],
	): void {
		try {
			candidate.binding.handler({
				bindingId: candidate.binding.id,
				combo: candidate.binding.steps[0]!.expression,
				sequence: candidate.binding.type === 'sequence' ? candidate.binding.expression : undefined,
				event: normalized,
				context: buildRuntimeContext(normalized, activeScopes, candidate.matchedScope),
				matchedScope: candidate.matchedScope,
			})
		} catch (error) {
			reportError(error, { phase: 'handler', bindingId: candidate.binding.id, event: normalized })
		}
	}

	function evaluateWhen(
		binding: BindingRecord,
		getContext: () => Record<string, unknown>,
	): WhenTrace | undefined {
		if (!binding.when) {
			return undefined
		}
		try {
			return {
				source: binding.when.source,
				result: binding.when.evaluate(getContext()),
			}
		} catch (error) {
			return {
				source: binding.when.source,
				result: false,
				error: error instanceof Error ? error : new Error(String(error)),
			}
		}
	}

	function evaluateCanDispatch(
		candidate: Candidate,
		normalized: ReturnType<typeof normalizeKeyboardEvent>,
		getContext: () => Record<string, unknown>,
		reportErrors: boolean,
	): CanDispatchTrace | undefined {
		if (!canDispatch) {
			return undefined
		}
		try {
			return {
				result: canDispatch(toShortcutCandidate(candidate, normalized, getContext())),
			}
		} catch (error) {
			const normalizedError = error instanceof Error ? error : new Error(String(error))
			if (reportErrors) {
				reportError(normalizedError, {
					phase: 'canDispatch',
					bindingId: candidate.binding.id,
					event: normalized,
				})
			}
			return {
				result: false,
				error: normalizedError,
			}
		}
	}

	function toShortcutCandidate(
		candidate: Candidate,
		normalized: ReturnType<typeof normalizeKeyboardEvent>,
		context: Record<string, unknown>,
	): ShortcutCandidate {
		return {
			bindingId: candidate.binding.id,
			combo: candidate.binding.steps[0]!.expression,
			sequence: candidate.binding.type === 'sequence' ? candidate.binding.expression : undefined,
			event: normalized,
			context,
			matchedScope: candidate.matchedScope,
			handler: candidate.binding.handler,
		}
	}

	function buildRuntimeContext(
		normalized: ReturnType<typeof normalizeKeyboardEvent> | undefined,
		activeScopes: readonly string[],
		matchedScope: string,
	): Record<string, unknown> {
		return buildWhenContext(
			cloneContextTree(userContext),
			normalized,
			activeScopes,
			matchedScope,
			platform,
			recordState.isRecording(),
		)
	}

	function reportError(error: unknown, info: ErrorInfo): void {
		if (onError) {
			onError(error, info)
			return
		}
		host.delay(() => {
			throw error instanceof Error ? error : new Error(String(error))
		}, 0)
	}

	function getBindingRecords(): BindingRecord[] {
		return bindingOrder
			.map((id) => bindings.get(id))
			.filter((binding): binding is BindingRecord => !!binding)
	}

	function compileRuntimeBinding(
		input: BindingInput,
		handler: ShortcutHandler | undefined,
		slotOrder: number,
		entryOrder: number,
	): BindingRecord {
		return compileBinding({
			input,
			handler,
			id: `binding-${nextBindingId++}`,
			slotOrder,
			entryOrder,
			defaultEditablePolicy,
			platform,
		})
	}

	function registerBinding(binding: BindingRecord): void {
		bindings.set(binding.id, binding)
		const index = findBindingInsertIndex(binding.slotOrder)
		bindingOrder.splice(index, 0, binding.id)
	}

	function removeBinding(id: string): boolean {
		const existed = bindings.delete(id)
		if (!existed) {
			return false
		}
		sequenceMachine.removeBinding(id)
		bindingSetByBindingId.delete(id)
		const index = bindingOrder.indexOf(id)
		if (index >= 0) {
			bindingOrder.splice(index, 1)
		}
		return true
	}

	function replaceBindingSetBindings(
		bindingSet: BindingSetState,
		nextBindings: readonly BindingRecord[],
	): void {
		const previousBindingIds = bindingSet.bindingIds
		let insertIndex =
			previousBindingIds.length > 0 ? bindingOrder.indexOf(previousBindingIds[0]!) : -1
		if (insertIndex < 0) {
			insertIndex = findBindingInsertIndex(bindingSet.slotOrder)
		}

		for (const id of previousBindingIds) {
			removeBinding(id)
		}

		const nextBindingIds = nextBindings.map((binding) => binding.id)
		for (const binding of nextBindings) {
			bindings.set(binding.id, binding)
			bindingSetByBindingId.set(binding.id, bindingSet)
		}
		bindingOrder.splice(insertIndex, 0, ...nextBindingIds)
		bindingSet.bindingIds = nextBindingIds
	}

	function findBindingInsertIndex(slotOrder: number): number {
		for (let index = 0; index < bindingOrder.length; index += 1) {
			const binding = bindings.get(bindingOrder[index]!)
			if (binding && binding.slotOrder > slotOrder) {
				return index
			}
		}
		return bindingOrder.length
	}

	function ensureBindingSetUsable(bindingSet: BindingSetState): void {
		if (bindingSet.disposed) {
			throw new TypeError('Binding set is disposed')
		}
		ensureNotDisposed()
	}

	function toBindingSnapshot(binding: BindingRecord): BindingSnapshot {
		return {
			id: binding.id,
			type: binding.type,
			expression: binding.expression,
			scopes: [...binding.scopes],
			priority: binding.priority,
			keyEvent: binding.keyEvent,
			whenSource: binding.whenSource,
			within: binding.within,
		}
	}

	function getCompiledWhenClause(source: string) {
		let compiled = whenCache.get(source)
		if (!compiled) {
			compiled = compileWhenClause(source)
			whenCache.set(source, compiled)
		}
		return compiled
	}

	function ensureNotDisposed(): void {
		if (disposed) {
			throw new TypeError('Shortcut runtime is disposed')
		}
	}

	return {
		bind,
		bindWithin,
		validateShortcut,
		unbind,
		createBindingSet,
		pause,
		resume,
		record,
		setContext,
		getContext,
		deleteContext,
		batchContext,
		isAvailable,
		getBindings,
		getActiveSequences,
		explain,
		dispose,
	}
}

function splitPath(path: string): string[] {
	const segments = path
		.split('.')
		.map((segment) => segment.trim())
		.filter(Boolean)
	if (segments.some((segment) => ['__proto__', 'prototype', 'constructor'].includes(segment))) {
		throw new TypeError('Context paths cannot access object prototypes')
	}
	return segments
}

function setNestedValue(
	root: Record<string, unknown>,
	segments: readonly string[],
	value: unknown,
): void {
	let cursor: Record<string, unknown> = root
	for (let index = 0; index < segments.length - 1; index += 1) {
		const segment = segments[index]!
		const current = cursor[segment]
		if (!isPlainObject(current)) {
			const next: Record<string, unknown> = {}
			cursor[segment] = next
			cursor = next
		} else {
			cursor = current
		}
	}
	cursor[segments[segments.length - 1]!] = value
}

function getNestedValue(root: Record<string, unknown>, segments: readonly string[]): unknown {
	let cursor: unknown = root
	for (const segment of segments) {
		if (!isPlainObject(cursor) && !Array.isArray(cursor)) {
			return undefined
		}
		cursor = (cursor as Record<string, unknown>)[segment]
	}
	return cursor
}

function deleteNestedValue(root: Record<string, unknown>, segments: readonly string[]): boolean {
	let cursor: Record<string, unknown> = root
	for (let index = 0; index < segments.length - 1; index += 1) {
		const next = cursor[segments[index]!]
		if (!isPlainObject(next)) {
			return false
		}
		cursor = next
	}
	const last = segments[segments.length - 1]!
	if (!(last in cursor)) {
		return false
	}
	delete cursor[last]
	return true
}

function cloneContextTree(value: Record<string, unknown>): Record<string, unknown> {
	const next: Record<string, unknown> = {}
	for (const [key, child] of Object.entries(value)) {
		next[key] = isPlainObject(child) ? cloneContextTree(child) : child
	}
	return next
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pauseOrScopeRejection(
	bindingScopes: readonly string[],
	activeScopes: readonly string[],
	afterPause: readonly string[],
): CandidateTrace['rejectedBy'] {
	if (
		pickMatchedScope(bindingScopes, activeScopes) &&
		!pickMatchedScope(bindingScopes, afterPause)
	) {
		return 'paused'
	}
	return 'scope'
}

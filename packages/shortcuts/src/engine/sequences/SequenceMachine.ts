import type { BindingRecord, Candidate, SequenceState } from '../types/internal.js'
import type { NormalizedKeyEvent, SequenceSnapshot } from '../types/public.js'
import { matchesStep } from '../runtime/dispatch.js'

export class SequenceMachine {
	private states: SequenceState[] = []

	prune(now: number): void {
		this.states = this.states.filter((state) => state.expiresAt > now)
	}

	removeBinding(bindingId: string): void {
		this.states = this.states.filter((state) => state.bindingId !== bindingId)
	}

	clear(): void {
		this.states = []
	}

	snapshots(now: number): readonly SequenceSnapshot[] {
		return this.states
			.filter((state) => state.expiresAt > now)
			.map((state) => ({
				bindingId: state.bindingId,
				matchedScope: state.matchedScope,
				stepIndex: state.stepIndex,
				expiresAt: state.expiresAt,
			}))
	}

	cloneActive(now: number, activeScopes: readonly string[]): SequenceState[] {
		return this.states
			.filter((state) => state.expiresAt > now && activeScopes.includes(state.matchedScope))
			.map((state) => ({ ...state }))
	}

	commit(states: SequenceState[]): void {
		this.states = states
	}

	evaluateBinding(
		binding: BindingRecord,
		matchedScope: string,
		normalized: NormalizedKeyEvent,
		now: number,
		sequenceTimeout: number,
		sourceStates: readonly SequenceState[],
		nextStates: SequenceState[],
		boundaryDepth: number,
	): { producedCandidate: boolean; keptState: boolean; candidate?: Candidate } {
		let producedCandidate = false
		let keptState = false
		let candidate: Candidate | undefined

		for (const state of sourceStates) {
			if (state.bindingId !== binding.id || state.matchedScope !== matchedScope) {
				continue
			}
			if (binding.keyEvent !== normalized.type) {
				nextStates.push(state)
				keptState = true
				continue
			}
			if (normalized.repeat && !binding.allowRepeat) {
				nextStates.push(state)
				keptState = true
				continue
			}
			const expectedStep = binding.steps[state.stepIndex]
			if (expectedStep && matchesStep(normalized, expectedStep)) {
				if (state.stepIndex === binding.steps.length - 1) {
					producedCandidate = true
					candidate = {
						binding,
						matchedScope,
						kind: 'sequence',
						sequenceLength: binding.steps.length,
						boundaryDepth,
					}
				} else {
					nextStates.push({
						...state,
						stepIndex: state.stepIndex + 1,
						expiresAt: now + sequenceTimeout,
					})
					keptState = true
				}
			}
		}

		if (binding.keyEvent === normalized.type && (!normalized.repeat || binding.allowRepeat)) {
			const firstStep = binding.steps[0]!
			if (matchesStep(normalized, firstStep)) {
				if (binding.steps.length === 1) {
					producedCandidate = true
					candidate = {
						binding,
						matchedScope,
						kind: 'sequence',
						sequenceLength: 1,
						boundaryDepth,
					}
				} else {
					nextStates.push({
						bindingId: binding.id,
						binding,
						matchedScope,
						stepIndex: 1,
						expiresAt: now + sequenceTimeout,
					})
					keptState = true
				}
			}
		}

		return { producedCandidate, keptState, candidate }
	}
}

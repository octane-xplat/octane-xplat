import type { ShortcutEvent } from '../types/public.js'
import { buildModifierState } from '../bindings/canonicalizeStep.js'
import type { BindingRecord, Candidate, CompiledStep } from '../types/internal.js'
import type { NormalizedKeyEvent } from '../types/public.js'

export function matchesStep(event: NormalizedKeyEvent, step: CompiledStep): boolean {
	if (
		step.physical ? event.code !== step.code : event.key !== step.key && event.code !== step.code
	) {
		return false
	}
	const expected = buildModifierState(step)
	return (
		event.modifiers.ctrl === expected.ctrl &&
		event.modifiers.meta === expected.meta &&
		event.modifiers.alt === expected.alt &&
		event.modifiers.shift === expected.shift
	)
}

export function evaluateEditablePolicy(
	binding: BindingRecord,
	editable: boolean,
	modifiers: NormalizedKeyEvent['modifiers'],
): { allowed: boolean } {
	if (!editable) {
		return { allowed: true }
	}
	switch (binding.editablePolicy) {
		case 'allow-in-editable':
			return { allowed: true }
		case 'allow-if-meta':
			return { allowed: modifiers.meta || modifiers.ctrl }
		case 'ignore-editable':
		default:
			return { allowed: false }
	}
}

export function chooseWinner(
	candidates: Candidate[],
	activeScopes: readonly string[],
): Candidate | undefined {
	return [...candidates].sort((left, right) => {
		if (left.binding.priority !== right.binding.priority) {
			return right.binding.priority - left.binding.priority
		}
		if (left.kind !== right.kind) {
			return left.kind === 'sequence' ? -1 : 1
		}
		if (left.sequenceLength !== right.sequenceLength) {
			return right.sequenceLength - left.sequenceLength
		}
		const leftScopeIndex = activeScopes.indexOf(left.matchedScope)
		const rightScopeIndex = activeScopes.indexOf(right.matchedScope)
		if (leftScopeIndex !== rightScopeIndex) {
			return leftScopeIndex - rightScopeIndex
		}
		if (left.boundaryDepth !== right.boundaryDepth) {
			return left.boundaryDepth - right.boundaryDepth
		}
		if (left.binding.slotOrder !== right.binding.slotOrder) {
			return right.binding.slotOrder - left.binding.slotOrder
		}
		return right.binding.entryOrder - left.binding.entryOrder
	})[0]
}

export function applyConsumption(binding: BindingRecord, nativeEvent: ShortcutEvent): void {
	if (binding.preventDefault) {
		nativeEvent.preventDefault()
	}
	if (binding.stopPropagation) {
		nativeEvent.stopPropagation()
	}
}

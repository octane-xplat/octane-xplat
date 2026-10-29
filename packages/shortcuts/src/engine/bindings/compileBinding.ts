import { compileCombo } from './parseCombo.js'
import { compileSequence } from './parseSequence.js'
import { compileWhenClause } from '../when/compileWhenClause.js'
import type { BindingInput, BindingSpec, EditablePolicy, ShortcutHandler } from '../types/public.js'
import type { BindingRecord, Platform } from '../types/internal.js'

type CompileBindingOptions = {
	input: BindingInput
	handler?: ShortcutHandler
	id: string
	slotOrder: number
	entryOrder: number
	defaultEditablePolicy: EditablePolicy
	platform: Platform
}

export function compileBinding(options: CompileBindingOptions): BindingRecord {
	const record = normalizeBindingInput(options.input, options.handler)
	const scopes = normalizeScopes(record.scope)
	const editablePolicy =
		record.editablePolicy === 'inherit' || record.editablePolicy == null
			? options.defaultEditablePolicy
			: record.editablePolicy

	const when = record.when ? compileWhenClause(record.when) : undefined
	const steps = record.sequence
		? compileSequence(record.sequence, options.platform)
		: [compileCombo(record.combo!, options.platform)]

	return {
		id: options.id,
		slotOrder: options.slotOrder,
		entryOrder: options.entryOrder,
		type: record.sequence ? 'sequence' : 'combo',
		expression: record.sequence
			? steps.map((step) => step.expression).join(' ')
			: steps[0]!.expression,
		keyEvent: record.keyEvent ?? 'keydown',
		scopes,
		priority: record.priority ?? 0,
		editablePolicy,
		preventDefault: record.preventDefault ?? false,
		stopPropagation: record.stopPropagation ?? false,
		allowRepeat: record.allowRepeat ?? false,
		within: record.within,
		steps,
		whenSource: record.when,
		when,
		handler: record.handler,
	}
}

function normalizeBindingInput(input: BindingInput, handler?: ShortcutHandler): BindingSpec {
	if (typeof input === 'string') {
		if (!handler) {
			throw new TypeError('A handler is required when binding from a string')
		}
		return { combo: input, handler }
	}

	if (handler) {
		throw new TypeError('Do not pass both an inline handler and a second handler argument')
	}
	if (!input.handler) {
		throw new TypeError('Binding handler is required')
	}
	if (!!input.combo === !!input.sequence) {
		throw new TypeError('Exactly one of combo or sequence is required')
	}
	return input
}

export function normalizeScopes(scope: string | readonly string[] | undefined): readonly string[] {
	const scopes = scope == null ? ['root'] : Array.isArray(scope) ? scope : [scope]
	const next = [...new Set(scopes.filter(Boolean))]
	return next.length > 0 ? next : ['root']
}

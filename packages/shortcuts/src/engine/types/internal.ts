import type {
	EditablePolicy,
	EvaluationTrace,
	KeyEventType,
	ShortcutBlocklistEntry,
	ShortcutHandler,
	ShortcutRecording,
	WhenTrace,
} from './public.js'

export type Platform = 'mac' | 'windows' | 'linux' | 'other'
export type ModifierName = 'Ctrl' | 'Meta' | 'Alt' | 'Shift'
export type ParsedModifierName = ModifierName | 'Mod'

export type CompiledStep = {
	key: string
	code?: string
	physical?: boolean
	modifiers: readonly ModifierName[]
	expression: string
}

export type CompiledBlocklistEntry = {
	entry: ShortcutBlocklistEntry
	step: CompiledStep
}

export type CompiledWhenClause = {
	source: string
	evaluate(context: Record<string, unknown>): boolean
}

export type BindingRecord = {
	id: string
	slotOrder: number
	entryOrder: number
	type: 'combo' | 'sequence'
	expression: string
	keyEvent: KeyEventType
	scopes: readonly string[]
	priority: number
	editablePolicy: EditablePolicy
	preventDefault: boolean
	stopPropagation: boolean
	allowRepeat: boolean
	within?: object
	steps: readonly CompiledStep[]
	whenSource?: string
	when?: CompiledWhenClause
	handler: ShortcutHandler
}

export type SequenceState = {
	bindingId: string
	binding: BindingRecord
	matchedScope: string
	stepIndex: number
	expiresAt: number
}

export type Candidate = {
	binding: BindingRecord
	matchedScope: string
	kind: 'combo' | 'sequence'
	sequenceLength: number
	boundaryDepth: number
	when?: WhenTrace
}

export type RecordingState = {
	eventType: KeyEventType
	timeout: number
	suppressHandlers: boolean
	consumeEvents: boolean
	target: object
	steps: string[]
	onUpdate?: (recording: ShortcutRecording) => void
	timer: (() => void) | null
	settled: boolean
	finish(recording: ShortcutRecording): void
	fail(error: Error): void
}

export type EvaluateResult = {
	trace: EvaluationTrace
	winner?: Candidate
}

export const RESERVED_CONTEXT_NAMES = new Set(['context', 'event', 'scope', 'runtime'])
export const MODIFIER_ORDER: readonly ModifierName[] = ['Ctrl', 'Meta', 'Alt', 'Shift']
export const MODIFIER_KEY_NAMES = new Set(['Ctrl', 'Meta', 'Alt', 'Shift'])

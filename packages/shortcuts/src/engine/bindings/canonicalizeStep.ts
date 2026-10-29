import type { CompiledStep, ModifierName, ParsedModifierName } from '../types/internal.js'

export function canonicalizePrimaryKey(key: string): string {
	if (key === '+') {
		return 'Plus'
	}
	if (key.length === 1) {
		if (key === ' ') {
			return 'Space'
		}
		return /[A-Z]/.test(key) ? key.toLowerCase() : key
	}

	const lower = key.toLowerCase()
	switch (lower) {
		case 'esc':
		case 'escape':
			return 'Escape'
		case 'enter':
		case 'return':
			return 'Enter'
		case 'space':
			return 'Space'
		case 'tab':
			return 'Tab'
		case 'backspace':
			return 'Backspace'
		case 'delete':
		case 'del':
			return 'Delete'
		case 'arrowup':
		case 'up':
			return 'ArrowUp'
		case 'arrowdown':
		case 'down':
			return 'ArrowDown'
		case 'arrowleft':
		case 'left':
			return 'ArrowLeft'
		case 'arrowright':
		case 'right':
			return 'ArrowRight'
		default:
			return key[0]!.toUpperCase() + key.slice(1)
	}
}

export function parseBindingToken(
	token: string,
): { type: 'modifier'; name: ParsedModifierName } | { type: 'key'; key: string } {
	const lower = token.toLowerCase()
	switch (lower) {
		case 'ctrl':
		case 'control':
			return { type: 'modifier', name: 'Ctrl' }
		case 'meta':
		case 'cmd':
		case 'command':
			return { type: 'modifier', name: 'Meta' }
		case 'alt':
		case 'option':
			return { type: 'modifier', name: 'Alt' }
		case 'shift':
			return { type: 'modifier', name: 'Shift' }
		case 'mod':
			return { type: 'modifier', name: 'Mod' }
		default:
			return { type: 'key', key: token }
	}
}

export function buildModifierState(step: CompiledStep): {
	ctrl: boolean
	meta: boolean
	alt: boolean
	shift: boolean
} {
	const flags = {
		ctrl: false,
		meta: false,
		alt: false,
		shift: false,
	}

	for (const modifier of step.modifiers) {
		switch (modifier) {
			case 'Ctrl':
				flags.ctrl = true
				break
			case 'Meta':
				flags.meta = true
				break
			case 'Alt':
				flags.alt = true
				break
			case 'Shift':
				flags.shift = true
				break
		}
	}

	if (step.key === 'Ctrl') {
		flags.ctrl = true
	}
	if (step.key === 'Meta') {
		flags.meta = true
	}
	if (step.key === 'Alt') {
		flags.alt = true
	}
	if (step.key === 'Shift') {
		flags.shift = true
	}
	return flags
}

export function stepToExpression(modifiers: readonly ModifierName[], primary: string): string {
	return [...modifiers, primary].join('+')
}

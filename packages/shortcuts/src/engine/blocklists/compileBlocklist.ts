import { compileCombo } from '../bindings/parseCombo.js'
import { buildModifierState } from '../bindings/canonicalizeStep.js'
import { matchesStep } from '../runtime/dispatch.js'
import type { CompiledBlocklistEntry, CompiledStep, Platform } from '../types/internal.js'
import type {
	NormalizedKeyEvent,
	ShortcutBlocklist,
	ShortcutBlocklistEntry,
	ShortcutValidationError,
} from '../types/public.js'

export function compileBlocklist(
	blocklist: ShortcutBlocklist | undefined,
	platform: Platform,
): readonly CompiledBlocklistEntry[] {
	return (blocklist ?? [])
		.map((entry) => {
			validateBlocklistEntry(entry)
			if (entry.platform && entry.platform !== platform) {
				return undefined
			}

			return {
				entry: { ...entry },
				step: compileBlocklistCombo(entry.combo, platform),
			}
		})
		.filter((entry): entry is CompiledBlocklistEntry => !!entry)
}

export function findBlockedEntries(
	entries: readonly CompiledBlocklistEntry[],
	event: NormalizedKeyEvent,
): readonly ShortcutBlocklistEntry[] {
	if (event.type !== 'keydown' || event.composing) {
		return []
	}

	return entries
		.filter(({ entry, step }) => entry.category === 'browser' && matchesStep(event, step))
		.map(({ entry }) => entry)
}

export function findBlocklistMatches(
	entries: readonly CompiledBlocklistEntry[],
	step: CompiledStep,
): readonly CompiledBlocklistEntry[] {
	return entries.filter((entry) => stepsMatch(entry.step, step))
}

export function toShortcutValidationError(
	combo: string,
	canonicalCombo: string,
	entry: ShortcutBlocklistEntry,
): ShortcutValidationError {
	return {
		code: 'shortcut-blocked',
		combo,
		canonicalCombo,
		category: entry.category,
		browser: entry.browser,
		platform: entry.platform,
	}
}

export function compileBlocklistCombo(source: string, platform: Platform): CompiledStep {
	if (typeof source !== 'string') {
		throw new TypeError('Blocked shortcut must be a string')
	}

	const compact = source.trim().replace(/\s*\+\s*/g, '+')
	if (/\s/.test(compact)) {
		throw new TypeError(`Blocked shortcut "${source}" must be a single combo`)
	}

	return compileCombo(source, platform)
}

function stepsMatch(left: CompiledStep, right: CompiledStep): boolean {
	const keyMatches =
		left.key === right.key ||
		(left.code !== undefined && right.code !== undefined && left.code === right.code)
	if (!keyMatches) {
		return false
	}

	const leftModifiers = buildModifierState(left)
	const rightModifiers = buildModifierState(right)
	return (
		leftModifiers.ctrl === rightModifiers.ctrl &&
		leftModifiers.meta === rightModifiers.meta &&
		leftModifiers.alt === rightModifiers.alt &&
		leftModifiers.shift === rightModifiers.shift
	)
}

function validateBlocklistEntry(entry: ShortcutBlocklistEntry): void {
	if (entry.category !== 'browser' && entry.category !== 'os') {
		throw new TypeError(`Unknown shortcut blocklist category "${String(entry.category)}"`)
	}
}

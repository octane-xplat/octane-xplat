/** NSTextView ranges and JS string lengths both count UTF-16 units. */
export interface TextRange { location: number; length: number }
const validRange = (range: TextRange | undefined, length: number): range is TextRange =>
	!!range && Number.isSafeInteger(range.location) && Number.isSafeInteger(range.length) &&
	range.location >= 0 && range.length >= 0 && range.location <= length - range.length

/** Find only the excess insertion; never remove the unchanged suffix. */
export function excessTextRange(before: string, after: string, maximum: unknown, proposed?: TextRange): TextRange | null {
	if (typeof maximum !== 'number' || !Number.isSafeInteger(maximum) || maximum < 0 || after.length <= maximum) {return null}
	let start = 0, end = before.length
	if (validRange(proposed, before.length) && after.length >= before.length - proposed.length &&
		after.startsWith(before.slice(0, proposed.location)) && after.endsWith(before.slice(proposed.location + proposed.length))) {
		start = proposed.location
		end = start + proposed.length
	} else {
		// Undo, find/replace and text-system edits can omit the delegate range.
		while (start < before.length && start < after.length && before[start] === after[start]) {start++}
		while (end > start && after.length - (before.length - end) > start && before[end - 1] === after[after.length - (before.length - end) - 1]) {end--}
	}
	if (start > 0 && /[\uD800-\uDBFF]/.test(before[start - 1]) && /[\uDC00-\uDFFF]/.test(before[start] ?? '')) {start--}
	if (end > start && end < before.length && /[\uD800-\uDBFF]/.test(before[end - 1]) && /[\uDC00-\uDFFF]/.test(before[end])) {end++}
	const inserted = after.length - (before.length - end) - start
	let allowed = Math.min(inserted, Math.max(0, maximum - (before.length - (end - start))))
	const cut = start + allowed
	// Do not leave half of a surrogate pair at the cap. This is not a grapheme cap.
	if (allowed > 0 && /[\uD800-\uDBFF]/.test(after[cut - 1]) && /[\uDC00-\uDFFF]/.test(after[cut] ?? '')) {allowed--}
	return inserted > allowed ? { location: start + allowed, length: inserted - allowed } : null
}

interface TextView {
	string: string
	selectedRange: TextRange
	hasMarkedText?: (() => boolean) | boolean
	textStorage: { replaceCharactersInRangeWithString(range: TextRange, text: string): void }
	shouldChangeTextInRangeReplacementString(range: TextRange, text: string): boolean
	didChangeText(): void
}
const pending = new WeakMap<object, { before: string; range?: TextRange }>()
const normalizing = new WeakSet<object>()
const reported = new WeakMap<object, string>()
const marked = (view: TextView) => typeof view.hasMarkedText === 'function' ? view.hasMarkedText() : Boolean(view.hasMarkedText)

export const isNormalizingTextLimit = (view: object): boolean => normalizing.has(view)

/** Programmatic values are allowed to exceed the cap, matching web maxlength. */
export function rememberTextLimitValue(view: TextView, initialOnly = false): void {
	if (initialOnly && pending.has(view)) {return}
	if (!normalizing.has(view) && !marked(view)) {
		const text = String(view.string ?? '')
		pending.set(view, { before: text })
		reported.set(view, text)
	}
}

export function recordTextLimitEdit(view: TextView, range: TextRange): void {
	if (!normalizing.has(view) && !marked(view)) {
		const before = String(view.string ?? '')
		pending.set(view, { before, range: { ...range } })
		if (!reported.has(view)) {reported.set(view, before)}
	}
}

/** Called after edits or explicit composition commit, before the public change. */
export function enforceTextLimit(view: TextView, maximum: unknown): boolean {
	if (normalizing.has(view) || marked(view)) {return false}
	const text = String(view.string ?? '')
	const previous = pending.get(view)
	const excess = excessTextRange(previous?.before ?? text, text, maximum, previous?.range)
	if (!excess) { pending.set(view, { before: text }); return false }
	const selection = view.selectedRange
	const remap = (position: number) => position <= excess.location ? position : Math.max(excess.location, position - excess.length)
	let changed = false
	normalizing.add(view)
	try {
		if (view.shouldChangeTextInRangeReplacementString(excess, '')) {
			view.textStorage.replaceCharactersInRangeWithString(excess, '')
			if (validRange(selection, text.length)) {
				const location = remap(selection.location)
				view.selectedRange = { location, length: remap(selection.location + selection.length) - location }
			}
			view.didChangeText()
			changed = true
		}
	} finally {
		normalizing.delete(view)
		pending.set(view, { before: String(view.string ?? '') })
	}
	return changed
}


/** A wholly rejected edit must not emit the same value again. Composition may
 * have reported temporary text, so its restoration still needs a callback. */
export function reportTextLimitChange(view: TextView): boolean {
	const text = String(view.string ?? '')
	if (reported.get(view) === text) {return false}
	reported.set(view, text)
	return true
}

/** @jsxImportSource @octane-xplat/jsx */
import { useContext } from 'octane'
import { Checkbox } from '../components/forms/Checkbox.tsrx'
import { CheckboxGroup } from '../components/forms/CheckboxGroup.tsrx'
import { CheckboxListItem } from '../components/forms/CheckboxListItem.tsrx'
import { ListContext, ListProvider, type ListMarker } from '../components/collections/list-context'
import type { ListDensity, ListMarkerStyle } from '../props'

/** Markdown list leaves — native (NS/AppKit) variants. Native has no
 *  ul/li or CSS counters: `MdRowList` is a marker-context column, `MdRowItem`
 *  draws its marker (or the task checkbox a `ListMarkerScope` names) as a
 *  text glyph, and task lists reuse `CheckboxGroup`/`CheckboxListItem`
 *  with their text labels. Marker cycles match the 0.7.4 reference
 *  (spec:AST-061 DEC-6). */

const BULLET_GLYPHS: Record<string, string> = { disc: '\u2022', circle: '\u25e6', square: '\u25aa' }

function toAlpha(n: number): string {
	let s = ''
	while (n > 0) {
		n--
		s = String.fromCharCode(97 + (n % 26)) + s
		n = Math.floor(n / 26)
	}

	return s
}

function toRoman(n: number): string {
	const table: readonly [number, string][] = [
		[1000, 'm'],
		[900, 'cm'],
		[500, 'd'],
		[400, 'cd'],
		[100, 'c'],
		[90, 'xc'],
		[50, 'l'],
		[40, 'xl'],
		[10, 'x'],
		[9, 'ix'],
		[5, 'v'],
		[4, 'iv'],
		[1, 'i'],
	]

	let s = ''
	for (const [v, r] of table) {
		while (n >= v) {
			s += r
			n -= v
		}
	}

	return s || 'i'
}

function orderedGlyph(n: number, kind: ListMarker | ListMarkerStyle): string {
	return kind === 'lower-alpha'
		? `${toAlpha(n)}.`
		: kind === 'lower-roman'
			? `${toRoman(n)}.`
			: `${n}.`
}

export function MdRowList(props: {
	ordered?: boolean
	start?: number
	density?: ListDensity
	style?: Record<string, unknown>
	children?: unknown
}): unknown @{
	return (
		<ListProvider
			value={{
				density: props.density ?? 'compact',
				hasDividers: false,
				listStyle: props.ordered ? 'decimal' : 'disc',
				start: props.start ?? 1,
			}}
		>
			<masonview
				style={{
					display: 'flex',
					flexDirection: 'column',
					...(props.style as object),
				}}
			>
				{props.children}
			</masonview>
		</ListProvider>
	)
}

export function MdRowItem(props: { index?: number; label?: unknown }): unknown @{
	const ctx = useContext(ListContext)
	const markerKind = ctx?.marker ?? ctx?.listStyle ?? 'disc'
	const task = markerKind == null ? undefined : ctx?.task
	const n = (ctx?.start ?? 1) + (props.index ?? 0)
	const glyph = BULLET_GLYPHS[markerKind] ?? orderedGlyph(n, markerKind)

	return (
		<masonview style={{ display: 'flex', flexDirection: 'row' }}>
			{task != null ? (
				<Checkbox value={task.isChecked} isReadOnly accessibilityLabel={task.label} size="sm" />
			) : (
				<label text={`${glyph} `} />
			)}
			<masonview style={{ display: 'flex', flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
				{props.label}
			</masonview>
		</masonview>
	)
}

export function MdCheckList(props: {
	value: readonly string[]
	label: string
	children?: unknown
}): unknown @{
	return (
		<CheckboxGroup
			accessibilityLabel={props.label}
			value={props.value as string[]}
			isReadOnly
			density="compact"
		>
			{props.children}
		</CheckboxGroup>
	)
}

export function MdCheckItem(props: {
	value: string
	label?: unknown
	textLabel?: string
}): unknown @{
	return <CheckboxListItem value={props.value} label={props.textLabel} />
}

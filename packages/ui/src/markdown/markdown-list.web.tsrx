/** @jsxImportSource @octane-xplat/jsx/dom */
import { List } from '../components/collections/List.web.tsrx'
import { ListItem } from '../components/collections/ListItem.web.tsrx'
import { CheckboxGroup } from '../components/forms/CheckboxGroup.web.tsrx'
import { CheckboxListItem } from '../components/forms/CheckboxListItem.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** Markdown list leaves — web variants rendering through the shared
 *  List/CheckboxList primitives, matching the 0.7.4 reference DOM
 *  (ul/ol + li, group > list > listitem task rows). `MdMarkerScope` is
 *  the shared `ListMarkerScope`, re-exported so Markdown stays
 *  platform-neutral. */

export function MdRowList(props: {
	ordered?: boolean
	start?: number
	style?: Record<string, unknown>
	children?: unknown
}): JSX.Element @{
	return (
		<List
			listStyle={props.ordered ? 'decimal' : 'disc'}
			density="compact"
			start={props.ordered ? props.start : undefined}
			style={props.style as never}
		>
			{props.children}
		</List>
	)
}

export function MdRowItem(props: { index?: number; label?: unknown }): JSX.Element @{
	return <ListItem label={props.label as any} />
}

export function MdCheckList(props: {
	value: readonly string[]
	label: string
	children?: unknown
}): JSX.Element @{
	return (
		<CheckboxGroup
			label={props.label}
			isLabelHidden
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
}): JSX.Element @{
	return <CheckboxListItem value={props.value} label={props.label as any} />
}

/** @jsxImportSource @nativescript-community/octane */
import type { ListItemComponent, ListItemProps, ListItemSlotProps } from './props'
import { Pressable } from './Pressable.tsrx'
import { Text } from './Text.tsrx'
import { cx } from './cx'

function Leading(props: ListItemSlotProps) @{
	<flexboxlayout className={cx('vx-listitem-leading', props.className)}>{props.children}</flexboxlayout>
}

function Content(props: ListItemSlotProps) @{
	<flexboxlayout flexDirection="column" className={cx('vx-listitem-content', props.className)}>{props.children}</flexboxlayout>
}

function Supporting(props: ListItemSlotProps) @{
	<Text className={cx('vx-listitem-supporting', props.className)}>{props.children}</Text>
}

function Trailing(props: ListItemSlotProps) @{
	<flexboxlayout className={cx('vx-listitem-trailing', props.className)}>{props.children}</flexboxlayout>
}

function ListItemView(props: ListItemProps) @{
	<Pressable
		id={props.id}
		className={cx('vx-listitem', props.className)}
		style={props.style}
		onPress={props.onPress}
		disabled={props.disabled}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole ?? (props.onPress ? 'button' : 'text')}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={props.accessibilityState}
	>
		{props.leading != null ? <Leading>{props.leading}</Leading> : null}
		{props.title != null || props.supportingText != null ? (
			<Content>
				{props.title != null ? <Text className="vx-listitem-title">{props.title}</Text> : null}
				{props.supportingText != null ? <Supporting>{props.supportingText}</Supporting> : null}
			</Content>
		) : null}
		{props.children}
		{props.trailing != null ? <Trailing>{props.trailing}</Trailing> : null}
	</Pressable>
}

export const ListItem = Object.assign(ListItemView, {
	Leading,
	Content,
	Supporting,
	Trailing,
}) as ListItemComponent

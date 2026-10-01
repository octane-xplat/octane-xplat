import type { ItemComponent, ItemProps, ItemSlotProps } from './props'
import { Pressable } from './Pressable.web.tsrx'
import { Text } from './Text.web.tsrx'

function Leading(props: ItemSlotProps) @{
	<div className={['vx-item-leading', props.className]}>{props.children}</div>
}

function Content(props: ItemSlotProps) @{
	<div className={['vx-item-content', props.className]}>{props.children}</div>
}

function Supporting(props: ItemSlotProps) @{
	<Text className={['vx-item-supporting', props.className]}>{props.children}</Text>
}

function Trailing(props: ItemSlotProps) @{
	<div className={['vx-item-trailing', props.className]}>{props.children}</div>
}

function ItemView(props: ItemProps) @{
	<Pressable
		id={props.id}
		className={['vx-item', props.className]}
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
				{props.title != null ? <Text className="vx-item-title">{props.title}</Text> : null}
				{props.supportingText != null ? <Supporting>{props.supportingText}</Supporting> : null}
			</Content>
		) : null}
		{props.children}
		{props.trailing != null ? <Trailing>{props.trailing}</Trailing> : null}
	</Pressable>
}

export const Item = Object.assign(ItemView, {
	Leading,
	Content,
	Supporting,
	Trailing,
}) as ItemComponent

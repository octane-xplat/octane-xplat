/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ItemComponent, ItemProps, ItemSlotProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { cx } from './cx'

function Leading(props: ItemSlotProps) @{
	<flexboxlayout className={cx('vx-item-leading', props.className)}>{props.children}</flexboxlayout>
}

function Content(props: ItemSlotProps) @{
	<flexboxlayout flexDirection="column" className={cx('vx-item-content', props.className)}>{props.children}</flexboxlayout>
}

function Supporting(props: ItemSlotProps) @{
	<Text className={cx('vx-item-supporting', props.className)}>{props.children}</Text>
}

function Trailing(props: ItemSlotProps) @{
	<flexboxlayout className={cx('vx-item-trailing', props.className)}>{props.children}</flexboxlayout>
}

function ItemView(props: ItemProps) @{
	<Pressable
		id={props.id}
		className={cx('vx-item', props.className)}
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

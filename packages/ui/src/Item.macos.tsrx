/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import type { ItemComponent, ItemProps, ItemSlotProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { cx } from '@octane-xplat/lib'

function StartContent(props: ItemSlotProps) @{
	<masonview className={cx('vx-item-leading', props.className)} style={{ display: 'flex' }}>
		{props.children}
	</masonview>
}

function Content(props: ItemSlotProps) @{
	<masonview
		className={cx('vx-item-content', props.className)}
		style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
	>
		{props.children}
	</masonview>
}

function Description(props: ItemSlotProps) @{
	<Text className={cx('vx-item-supporting', props.className)}>{props.children}</Text>
}

function EndContent(props: ItemSlotProps) @{
	<masonview className={cx('vx-item-trailing', props.className)} style={{ display: 'flex' }}>
		{props.children}
	</masonview>
}

function ItemView(props: ItemProps) @{
	<Pressable
		id={props.id}
		className={cx('vx-item', props.className)}
		style={mergeStyle({ flexDirection: 'row' }, props.style)}
		onPress={props.onPress}
		disabled={props.isDisabled}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole ?? (props.onPress ? 'button' : 'text')}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={props.accessibilityState}
	>
		{props.startContent != null ? <StartContent>{props.startContent}</StartContent> : null}
		{props.label != null || props.description != null ? (
			<Content>
				{props.label != null ? <Text className="vx-item-title">{props.label}</Text> : null}
				{props.description != null ? <Description>{props.description}</Description> : null}
			</Content>
		) : null}
		{props.children}
		{props.endContent != null ? <EndContent>{props.endContent}</EndContent> : null}
	</Pressable>
}

export const Item = Object.assign(ItemView, {
	StartContent,
	Content,
	Description,
	EndContent,
}) as ItemComponent

import type { ItemComponent, ItemProps, ItemSlotProps } from './props'
import { Pressable } from './Pressable.web.tsrx'
import { Text } from './Text.web.tsrx'

function StartContent(props: ItemSlotProps) @{
	<div className={['vx-item-leading', props.className]}>{props.children}</div>
}

function Content(props: ItemSlotProps) @{
	<div className={['vx-item-content', props.className]}>{props.children}</div>
}

function Description(props: ItemSlotProps) @{
	<Text className={['vx-item-supporting', props.className]}>{props.children}</Text>
}

function EndContent(props: ItemSlotProps) @{
	<div className={['vx-item-trailing', props.className]}>{props.children}</div>
}

function ItemView(props: ItemProps) @{
	<Pressable
		id={props.id}
		className={[
			'vx-item',
			props.density === 'compact' && 'vx-item--compact',
			props.isSelected && 'vx-item--selected',
			props.isHighlighted && 'vx-item--highlighted',
			props.className,
		]}
		style={props.style}
		onPress={props.onPress}
		disabled={props.isDisabled}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole ?? (props.onPress ? 'button' : 'text')}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={{ ...props.accessibilityState, selected: props.isSelected }}
	>
		{props.startContent != null ? <StartContent>{props.startContent}</StartContent> : null}
		{props.label != null || props.description != null ? (
			<Content>
				{props.label != null ? <Text className="vx-item-title">{props.label}</Text> : null}
				{props.description != null ? (
					<Description
						className={props.descriptionLines != null ? 'vx-item-desc--clamp' : undefined}
					>
						{props.description}
					</Description>
				) : null}
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

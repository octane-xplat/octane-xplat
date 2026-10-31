/** @jsxImportSource @octane-xplat/jsx */
import { useLinkedState, useState } from 'octane'
import { Button, DropdownMenu, Selector, Text, View, useLayer } from '@octane-xplat/ui'

export const layerCases = ['selector', 'dropdown-menu', 'layer'] as const

type SceneProps = {
	revision: number
	disabled: boolean
	onActivate: (source: string, fixtureRevision?: number) => void
	onEvent: (event: string, data: Record<string, unknown>) => void
}

function SelectorCase(props: SceneProps): unknown @{
	const [open, setOpen] = useState(false)
	const [value, setValue] = useLinkedState(props.revision, (): string | null =>
		props.revision === 1 ? 'third' : 'first',
	)

	<View className="core20-viewport">
		<Button
			id="core20-selector-outside"
			label="Before selector"
			clickAction={() => props.onActivate('selector-before')}
		/>
		<Text id="core20-selector-state">{`Selector value=${value} open=${open}`}</Text>
		<Selector
			id="core20-selector"
			accessibilityLabel={`Choice ${props.revision}`}
			selectionMode="single"
			presentation="popover"
			value={value}
			open={open}
			isDisabled={props.disabled}
			options={[
				{ value: 'first', label: `First ${props.revision}` },
				{ value: 'disabled', label: 'Unavailable', isDisabled: true },
				{ value: 'third', label: `Third ${props.revision}` },
			]}
			onValueChange={(next) => {
				props.onActivate(`selector-value:${next}`, props.revision)
				if (props.revision !== 2) {
					setValue(next)
				}
			}}
			onOpenChange={(next) => {
				props.onEvent('layer-open-change', {
					source: 'selector',
					open: next,
					fixtureRevision: props.revision,
				})
				setOpen(next)
			}}
		/>
		<Button
			id="core20-selector-after"
			label="After selector"
			clickAction={() => props.onActivate('selector-after')}
		/>
	</View>
}

function DropdownCase(props: SceneProps): unknown @{
	const [open, setOpen] = useState(false)

	<View className="core20-viewport">
		<Button
			id="core20-menu-outside"
			label="Before menu"
			clickAction={() => props.onActivate('menu-before')}
		/>
		<Text id="core20-menu-state">{`Menu open=${open}`}</Text>
		<DropdownMenu
			id="core20-dropdown-menu"
			button={{ label: `Actions ${props.revision}` }}
			label={`Action menu ${props.revision}`}
			presentation="popover"
			isOpen={open}
			isDisabled={props.disabled}
			onOpenChange={(next) => {
				props.onEvent('layer-open-change', {
					source: 'dropdown-menu',
					open: next,
					fixtureRevision: props.revision,
				})
				if (props.revision !== 2) {
					setOpen(next)
				}
			}}
			items={[
				{
					type: 'action',
					key: 'core20-menu-first',
					label: `First action ${props.revision}`,
					onSelect: () => props.onActivate('menu-first', props.revision),
				},
				{
					type: 'action',
					key: 'core20-menu-disabled',
					label: 'Unavailable action',
					isDisabled: true,
					onSelect: () => props.onActivate('menu-disabled', props.revision),
				},
				{
					type: 'action',
					key: 'core20-menu-third',
					label: `Third action ${props.revision}`,
					onSelect: () => props.onActivate('menu-third', props.revision),
				},
			]}
		/>
		<Button
			id="core20-menu-after"
			label="After menu"
			clickAction={() => props.onActivate('menu-after')}
		/>
	</View>
}

function AnchoredLayerCase(props: SceneProps): unknown @{
	const [open, setOpen] = useState(false)
	const layer = useLayer({
		mode: 'context',
		isOpen: open,
		lightDismiss: true,
		dismissOnEscape: true,
		onShow: () => {
			props.onEvent('layer-open-change', {
				source: 'layer',
				open: true,
				fixtureRevision: props.revision,
			})
			if (props.revision !== 2) {
				setOpen(true)
			}
		},
		onHide: () => {
			props.onEvent('layer-open-change', {
				source: 'layer',
				open: false,
				fixtureRevision: props.revision,
			})
			if (props.revision !== 2) {
				setOpen(false)
			}
		},
	})

	<View className="core20-viewport">
		<Button
			id="core20-layer-outside"
			label="Before layer"
			clickAction={() => props.onActivate('layer-before')}
		/>
		<Text id="core20-layer-state">{`Layer open=${open}`}</Text>
		<Button
			id="core20-layer-trigger"
			ref={layer.ref}
			label={`Details ${props.revision}`}
			isDisabled={props.disabled}
			clickAction={layer.show}
		/>
		{layer.render(
			<View
				id="core20-layer-content"
				accessible
				accessibilityLabel={`Layer content ${props.revision}`}
			>
				<Text>{`Anchored content ${props.revision}`}</Text>
				<Button
					label={`Layer action ${props.revision}`}
					clickAction={() => props.onActivate('layer-content', props.revision)}
				/>
				<Button label="Close layer" clickAction={layer.hide} />
			</View>,
			{ placement: 'below' },
		)}
		<Button
			id="core20-layer-after"
			label="After layer"
			clickAction={() => props.onActivate('layer-after')}
		/>
	</View>
}

/** Public menu and direct useLayer paths, without replacement keyboard or
 * native peers. The parent supplies their declaring Screen/RootLayout. */
export function LayerCases(
	props: SceneProps & { caseName: (typeof layerCases)[number] },
): unknown @{
	@if (props.caseName === 'selector') {
		<SelectorCase {...props} />
	} @else if (props.caseName === 'dropdown-menu') {
		<DropdownCase {...props} />
	} @else {
		<AnchoredLayerCase {...props} />
	}
}

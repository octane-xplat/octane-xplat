/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useRef, useState } from 'octane'
import {
	Breadcrumbs,
	Button,
	HoverCard,
	Text,
	View,
	useHoverCard,
	useLayer,
	usePopover,
} from '@octane-xplat/ui'

const crumbs = [
	{ key: 'root', label: 'Home', href: '/' },
	{ key: 'mid', label: 'Library', href: '/library' },
	{ key: 'leaf', label: 'Book', href: '/book' },
]

// Context that the declaring tree sets — proves the layer content reads the
// declaring root's context through the portal.
const ProbeContext = createContext('none')

export function LayersProbe() @{
	const [mark, setMark] = useState('none')
	const [ctlOpen, setCtlOpen] = useState(false)
	const [lightBg, setLightBg] = useState(0)
	const [noLightBg, setNoLightBg] = useState(0)
	<ProbeContext value="from-declaring">
		<Breadcrumbs id="crumbs" items={crumbs} separator=">" />
		<Breadcrumbs id="overflow" items={[...crumbs, { key: 'deep', label: 'Deep', href: '/deep' }]} maxVisibleItems={2} />
		<PopoverProbe onPick={() => setMark('popover')} />
		<ContextLayerProbe id="layer" onEvent={(e) => setMark(e)} />
		<ContextLayerProbe id="layer-light" lightDismiss onEvent={(e) => setMark(e)} />
		<ContextLayerProbe id="layer-nolight" lightDismiss={false} onEvent={(e) => setMark(e)} />
		<ContextLayerProbe id="layer-noesc" dismissOnEscape={false} onEvent={(e) => setMark(e)} />
		<ContextLayerProbe id="geo-bs" placement="bottom" alignment="start" onEvent={(e) => setMark(e)} />
		<ContextLayerProbe id="geo-te" placement="top" alignment="end" onEvent={(e) => setMark(e)} />
		<ContextLayerProbe id="geo-rc" placement="right" alignment="center" onEvent={(e) => setMark(e)} />
		<ContextLayerProbe id="geo-ls" placement="left" alignment="start" onEvent={(e) => setMark(e)} />
		<Button id="ctl-toggle" label="Toggle controlled" clickAction={() => setCtlOpen(!ctlOpen)} />
		<ControlledLayerProbe id="ctl" open={ctlOpen} onEvent={(e) => setMark(e)} />
		<FixedLayerProbe id="layer-fixed" x={40} y={60} />
		<FixedLayerProbe id="layer-fixed2" x={300} y={200} />
		<Button id="bg" label="Background" clickAction={() => setLightBg(lightBg + 1)} />
		<Button id="bg-nolight" label="Background2" clickAction={() => setNoLightBg(noLightBg + 1)} />
		<Text id="lightbg-count">{String(lightBg)}</Text>
		<Text id="nolightbg-count">{String(noLightBg)}</Text>
		<HoverCard id="hc" content={<Text id="hc-body">Card body</Text>} delay={150} hideDelay={120}>
			<Text id="hc-trigger">Hover me</Text>
		</HoverCard>
		<ControlledHover id="hc-ctl" />
		<DisabledHover id="hc-off" />
		<Text id="picked">{mark}</Text>
	</ProbeContext>
}

function ContextLayerProbe(props: {
	id: string
	onEvent: (e: string) => void
	lightDismiss?: boolean
	dismissOnEscape?: boolean
	placement?: any
	alignment?: any
}) @{
	const layer = useLayer({
		mode: 'context',
		lightDismiss: props.lightDismiss,
		dismissOnEscape: props.dismissOnEscape,
		onShow: () => props.onEvent(props.id + ':shown'),
		onHide: () => props.onEvent(props.id + ':hidden'),
	})
	<>
		<Button
			id={props.id + '-trigger'}
			label={props.id + ' trigger'}
			ref={layer.ref}
			clickAction={() => (layer.isOpen ? layer.hide() : layer.show())}
		/>
		{layer.render(<Text id={props.id + '-body'}>{'Context: ' + useContext(ProbeContext)}</Text>, {
			placement: props.placement ?? 'bottom',
			alignment: props.alignment ?? 'start',
			offset: 8,
		})}
	</>
}

function ControlledLayerProbe(props: { id: string; open: boolean; onEvent: (e: string) => void }) @{
	const layer = useLayer({
		mode: 'context',
		isOpen: props.open,
		onShow: () => props.onEvent('ctl:shown'),
		onHide: () => props.onEvent('ctl:hidden'),
	})
	<>
		<Button id={props.id + '-trigger'} label="controlled" ref={layer.ref} />
		{layer.render(<Text id={props.id + '-body'}>Controlled layer</Text>, { placement: 'bottom', alignment: 'start', offset: 8 })}
	</>
}

function FixedLayerProbe(props: { id: string; x: number; y: number }) @{
	const layer = useLayer({ mode: 'fixed' })
	<>
		<Button id={props.id + '-trigger'} label={props.id + ' trigger'} clickAction={() => (layer.isOpen ? layer.hide() : layer.show())} />
		{layer.render(<Text id={props.id + '-body'}>Fixed {props.x},{props.y}</Text>, { x: props.x, y: props.y })}
	</>
}

export function PopoverProbe(props: { onPick: () => void }) @{
	const pop = usePopover()
	<>
		<Button id="pop-trigger" label="Popover trigger" ref={pop.triggerRef} clickAction={() => pop.toggle()} />
		{pop.render(<Text id="pop-body">Popover body</Text>)}
	</>
}

function ControlledHover(props: { id: string; open?: boolean }) @{
	const card = useHoverCard({ isOpen: props.open })
	<>
		<View id={props.id} ref={card.ref} className="vx-hovercard-trigger">
			<Text id={props.id + '-trigger'}>Controlled hover</Text>
		</View>
		{card.renderHoverCard(<Text id={props.id + '-body'}>Controlled card</Text>)}
	</>
}

function DisabledHover(props: { id: string }) @{
	const card = useHoverCard({ isEnabled: false })
	<>
		<View id={props.id} ref={card.ref} className="vx-hovercard-trigger">
			<Text id={props.id + '-trigger'}>Disabled hover</Text>
		</View>
		{card.renderHoverCard(<Text id={props.id + '-body'}>Disabled card</Text>)}
	</>
}

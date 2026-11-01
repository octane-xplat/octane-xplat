/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useEffect, useState } from 'octane'
import { View, Text, TextInput, Pressable, SizeProvider, useSize, Popover } from '@octane-xplat/ui'

import type { PopoverProps } from '../../../../ui/src/props'

const Context = createContext('missing')
export const refs: Record<string, any> = {}
export const counts = { mounts: 0, unmounts: 0, dismiss: 0, nestedDismiss: 0, outside: 0 }
const capture = (name: string) => (view: any) => { refs[name] = view }

const sceneAnchor: { current: any } = { current: null }
const returnTarget: { current: any } = { current: null }
const innerAnchor: { current: any } = { current: null }
const uAnchorRef: { current: any } = { current: null }

interface SceneProps extends Omit<PopoverProps, 'anchor'> {
	value?: string
	showAnchor?: boolean
	anchorLeft?: number
	anchorTop?: number
	nested?: boolean
	nestedDismissOnEscape?: boolean
	finalFocus?: boolean
	variant?: string
}

export function Nested(props: { dismissOnEscape?: boolean }) @{
	<>
		<View id="popup-inner" ref={(view: any) => { innerAnchor.current = view; refs.inner = view }} style={{ width: 80, height: 30 }}><Text>Inner</Text></View>
		<Popover anchor={innerAnchor} defaultOpen placement="right" dismissOnEscape={props.dismissOnEscape} style={{ width: 110, padding: 6 }} onDismiss={() => { counts.nestedDismiss++ }}>
			<View id="popup-nested"><Text>Nested</Text></View>
		</Popover>
	</>
}

function Content() @{
	const value = useContext(Context)
	const size = useSize()
	const [clicks, setClicks] = useState(0)
	useEffect(() => { counts.mounts++; return () => { counts.unmounts++ } }, [])
	<>
		<Text id="popup-context">{value + ':' + size + ':' + clicks}</Text>
		<TextInput id="popup-entry" defaultValue="Edit" ref={capture('entry')} />
		<Pressable id="popup-action" accessibilityRole="button" onPress={() => setClicks(clicks + 1)} style={{ width: 100, height: 32 }}><Text>Action</Text></Pressable>
	</>
}

export function Scene(props: SceneProps) @{
	<>
		{props.showAnchor !== false
			? <View id="popup-anchor" ref={(view: any) => { sceneAnchor.current = view; refs.anchor = view }} style={{ width: 120, height: 40, marginLeft: props.anchorLeft ?? 200, marginTop: props.anchorTop ?? 160 }}><Text>Anchor</Text></View>
			: null}
		<TextInput id="popup-peer" ref={capture('peer')} defaultValue="Peer" style={{ width: 180 }} />
		<TextInput id="popup-return" ref={(view: any) => { returnTarget.current = view; refs.return = view }} defaultValue="Return" style={{ width: 180 }} />
		<Pressable id="popup-outside" accessibilityRole="button" style={{ width: 100, height: 32 }} onPress={() => { counts.outside++ }}><Text>Outside</Text></Pressable>
		<Popover {...props} anchor={sceneAnchor} finalFocusRef={props.finalFocus ? returnTarget : undefined} className="popup-custom" style={{ width: 220, padding: 12 }} onDismiss={() => { counts.dismiss++; props.onDismiss?.() }}>
			<>
				<Content />
				{props.nested ? <Nested dismissOnEscape={props.nestedDismissOnEscape} /> : null}
			</>
		</Popover>
	</>
}

export function Uncontrolled() @{
	<>
		<View id="u-anchor" ref={(view: any) => { uAnchorRef.current = view; refs.uAnchor = view }} style={{ width: 120, height: 40, marginLeft: 60, marginTop: 140 }}><Text>UAnchor</Text></View>
		<TextInput id="u-peer" ref={capture('uPeer')} defaultValue="UPeer" style={{ width: 180 }} />
		<Pressable id="u-outside" accessibilityRole="button" style={{ width: 100, height: 32, marginTop: 60 }} onPress={() => { counts.outside++ }}><Text>UOutside</Text></Pressable>
		<Popover anchor={uAnchorRef} defaultOpen className="popup-custom" style={{ width: 160, padding: 8 }} onDismiss={() => { counts.dismiss++ }}>
			<View id="u-content"><Text>Uncontrolled</Text></View>
		</Popover>
	</>
}

export function Popovers(props: SceneProps) @{
	<Context value={props.value ?? 'first'}>
		<SizeProvider value="lg">
			<View style={{ width: 780, height: 560 }}>
				{props.variant === 'uncontrolled' ? <Uncontrolled /> : <Scene {...props} />}
			</View>
		</SizeProvider>
	</Context>
}

/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useEffect } from 'octane'
import { View, Text, Tooltip } from '@octane-xplat/ui'
import { TextInput } from '../../../../ui/src/TextInput'
const Context = createContext('missing')
export const lifetime = { mounts: 0, unmounts: 0 }
function Content() @{
	const value = useContext(Context)
	useEffect(() => { lifetime.mounts++; return () => { lifetime.unmounts++ } }, [])
	<Text id="tip-content">{value}</Text>
}
export function Tooltips(props: { value: string; disabled?: boolean; placement?: 'top'|'bottom'|'left'|'right'; openDelay?: number; closeDelay?: number; show?: boolean }) @{
	<Context value={props.value}>
		<View id="tooltip-root" style={{ width: 280, height: 900 }}>
			{(props.show ?? true) ? <Tooltip id="tip-anchor" trigger={<textfield id="tip-entry" text="Hover or focus" style={{ width: 200, height: 36 }} />}
				content={<Content />} contentClassName="tip-custom" contentStyle={{ padding: 12 }} openDelay={props.openDelay ?? 80} closeDelay={props.closeDelay ?? 80}
				disabled={props.disabled} placement={props.placement} /> : null}
			<Tooltip id="plain-anchor" trigger={<button id="plain-button" text="Plain trigger" />} content="Plain tooltip" openDelay={0} />
			<TextInput id="field-tip-entry" label="Email" labelTooltip="Work account" />
			<textfield id="tip-peer" text="Peer" style={{ width: 200, height: 36 }} />
		</View>
	</Context>
}

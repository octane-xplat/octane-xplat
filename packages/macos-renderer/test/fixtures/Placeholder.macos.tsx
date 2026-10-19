/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useSignal$ } from 'octane/signals/client'
import { NSTextField } from '@octane-xplat/platform/macos'

export const placeholderRef = { current: null as any }
export const placeholderRefEvents: string[] = []
export const creatingViewEvents: any[] = []
export const assignedViews: any[] = []

const callback = (view: any) => {
	if (view) {
		placeholderRefEvents.push('attach')
		return () => placeholderRefEvents.push('cleanup')
	}
}

const refs = [placeholderRef, [callback]]

let counter = 0

export default function Placeholder() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()

	const slot = (key: string) => (
		<placeholder
			key={key}
			id="ph"
			ref={refs}
			onCreatingView={(event: any) => {
				creatingViewEvents.push(event)
				const field = NSTextField.labelWithString('slot-' + key + '-' + ++counter)
				assignedViews.push(field)
				event.view = field
			}}
			style={phase === 1 ? { width: 160, height: 24, opacity: 0.5 } : { width: 160, height: 24 }}
		/>
	)

	return (
		<masonview style={{flexDirection: "column", ...({display: "flex"})}}>
			<masonview id="ph-left" style={mergeStyle({flexDirection: "column"}, {display: "flex", ...({ width: 240, height: 110 })})}>
				{(phase >= 2 ? ['tail', 'slot'] : ['slot', 'tail']).map((id) =>
					id === 'tail' ? (
						<label key="tail" id="ph-tail" text="tail" style={{ width: 32, height: 20 }} />
					) : phase !== 3 && phase !== 6 ? (
						slot(phase === 5 ? 'b' : 'a')
					) : null,
				)}
			</masonview>
			<contentview id="ph-right" style={{ width: 240, height: 60 }}>
				{phase === 3 ? slot('c') : null}
			</contentview>
			<placeholder id="ph-empty" style={{ width: 40, height: 20 }} />
			<masonview id="advance-ph" onTap={() => phase$.set(phase + 1)} style={{display: "flex"}}>
				<label text="Advance" />
			</masonview>
		</masonview>
	)
}

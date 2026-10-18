/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'
import { NSTextField, NSView } from '@octane-xplat/platform/macos'

export const barRef = { current: null as any }
export const barEvents: string[] = []
export const naturalTitle = NSView.alloc().initWithFrame({
	origin: { x: 0, y: 0 },
	size: { width: 80, height: 24 },
})

export const externalTitle = NSTextField.labelWithString('External')
const refs = [
	barRef,
	[
		(view: any) => {
			if (view) {
				barEvents.push('attach')
				return () => barEvents.push('cleanup')
			}
		},
	],
]

export default function ActionBar() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	return (
		<masonview display="flex" flexDirection="column">
			<actionbar id="bar-natural" titleView={naturalTitle} horizontalAlignment="left" />
			{phase !== 6 ? (
				<actionbar
					key={phase === 5 ? 'replacement' : 'first'}
					id="bar"
					ref={refs}
					title={phase === 4 ? undefined : phase ? 'Updated' : 'Initial'}
					flat={phase === 1 ? true : undefined}
					titleView={phase === 3 ? externalTitle : undefined}
					style={{ width: phase === 1 ? 300 : 240, height: 44 }}
				>
					{phase === 2 ? (
						<label id="bar-child" text="Custom" style={{ width: 60, height: 20 }} />
					) : null}
				</actionbar>
			) : null}
			<masonview display="flex" id="advance-bar" onTap={() => phase$.set(phase + 1)}>
				<label text="Next" />
			</masonview>
		</masonview>
	)
}

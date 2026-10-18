/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const contentRefs = { host: { current: null as any }, child: { current: null as any } }
export const contentEvents: string[] = []
const childRef = (view: any) => {
	if (view) {
		contentEvents.push('attach')
		return () => contentEvents.push('cleanup')
	}
}

const contentChildRef = [contentRefs.child, childRef]

export default function Content() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	return (
		<masonview display="flex" flexDirection="column">
			<contentview
				id="content"
				ref={contentRefs.host}
				style={{ width: phase === 1 ? 260 : 200, height: 80 }}
			>
				{phase < 3 ? (
					<label
						key="first"
						id="content-child"
						ref={contentChildRef}
						text={phase === 1 ? 'Updated content' : 'Initial content'}
						horizontalAlignment={phase === 2 ? undefined : phase === 1 ? 'right' : 'center'}
						verticalAlignment={phase === 2 ? undefined : phase === 1 ? 'bottom' : 'middle'}
						style={phase === 2 ? undefined : { width: 60, height: 20 }}
					/>
				) : phase === 4 ? null : (
					<masonview display="flex" flexDirection="column" key="replacement" id="content-child" ref={contentChildRef}>
						<label id="content-descendant" text="Replacement" />
					</masonview>
				)}
			</contentview>
			<contentview id="replacement-slot" style={{ width: 100, height: 32 }}>
				{(phase === 0 ? ['a', 'b'] : phase === 1 ? ['b'] : []).map((id) => (
					<label key={id} id={'slot-' + id} text={id} />
				))}
			</contentview>
			<contentview id="auto-content">
				<label text="Natural size" style={{ width: 52, height: 18 }} />
			</contentview>
			<masonview display="flex" id="advance-content" onTap={() => phase$.set(phase + 1)}>
				<label text="Advance" />
			</masonview>
		</masonview>
	)
}

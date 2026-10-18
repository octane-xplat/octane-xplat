/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const htmlRef = { current: null as any }
export const htmlRefEvents: string[] = []
const callback = (view: any) => {
	if (view) {
		htmlRefEvents.push('attach')
		return () => htmlRefEvents.push('cleanup')
	}
}

const refs = [htmlRef, [callback]]

export default function Html() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const content = () => (
		<htmlview
			key={phase === 6 ? 'replacement' : 'html'}
			id="html"
			ref={refs}
			html={
				phase === 2
					? undefined
					: phase === 1
						? '<i>Updated &amp; 世界</i>'
						: '<b>Hello</b> &amp; <a href="https://example.com">link</a>'
			}
			style={
				phase < 2
					? { fontSize: phase === 1 ? 24 : 20, color: '#ff0000', width: 200, height: 40 }
					: { width: 200, height: 40 }
			}
		/>
	)

	return (
		<masonview flexDirection="column" style={{display: "flex"}}>
			<masonview flexDirection="column" id="html-left" style={{display: "flex", ...({ width: 240, height: 110 })}}>
				{(phase >= 3 ? ['tail', 'html'] : ['html', 'tail']).map((id) =>
					id === 'tail' ? (
						<htmlview key="tail" id="html-tail" html="tail" style={{ width: 200, height: 20 }} />
					) : phase < 4 || phase === 5 || phase === 6 || phase === 8 ? (
						content()
					) : null,
				)}
			</masonview>
			<contentview id="html-right" style={{ width: 240, height: 60 }}>
				{phase === 4 ? content() : null}
			</contentview>
			<masonview id="advance-html" onTap={() => phase$.set(phase + 1)} style={{display: "flex"}}>
				<label text="Advance" />
			</masonview>
		</masonview>
	)
}

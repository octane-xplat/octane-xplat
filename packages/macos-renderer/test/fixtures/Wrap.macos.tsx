/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const wrapRefs = { host: { current: null as any }, child: { current: null as any } }
export const wrapEvents: string[] = []
const callback = (view: any) => {
	if (view) {
		wrapEvents.push('attach')
		return () => wrapEvents.push('cleanup')
	}
}

const refs = [wrapRefs.child, callback]
function Moving() {
	return (
		<contentview id="wrap-moving" ref={refs} style={{ width: 40, height: 20 }}>
			<label id="wrap-descendant" text="Moving" />
		</contentview>
	)
}

export default function Wrap() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const ids = phase >= 4 ? ['c', 'a', 'b'] : ['a', 'b', 'c']
	return (
		<masonview display="flex" flexDirection="column">
			<masonview id="wrap" ref={wrapRefs.host} orientation={phase === 1 ? 'vertical' : undefined} itemWidth={phase === 0 || phase === 1 ? 80 : phase === 2 ? 0 : undefined} itemHeight={phase === 0 || phase === 1 ? 30 : phase === 2 ? 0 : undefined} style={{
					width: phase === 3 ? 100 : 200,
					height: 100,
					padding: phase === 0 ? 10 : undefined,
				}}>
				{ids
					.filter((id) => phase < 5 || id !== 'b')
					.map((id) => (
						<contentview
							key={id}
							id={'wrap-' + id}
							style={{ width: id === 'a' ? 40 : 80, height: 20 }}
						>
							<label text={phase === 1 ? 'Updated ' + id : id} />
						</contentview>
					))}
				{phase === 6 ? (
					<masonview display="flex" key="replacement" id="wrap-moving" ref={refs} style={{ width: 40, height: 20 }}>
						<label id="wrap-descendant" text="Replacement" />
					</masonview>
				) : phase < 6 || phase === 9 ? (
					<Moving />
				) : null}
			</masonview>
			<masonview id="wrap-other" itemWidth={60} itemHeight={40} style={{ width: 120, height: 80 }}>
				{phase === 8 ? <Moving /> : null}
			</masonview>
			<masonview id="wrap-resize" itemWidth={80} itemHeight={30}>
				<contentview />
				<contentview />
				<contentview />
				<contentview id="wrap-resize-last" />
			</masonview>
			<masonview id="wrap-natural" style={{ width: 100 }}>
				<contentview style={{ width: 70, height: 20 }} />
				<contentview style={{ width: 50, height: 30 }} />
			</masonview>
			<masonview id="wrap-label-natural" style={{ width: 200, height: 40 }}>
				<label
					id="wrap-natural-label"
					text={phase === 1 ? 'Longer natural label' : 'Hi'}
					verticalAlignment="top"
				/>
			</masonview>
			<masonview id="wrap-margins" itemWidth={100} itemHeight={40} style={{ width: 200, height: 80, padding: 10 }}>
				<contentview
					id="wrap-margin-child"
					horizontalAlignment="right"
					verticalAlignment="bottom"
					style={{
						width: 30,
						height: 10,
						marginLeft: 3,
						marginRight: 7,
						marginTop: 4,
						marginBottom: 6,
					}}
				/>
			</masonview>
			<masonview display="flex" id="advance-wrap" onTap={() => phase$.set(phase + 1)}>
				<label text="Advance wrap" />
			</masonview>
		</masonview>
	)
}

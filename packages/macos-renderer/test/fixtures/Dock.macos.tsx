/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const dockRefs = { host: { current: null as any }, fill: { current: null as any } }
export const dockEvents: string[] = []
const fillCallback = (view: any) => {
	if (view) {
		dockEvents.push('attach')
		return () => dockEvents.push('cleanup')
	}
}

const fillRefs = [dockRefs.fill, fillCallback]

function Fill() {
	return (
		<contentview id="dock-fill" ref={fillRefs} dock="left">
			<label id="dock-descendant" text="Fill" style={{ width: 60, height: 18 }} />
		</contentview>
	)
}

export default function Dock() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const edges = phase >= 3 ? ['left', 'top', 'right', 'bottom'] : ['top', 'right', 'bottom', 'left']
	return (
		<masonview flexDirection="column" style={{display: "flex"}}>
			<masonview id="dock" ref={dockRefs.host} stretchLastChild={phase === 1 ? false : undefined} style={{
					width: phase === 1 ? 360 : 300,
					height: phase === 1 ? 180 : 160,
					padding: phase < 2 ? 10 : undefined,
				}}>
				{edges
					.filter((id) => phase < 4 || id !== 'right')
					.map((id) => (
						<contentview
							key={id}
							id={'dock-' + id}
							dock={
								id === 'top'
									? phase === 1
										? 'bottom'
										: phase >= 2
											? undefined
											: 'top'
									: (id as 'left' | 'right' | 'bottom')
							}
							style={
								id === 'top'
									? { height: phase === 1 ? 25 : 20, marginBottom: phase === 0 ? 5 : undefined }
									: id === 'bottom'
										? { height: 30 }
										: { width: id === 'right' ? 40 : 50 }
							}
						>
							<label text={phase === 1 ? 'Updated ' + id : id} style={{ width: 40, height: 20 }} />
						</contentview>
					))}
				{phase === 8 ? (
					<Fill />
				) : phase < 5 ? (
					<contentview key="fill" id="dock-fill" ref={fillRefs} dock="left">
						<label id="dock-descendant" text="Fill" style={{ width: 60, height: 18 }} />
					</contentview>
				) : phase === 5 ? (
					<masonview key="replacement" id="dock-fill" ref={fillRefs} style={{display: "flex"}}>
						<label id="dock-descendant" text="Replacement" />
					</masonview>
				) : null}
			</masonview>
			<masonview id="dock-other" style={{ width: 100, height: 80 }}>
				{phase === 7 ? <Fill /> : null}
			</masonview>
			<masonview id="percentage-dock" style={{ width: 200, height: 100, padding: 10 }}>
				<contentview id="percentage-edge" dock="left" style={{ width: '50%' }} />
				<contentview id="percentage-fill" />
			</masonview>
			<masonview id="natural-dock" stretchLastChild={false}>
				<contentview dock="top" style={{ width: 100, height: 10 }} />
				<contentview dock="left" style={{ width: 30, height: 50 }} />
				<contentview style={{ width: 40, height: 20 }} />
			</masonview>
			<masonview id="advance-dock" onTap={() => phase$.set(phase + 1)} style={{display: "flex"}}>
				<label text="Advance dock" />
			</masonview>
		</masonview>
	)
}

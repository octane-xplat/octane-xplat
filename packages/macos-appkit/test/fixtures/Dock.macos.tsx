/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useSignal$ } from 'octane/signals/client'

/** CSS positioned edges share their containing block. Insets do not consume
 *  space for siblings; a fill child explicitly pins all four edges. */
const DOCK_INSETS: Record<string, Record<string, number>> = {
	top: { top: 0, left: 0, right: 0 },
	bottom: { bottom: 0, left: 0, right: 0 },
	left: { left: 0, top: 0, bottom: 0 },
	right: { right: 0, top: 0, bottom: 0 },
}

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
		<contentview
			id="dock-fill"
			ref={fillRefs}
			style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
		>
			<label id="dock-descendant" text="Fill" style={{ width: 60, height: 18 }} />
		</contentview>
	)
}

export default function Dock() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const edges = phase >= 3 ? ['left', 'top', 'right', 'bottom'] : ['top', 'right', 'bottom', 'left']
	return (
		<masonview
			style={{
				flexDirection: 'column',
				display: 'flex',
			}}
		>
			<masonview
				id="dock"
				ref={dockRefs.host}
				style={{
					width: phase === 1 ? 360 : 300,
					height: phase === 1 ? 180 : 160,
					padding: phase < 2 ? 10 : undefined,
				}}
			>
				{edges
					.filter((id) => phase < 4 || id !== 'right')
					.map((id) => (
						<contentview
							key={id}
							id={'dock-' + id}
							style={mergeStyle(
								{
									position: 'absolute',
									...DOCK_INSETS[
										(id === 'top' ? (phase === 1 ? 'bottom' : phase >= 2 ? '' : 'top') : id) || ''
									],
								},
								id === 'top'
									? { height: phase === 1 ? 25 : 20, marginBottom: phase === 0 ? 5 : undefined }
									: id === 'bottom'
										? { height: 30 }
										: { width: id === 'right' ? 40 : 50 },
							)}
						>
							<label text={phase === 1 ? 'Updated ' + id : id} style={{ width: 40, height: 20 }} />
						</contentview>
					))}
				{phase === 8 ? (
					<Fill />
				) : phase < 5 ? (
					<contentview
						key="fill"
						id="dock-fill"
						ref={fillRefs}
						style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
					>
						<label id="dock-descendant" text="Fill" style={{ width: 60, height: 18 }} />
					</contentview>
				) : phase === 5 ? (
					<masonview
						key="replacement"
						id="dock-fill"
						ref={fillRefs}
						style={{ display: 'flex', position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
					>
						<label id="dock-descendant" text="Replacement" />
					</masonview>
				) : null}
			</masonview>
			<masonview id="dock-other" style={{ width: 100, height: 80 }}>
				{phase === 7 ? <Fill /> : null}
			</masonview>
			<masonview id="percentage-dock" style={{ width: 200, height: 100, padding: 10 }}>
				<contentview
					id="percentage-edge"
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: '50%',
					}}
				/>
				<contentview
					id="percentage-fill"
					style={{ position: 'absolute', left: '50%', right: 0, top: 0, bottom: 0 }}
				/>
			</masonview>
			<masonview id="natural-dock">
				<contentview
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						width: 100,
						height: 10,
					}}
				/>
				<contentview
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: 30,
						height: 50,
					}}
				/>
				<contentview style={{ width: 40, height: 20 }} />
			</masonview>
			<masonview id="advance-dock" onTap={() => phase$.set(phase + 1)} style={{ display: 'flex' }}>
				<label text="Advance dock" />
			</masonview>
		</masonview>
	)
}

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
		<masonview
			style={{
				flexDirection: 'column',
				display: 'flex',
			}}
		>
			<masonview
				id="wrap"
				ref={wrapRefs.host}
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					flexDirection: phase === 1 ? 'column' : 'row',
					width: phase === 3 ? 100 : 200,
					height: 100,
					padding: phase === 0 ? 10 : undefined,
				}}
			>
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
					<masonview
						key="replacement"
						id="wrap-moving"
						ref={refs}
						style={{
							display: 'flex',
							width: 40,
							height: 20,
						}}
					>
						<label id="wrap-descendant" text="Replacement" />
					</masonview>
				) : phase < 6 || phase === 9 ? (
					<Moving />
				) : null}
			</masonview>
			<masonview
				id="wrap-other"
				style={{ width: 120, height: 80, display: 'flex', flexWrap: 'wrap' }}
			>
				{phase === 8 ? <Moving /> : null}
			</masonview>
			<masonview id="wrap-resize" style={{ display: 'flex', flexWrap: 'wrap' }}>
				<contentview />
				<contentview />
				<contentview />
				<contentview id="wrap-resize-last" />
			</masonview>
			<masonview id="wrap-natural" style={{ width: 100, display: 'flex', flexWrap: 'wrap' }}>
				<contentview style={{ width: 70, height: 20 }} />
				<contentview style={{ width: 50, height: 30 }} />
			</masonview>
			<masonview
				id="wrap-label-natural"
				style={{ width: 200, height: 40, display: 'flex', flexWrap: 'wrap' }}
			>
				<label id="wrap-natural-label" text={phase === 1 ? 'Longer natural label' : 'Hi'} />
			</masonview>
			<masonview
				id="wrap-margins"
				style={{ width: 200, height: 80, padding: 10, display: 'flex', flexWrap: 'wrap' }}
			>
				<contentview
					id="wrap-margin-child"
					style={{
						alignSelf: 'end',
						width: 30,
						height: 10,
						marginLeft: 3,
						marginRight: 7,
						marginTop: 4,
						marginBottom: 6,
					}}
				/>
			</masonview>
			<masonview id="advance-wrap" onTap={() => phase$.set(phase + 1)} style={{ display: 'flex' }}>
				<label text="Advance wrap" />
			</masonview>
		</masonview>
	)
}

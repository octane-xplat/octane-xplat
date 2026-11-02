/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useSignal$ } from 'octane/signals/client'

export const rootRefs = { host: { current: null as any }, child: { current: null as any } }
export const rootEvents: string[] = []
const callback = (view: any) => {
	if (view) {
		rootEvents.push('attach')
		return () => rootEvents.push('cleanup')
	}
}

const refs = [rootRefs.child, [callback]]

function Moving() {
	return (
		<rootlayout id="root-moving" ref={refs} style={{ width: 40, height: 20 }}>
			<label id="root-descendant" text="Nested root" />
		</rootlayout>
	)
}

export default function Root() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	return (
		<masonview
			style={{
				flexDirection: 'column',
				display: 'flex',
			}}
		>
			<rootlayout
				id="root"
				ref={rootRefs.host}
				style={phase === 1 ? { width: 240, height: 100, padding: 10 } : { width: 200, height: 80 }}
			>
				{(phase >= 3 ? ['b', 'a'] : ['a', 'b'])
					.filter((id) => phase < 4 || id !== 'b')
					.map((id) => (
						<contentview
							key={id}
							id={'root-' + id}
							style={
								phase === 1
									? { width: 40, height: 20, margin: 5, justifySelf: 'end', alignSelf: 'end' }
									: undefined
							}
						>
							<label id={'root-text-' + id} text={phase === 1 ? 'Updated ' + id : id} />
						</contentview>
					))}
				{phase < 5 ? (
					<Moving />
				) : phase === 5 ? (
					<contentview
						key="replacement"
						id="root-moving"
						ref={refs}
						style={{ width: 60, height: 30 }}
					>
						<label id="root-replacement" text="Replacement" />
					</contentview>
				) : phase === 8 ? (
					<Moving />
				) : null}
			</rootlayout>
			<rootlayout id="root-other" style={{ width: 100, height: 40 }}>
				{phase === 7 ? <Moving /> : null}
			</rootlayout>
			<rootlayout id="root-natural">
				<contentview style={{ width: 52, height: 18 }} />
				<contentview style={{ width: 32, height: 24 }} />
			</rootlayout>
			<rootlayout id="root-percent" style={{ width: 200, height: 80, padding: 10 }}>
				<contentview id="root-percent-child" style={{ width: '50%', height: '50%' }} />
				<proxyviewcontainer style={{ gridRow: '8', gridColumn: '10' }}>
					<contentview id="root-projected" />
				</proxyviewcontainer>
			</rootlayout>
			<masonview id="advance-root" onTap={() => phase$.set(phase + 1)} style={{ display: 'flex' }}>
				<label text="Advance root" />
			</masonview>
		</masonview>
	)
}

export function RootSurface() {
	return <label text="Independent presentation" />
}

export function RootWindow() {
	return (
		<rootlayout id="root-window">
			<contentview id="root-window-child" />
		</rootlayout>
	)
}

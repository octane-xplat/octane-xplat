/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'
import type { LogicalElement } from '@octane-xplat/jsx/jsx-runtime'

export const proxyRefs = {
	host: { current: null as LogicalElement | null },
	empty: { current: null as LogicalElement | null },
}

export const proxyEvents: string[] = []
const callback = (element: LogicalElement | null) => {
	if (element) {
		proxyEvents.push('attach')
		return () => proxyEvents.push('cleanup')
	}
}

const refs = [proxyRefs.host, [callback]]
function ReturnedGroup() {
	return (
		<proxyviewcontainer id="proxy" ref={refs}>
			<contentview id="proxy-returned" style={{ width: 40, height: 20 }}>
				<label id="proxy-returned-child" text="Returned" />
			</contentview>
		</proxyviewcontainer>
	)
}

export function InvalidContentProjection() {
	return (
		<contentview>
			<proxyviewcontainer>
				<label text="First" />
				<proxyviewcontainer>
					<label text="Second" />
				</proxyviewcontainer>
			</proxyviewcontainer>
		</contentview>
	)
}

export default function Proxy() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const ids = phase >= 3 ? ['b', 'a'] : ['a', 'b']
	return (
		<masonview
			style={{
				flexDirection: 'column',
				display: 'flex',
			}}
		>
			<masonview
				id="proxy-wrap"
				style={{
					width: 200,
					height: 40,
					display: 'grid',
					gridTemplateColumns: '40px 40px 40px 40px',
					gridAutoRows: '20px',
					justifyItems: 'center',
					alignContent: 'start',
				}}
			>
				<contentview id="proxy-before" style={{ width: 40, height: 20 }} />
				{phase < 5 ? (
					<proxyviewcontainer key="logical" id="proxy" ref={refs}>
						{ids
							.filter((id) => phase < 4 || id !== 'b')
							.map((id) => (
								<proxyviewcontainer key={id}>
									<contentview
										id={'proxy-' + id}
										style={{ width: phase === 1 ? 30 : 40, height: 20 }}
									>
										<label id={'proxy-text-' + id} text={phase === 1 ? 'Updated ' + id : id} />
									</contentview>
								</proxyviewcontainer>
							))}
					</proxyviewcontainer>
				) : phase === 5 ? (
					<proxyviewcontainer key="replacement" id="proxy" ref={refs}>
						<label id="proxy-replacement" text="Replacement" style={{ width: 40, height: 20 }} />
					</proxyviewcontainer>
				) : phase === 8 ? (
					<ReturnedGroup />
				) : null}
				<contentview id="proxy-after" style={{ width: 40, height: 20 }} />
			</masonview>
			<masonview
				id="proxy-other"
				style={{
					width: 100,
					height: 40,
					display: 'grid',
					gridTemplateColumns: '40px',
					gridAutoRows: '20px',
					alignContent: 'start',
				}}
			>
				{phase === 7 ? <ReturnedGroup /> : null}
			</masonview>
			<masonview
				id="proxy-grid"
				style={{
					display: 'grid',
					gridTemplateRows: '30px 30px',
					gridTemplateColumns: '40px 40px',
					width: 80,
					height: 60,
				}}
			>
				<proxyviewcontainer
					style={{
						gridRow: String(phase === 1 ? 2 : 1),
						gridColumn: String(phase === 1 ? 2 : 1),
					}}
				>
					<contentview id="proxy-grid-child" />
				</proxyviewcontainer>
				<contentview
					id="proxy-grid-direct"
					style={{ gridRow: String((phase === 1 ? 0 : 1) + 1), gridColumn: '1' }}
				/>
			</masonview>
			<masonview id="proxy-absolute" style={{ width: 100, height: 40 }}>
				<proxyviewcontainer
					style={{
						position: 'absolute',
						left: phase === 1 ? 20 : undefined,
						top: phase === 1 ? 10 : undefined,
					}}
				>
					<contentview id="proxy-absolute-child" style={{ width: 40, height: 20 }} />
				</proxyviewcontainer>
			</masonview>
			<contentview id="proxy-single" style={{ width: 100, height: 30 }}>
				<proxyviewcontainer>
					<label id="proxy-single-child" text="Single" />
				</proxyviewcontainer>
			</contentview>
			<masonview
				id="proxy-dock"
				style={{
					width: 100,
					height: 60,
					display: 'grid',
					gridTemplateColumns: phase === 1 ? '100px' : '40px 60px',
					gridTemplateRows: phase === 1 ? '20px 40px' : '60px',
				}}
			>
				<proxyviewcontainer style={{ gridRow: '1', gridColumn: '1' }}>
					<contentview id="proxy-dock-child" style={{ width: 40, height: 20 }} />
				</proxyviewcontainer>
				<contentview
					id="proxy-dock-rest"
					style={{ gridRow: phase === 1 ? '2' : '1', gridColumn: phase === 1 ? '1' : '2' }}
				/>
			</masonview>
			<contentview id="proxy-natural">
				<proxyviewcontainer>
					<contentview style={{ width: 40, height: 20 }} />
				</proxyviewcontainer>
			</contentview>
			<proxyviewcontainer id="proxy-empty" ref={proxyRefs.empty} />
			<masonview id="advance-proxy" onTap={() => phase$.set(phase + 1)} style={{ display: 'flex' }}>
				<label text="Advance proxy" />
			</masonview>
		</masonview>
	)
}

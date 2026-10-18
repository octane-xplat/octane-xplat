/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const glassRefs = { host: { current: null as any }, child: { current: null as any } }
export const glassEvents: string[] = []
const callback = (view: any) => {
	if (view) {
		glassEvents.push('attach')
		return () => glassEvents.push('cleanup')
	}
}

const refs = [glassRefs.child, [callback]]

function Moving() {
	return (
		<liquidglass id="glass-moving" ref={refs} style={{ width: 40, height: 20 }}>
			<label id="glass-descendant" text="Nested glass" />
		</liquidglass>
	)
}

export default function Glass() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	return (
		<masonview display="flex" flexDirection="column">
			<liquidglass
				id="glass"
				ref={glassRefs.host}
				style={phase === 1 ? { width: 240, height: 100 } : { width: 200, height: 80 }}
			>
				{(phase >= 3 ? ['b', 'a'] : ['a', 'b'])
					.filter((id) => phase < 4 || id !== 'b')
					.map((id) => (
						<contentview
							key={id}
							id={'glass-' + id}
							horizontalAlignment={phase === 1 ? 'right' : undefined}
							verticalAlignment={phase === 1 ? 'bottom' : undefined}
							style={phase === 1 ? { width: 40, height: 20, margin: 5 } : undefined}
						>
							<label id={'glass-text-' + id} text={phase === 1 ? 'Updated ' + id : id} />
						</contentview>
					))}
				{phase < 5 ? (
					<Moving />
				) : phase === 5 ? (
					<contentview
						key="replacement"
						id="glass-moving"
						ref={refs}
						style={{ width: 60, height: 30 }}
					>
						<label id="glass-replacement" text="Replacement" />
					</contentview>
				) : phase === 8 ? (
					<Moving />
				) : null}
			</liquidglass>
			<liquidglass id="glass-tracks" style={{ width: 160, height: 60 }}>
				<contentview id="glass-fill" row={0} col={0} style={{ width: 80, height: 30 }} />
				<contentview id="glass-cell" row={1} col={1} style={{ width: 30, height: 10 }} />
			</liquidglass>
			<liquidglass id="glass-other" style={{ width: 100, height: 40 }}>
				{phase === 7 ? <Moving /> : null}
			</liquidglass>
			<masonview display="flex" id="advance-glass" onTap={() => phase$.set(phase + 1)}>
				<label text="Advance glass" />
			</masonview>
		</masonview>
	)
}

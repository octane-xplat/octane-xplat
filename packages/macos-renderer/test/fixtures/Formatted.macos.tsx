/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const formattedRef = { current: null as any }
export const spanRef = { current: null as any }
export const formattedRefEvents: string[] = []
const callback = (element: any) => {
	if (element) {
		formattedRefEvents.push('attach')
		return () => formattedRefEvents.push('cleanup')
	}
}

const refs = [formattedRef, [callback]]

export default function Formatted() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const content = () => (
		<formattedstring
			key={phase === 8 ? 'replacement' : 'content'}
			id="formatted"
			ref={refs}
			fontFamily={phase < 2 ? 'system-ui' : undefined}
			fontSize={phase < 2 ? (phase === 1 ? 24 : 20) : undefined}
			color={phase < 2 ? '#ff0000' : undefined}
			backgroundColor={phase < 2 ? '#ffff00' : undefined}
		>
			{phase === 5
				? null
				: (phase >= 3 ? ['b', 'a'] : ['a', 'b'])
						.filter((id) => phase !== 4 || id !== 'a')
						.map((id) => (
							<span
								key={id}
								id={'formatted-' + id}
								ref={id === 'a' ? spanRef : undefined}
								text={id === 'a' ? (phase === 1 ? 'Updated' : 'A') : 'B'}
								fontWeight={id === 'a' && phase < 2 ? 'bold' : undefined}
								fontStyle={id === 'a' && phase < 2 ? 'italic' : undefined}
								textDecoration={id === 'a' && phase < 2 ? 'underline line-through' : undefined}
							>
								{id === 'a' ? (
									<span
										id="formatted-nested"
										text="n"
										color={phase < 2 ? '#0000ff' : undefined}
										style={phase < 2 ? { fontSize: 12 } : undefined}
									/>
								) : null}
							</span>
						))}
		</formattedstring>
	)

	return (
		<stacklayout>
			<label id="formatted-parent" text="fallback" style={{ fontSize: 16, width: 240, height: 28 }}>
				{phase !== 6 && phase < 9 ? content() : null}
			</label>
			<button id="formatted-button" text="Plain Button">
				{phase === 6 ? null : <formattedstring fontSize={phase < 2 ? (phase === 1 ? 24 : 20) : undefined}>
					<span text={phase === 1 ? 'Updated Button' : 'Button'} />
				</formattedstring>}
			</button>
			<textfield id="formatted-field" text="Plain Field">
				{phase === 6 ? null : <formattedstring fontSize={phase < 2 ? (phase === 1 ? 24 : 20) : undefined}>
					<span text={phase === 1 ? 'Updated Field' : 'Field'} />
				</formattedstring>}
			</textfield>
			<textview id="formatted-view" text="Plain View" style={{ height: 30 }}>
				{phase === 6 ? null : <formattedstring fontSize={phase < 2 ? (phase === 1 ? 24 : 20) : undefined}>
					<span text={phase === 1 ? 'Updated View' : 'View'} />
				</formattedstring>}
			</textview>
			<searchbar id="formatted-search" text="Plain Search">
				{phase === 6 ? null : <formattedstring fontSize={phase < 2 ? (phase === 1 ? 24 : 20) : undefined}>
					<span text={phase === 1 ? 'Updated Search' : 'Search'} />
				</formattedstring>}
			</searchbar>
			<button id="formatted-other" text="other">
				{phase >= 9 ? content() : null}
			</button>
			<flexboxlayout id="advance-formatted" onTap={() => phase$.set(phase + 1)}>
				<label text="Advance" />
			</flexboxlayout>
		</stacklayout>
	)
}

/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useSignal$ } from 'octane/signals/client'

export const searchRefs = { host: { current: null as any }, secondary: { current: null as any } }
export const searchRefEvents: string[] = []
export const searchEvents: any[] = []
const callback = (view: any) => {
	if (view) {
		searchRefEvents.push('attach')
		return () => searchRefEvents.push('cleanup')
	}
}

const refs = [searchRefs.host, [callback]]
const change = (event: any) => searchEvents.push(event)
const submit = (event: any) => searchEvents.push(event)

export default function Search() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const moving = () => (
		<searchbar key="moving" id="search-moving" ref={searchRefs.secondary} text="Moving" />
	)

	return (
		<masonview
			style={{
				flexDirection: 'column',
				display: 'flex',
			}}
		>
			<masonview
				id="search-parent"
				style={mergeStyle(
					{ flexDirection: 'column' },
					{
						display: 'flex',
						width: 220,
						height: 120,
						padding: 10,
					},
				)}
			>
				{phase < 6
					? (phase >= 3 ? ['b', 'a'] : ['a', 'b'])
							.filter((id) => phase < 4 || id !== 'b')
							.map((id) =>
								id === 'a' && phase === 5 ? (
									<label key="replacement" id="search-a" text="Replacement" />
								) : (
									<searchbar
										key={id}
										id={'search-' + id}
										ref={id === 'a' ? refs : undefined}
										text={phase === 1 ? 'Updated ' + id : phase === 0 ? 'Initial ' + id : undefined}
										hint={phase === 1 ? 'Updated hint' : phase === 0 ? 'Find items' : undefined}
										onTextChange={phase < 3 ? change : undefined}
										onSubmit={phase < 3 ? submit : undefined}
										style={{ width: 200, height: 28 }}
									/>
								),
							)
					: null}
				{phase === 7 ? moving() : null}
			</masonview>
			<contentview id="search-other" style={{ width: 220, height: 40 }}>
				{phase === 6 || phase === 8 ? moving() : null}
			</contentview>
			<masonview
				id="advance-search"
				onTap={() => phase$.set(phase + 1)}
				style={{ display: 'flex' }}
			>
				<label text="Advance search" />
			</masonview>
		</masonview>
	)
}

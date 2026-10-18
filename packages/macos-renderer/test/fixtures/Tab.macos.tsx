/** @jsxImportSource @octane-xplat/jsx */
import { useLayoutEffect } from 'octane'
import { useSignal$ } from 'octane/signals/client'
export const tabRef = { current: null as any }
export const itemRef = { current: null as any }
export const childRef = { current: null as any }
export const tabEvents: any[] = []
export const tabRefs: string[] = []
const refs = [
	tabRef,
	[
		(view: any) => {
			if (view) {
				tabRefs.push('attach')
				return () => tabRefs.push('cleanup')
			}
		},
	],
]

const icon =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII='

export default function Tabs() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const content = () => (
		<tabview
			id="tabs"
			key={phase === 5 ? 'replacement' : 'tabs'}
			ref={refs}
			{...(phase === 2 ? {} : { selectedIndex: phase === 0 ? 1 : phase === 1 ? 99 : -9 })}
			onSelectedIndexChange={(event) => tabEvents.push(event)}
			onSelectedIndexChanged={(event) => tabEvents.push(event)}
			style={{ width: 240, height: 100 }}
		>
			{(phase === 1 ? ['b', 'a', 'c'] : phase === 3 ? ['a'] : ['a', 'b']).map((key) => (
				<tabviewitem
					key={key}
					id={'tab-' + key}
					ref={key === 'a' ? itemRef : undefined}
					{...(phase === 2
						? {}
						: {
								title: key === 'a' ? (phase === 0 ? 'First' : 'Updated') : 'Same',
								iconSource:
									key === 'a'
										? phase === 3
											? 'font://★'
											: icon
										: key === 'b'
											? 'sys://gear'
											: 'font://★',
							})}
				>
					<label
						id={'tab-content-' + key}
						ref={key === 'a' ? childRef : undefined}
						text={key + '-' + phase}
					/>
				</tabviewitem>
			))}
		</tabview>
	)

	return (
		<masonview display="flex" flexDirection="column">
			<tabview id="tabs-empty" />
			<masonview display="flex" flexDirection="column" id="tabs-left">{phase !== 4 && phase !== 6 ? content() : null}</masonview>
			<contentview id="tabs-right">{phase === 4 ? content() : null}</contentview>
			<masonview display="flex" id="advance-tabs" onTap={() => phase$.set(phase + 1)}>
				<label text="Advance" />
			</masonview>
		</masonview>
	)
}

export const contentEffects: string[] = []
function ImperativeContent() {
	useLayoutEffect(() => {
		contentEffects.push('mount')
		return () => {
			contentEffects.push('unmount')
		}
	}, [])

	return <label ref={imperativeRefs.child} text="Imperative content" />
}

export const imperativeRefs = {
	a: { current: null as any },
	b: { current: null as any },
	child: { current: null as any },
}

export let updateTabArrays = (_left: any[], _right: any[]) => {}
export function ImperativeTabs() {
	const arrays$ = useSignal$({ left: [] as any[], right: [] as any[] })
	updateTabArrays = (left, right) => arrays$.set({ left, right })
	return (
		<>
			<tabviewitem title="A" ref={imperativeRefs.a}>
				<ImperativeContent />
			</tabviewitem>
			<tabviewitem title="B" ref={imperativeRefs.b}>
				<label text="B content" />
			</tabviewitem>
			<masonview display="flex" flexDirection="column">
				<tabview
					id="tabs-imperative-left"
					items={arrays$.get().left}
					style={{ width: 200, height: 80 }}
				/>
				<tabview
					id="tabs-imperative-right"
					items={arrays$.get().right}
					style={{ width: 200, height: 80 }}
				/>
			</masonview>
		</>
	)
}

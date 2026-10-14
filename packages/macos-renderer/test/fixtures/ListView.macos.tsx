/** @jsxImportSource @octane-xplat/jsx */
import { createMacOSRoot } from '@octane-xplat/macos-renderer'

export const listViewRef = { current: null as any }
export const listViewRefs: string[] = []
export const rowRefs = [{ current: null as any }, { current: null as any }]
export const listViewEvents: any[] = []
export const factoryHosts: any[] = []
export const factoryRefs: any[] = []
const listRef = (view: any) => {
	if (view) {
		listViewRefs.push('attach')
		return () => listViewRefs.push('cleanup')
	}
}

const refs = [listViewRef, [listRef]]
function FactoryContent() {
	return (
		<label
			text="Factory"
			ref={(view) => {
				factoryRefs.push(view)
				return () => factoryRefs.push('cleanup')
			}}
			style={{ height: 24 }}
		/>
	)
}

const factory = () => {
	const host = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 180, height: 24 },
	})

	factoryHosts.push(host)
	createMacOSRoot(host).render(FactoryContent as any, {})
	return host
}

export default function ListView({ phase }: { phase: number }) {
	const content = () => (
		<listview
			key={phase === 5 ? 'replacement' : 'list'}
			id="raw-listview"
			ref={refs}
			{...(phase === 2
				? {}
				: {
						items: phase === 0 ? ['A', 'B'] : ['C', 'D'],
						renderItem: (item: any, index: number) => (
							<label ref={rowRefs[index]} text={item + ':' + phase} style={{ height: 28 }} />
						),
						separatorColor: phase === 0 ? '#ff0000' : '#0000ff',
						onItemLoading: (event: any) => listViewEvents.push(event),
						onItemTap: (event: any) => listViewEvents.push(event),
						onLoadMoreItems: (event: any) => listViewEvents.push(event),
					})}
			style={{ width: 240, height: 70 }}
		/>
	)

	return (
		<stacklayout>
			<stacklayout id="listview-left" style={{ width: 260, height: 100 }}>
				{(phase === 3 ? ['tail', 'list'] : ['list', 'tail']).map((id) =>
					id === 'tail' ? (
						<label key="tail" id="listview-tail" text="tail" style={{ height: 20 }} />
					) : phase !== 4 && phase !== 6 ? (
						content()
					) : null,
				)}
			</stacklayout>
			<contentview id="listview-right" style={{ width: 260, height: 70 }}>
				{phase === 4 ? content() : null}
			</contentview>
			<listview
				id="listview-default"
				items={phase === 2 ? [] : [42, null]}
				style={{ width: 240, height: 60 }}
			/>
			<listview
				id="listview-string"
				items={
					phase === 2 ? [] : [{ person: { name: phase === 0 ? 'First' : 'Second' }, count: 3 }]
				}
				itemTemplate={
					'<StackLayout orientation="horizontal"><Label text="{{ person.name }}"/><Label text="{{ count + 2 }}"/></StackLayout>'
				}
				style={{ width: 240, height: 40 }}
			/>
			<listview
				id="listview-factory"
				items={phase === 2 ? [] : ['bound' + phase]}
				itemTemplate="<Label text='Wrong'/>"
				itemTemplates={[{ key: 'default', createView: factory }]}
				style={{ width: 240, height: 40 }}
			/>
		</stacklayout>
	)
}

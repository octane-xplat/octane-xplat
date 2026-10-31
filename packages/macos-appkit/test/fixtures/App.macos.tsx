/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useSignal$ } from 'octane/signals/client'
import { NSTextField } from '@octane-xplat/platform/macos'

export const stackRefs: any[] = []
export const childRefs: Record<string, { current: any }> = {
	a: { current: null },
	b: { current: null },
	c: { current: null },
}

export const refEvents: string[] = []
export const tapEvents: string[] = []
const stackRef = (view: any) => {
	if (view) {
		stackRefs.push(view)
		refEvents.push('attach')
		return () => refEvents.push('cleanup')
	}
}

export default function App() {
	const count$ = useSignal$(0)
	return (
		<masonview
			style={{
				flexDirection: 'column',
				display: 'flex',
			}}
		>
			<actionbar
				id="hmr-actionbar"
				title={'First revision' + count$.get()}
				flat={count$.get() > 0}
				style={{ width: 240, height: 44 }}
			/>
			<listview
				id="hmr-listview"
				items={['First revision' + count$.get()]}
				renderItem={(item) => <label text={String(item)} style={{ height: 24 }} />}
				style={{ width: 200, height: 40 }}
			/>
			<segmentedbar id="hmr-item-bar" selectedIndex={count$.get()}>
				<segmentedbaritem id="hmr-item" title="First revision" />
				<segmentedbaritem title={String(count$.get())} />
			</segmentedbar>
			<tabview id="hmr-tabs" selectedIndex={count$.get()} style={{ width: 120, height: 70 }}>
				<tabviewitem id="hmr-tab-item" title="First revision">
					<label id="hmr-tab-content" text="First revision" />
				</tabviewitem>
				<tabviewitem title="Retained">
					<label text="Other" />
				</tabviewitem>
			</tabview>
			<segmentedbar
				id="hmr-segment"
				items={[{ title: 'First revision' }, { title: 'Retained' }]}
				selectedIndex={count$.get()}
			/>
			<progress
				id="hmr-progress"
				value={count$.get() * ('First revision'.startsWith('First') ? 25 : 40)}
				maxValue={100}
			/>
			<listpicker
				id="hmr-list"
				items={['First revision', 'Retained']}
				selectedIndex={count$.get()}
			/>
			<timepicker
				id="hmr-time"
				time={
					new Date(
						2026,
						4,
						1,
						count$.get() + ('First revision'.startsWith('First') ? 10 : 12),
						35,
						42,
					)
				}
			/>
			<datepicker
				id="hmr-date"
				date={
					new Date(2026, 4, count$.get() + ('First revision'.startsWith('First') ? 10 : 12), 19)
				}
			/>
			<activityindicator
				id="hmr-activity"
				busy={count$.get() > 0 && 'First revision'.startsWith('First')}
				style={{ width: 24, height: 24 }}
			/>
			<htmlview
				id="hmr-html"
				html={'<b>First revision</b>' + String(count$.get())}
				style={{ fontSize: 18 }}
			/>
			<label id="hmr-formatted-parent">
				<formattedstring id="hmr-formatted" fontSize={18}>
					<span text="First revision" />
					<span text={String(count$.get())} />
				</formattedstring>
			</label>
			<searchbar id="hmr-search" text="First revision" hint={String(count$.get())} />
			<label id="count" style={{ fontSize: 22, fontWeight: 700 }}>
				{String(count$.get())}
			</label>
			<contentview id="hmr-content" style={{ width: 180, height: 32 }}>
				<label id="revision" text="First revision" />
			</contentview>
			<masonview id="hmr-dock" style={{ width: 180, height: 32 }}>
				<label id="dock-revision" text="First revision" />
			</masonview>
			<masonview
				id="hmr-wrap"
				style={{ width: 180, height: 60, display: 'flex', flexWrap: 'wrap' }}
			>
				<label id="wrap-revision" text="First revision" />
			</masonview>
			<rootlayout id="hmr-root" style={{ width: 180, height: 32 }}>
				<label id="root-revision" text="First revision" />
			</rootlayout>
			<liquidglass id="hmr-glass" style={{ width: 180, height: 32 }}>
				<label id="glass-revision" text="First revision" />
			</liquidglass>
			<proxyviewcontainer id="hmr-proxy">
				<label id="proxy-revision" text="First revision" />
			</proxyviewcontainer>
			<placeholder
				id="hmr-placeholder"
				style={{ width: 180, height: 24 }}
				onCreatingView={(event: any) => {
					event.view = NSTextField.labelWithString('First revision')
				}}
			/>
			<masonview
				id="layout"
				onTap={
					count$.get() === 1
						? (event) =>
								tapEvents.push(event.eventName + ':' + String(event.object === stackRefs[0]))
						: undefined
				}
				ref={stackRef}
				style={mergeStyle(
					{ flexDirection: count$.get() === 1 ? 'row' : 'column' },
					{ display: 'flex', width: 240, height: 80, padding: 8 },
				)}
			>
				{(count$.get() >= 2 ? [] : count$.get() === 1 ? ['c', 'a', 'b'] : ['a', 'b', 'c']).map(
					(id) => (
						<label
							key={id}
							id={id}
							ref={childRefs[id]}
							text={id}
							style={{ width: 40, height: 16, alignSelf: id === 'a' ? 'center' : 'start' }}
						/>
					),
				)}
			</masonview>
			<masonview
				id="increment"
				onTap={() => count$.set(count$.get() + 1)}
				style={{ display: 'flex' }}
			>
				<label text="Increment" />
			</masonview>
		</masonview>
	)
}

// Shared native protocol; platform adapters read actual viewport/focus state.
import { createContext, useContext, useLayoutEffect, useMemo } from 'octane'
import { Text, TextInput, ScrollableArea, View } from '@octane-xplat/ui'
import { createRouter } from '../src/router-instance'
import { defineRoute } from '../src/define-route'
import { defineRoutes } from '../src/route-table'
import { useRouter } from '../src/router-hooks.tsrx'
import { ClientRouteOutlet } from '../src/ClientRouteOutlet.tsrx'
import type {
	ClientRouterHost,
	Renderable,
	RouteScreenProps,
	ScrollableAreaHandle,
	TextInputHandle,
} from '../src/props'

type Entry = {
	id: string
	input: TextInputHandle | null
	scroll: ScrollableAreaHandle | null
	dismiss(): Promise<{ status: string }>
}

type Fixture = ReturnType<typeof createFixture>
const Context = createContext<Fixture | null>(null)
const Provider: any = Context

const item = defineRoute({
	path: '/retention/:id',
	transition: 'none',
	loader: ({ params }) => ({ id: params.id }),
})

function Item(props: RouteScreenProps<typeof item>): any {
	const fixture = useContext(Context)!
	const navigation = useRouter(fixture.navigation)
	const entry = useMemo<Entry>(
		() => ({ id: props.params.id, input: null, scroll: null, dismiss: () => navigation.dismiss() }),
		[],
	)

	useLayoutEffect(() => {
		fixture.entries.add(entry)
		return () => {
			fixture.entries.delete(entry)
		}
	}, [])

	return (
		<View style={{ height: fixture.height }}>
			<TextInput
				ref={(value) => {
					entry.input = value
				}}
				defaultValue={props.params.id}
			/>
			<ScrollableArea
				height={200}
				ref={(value) => {
					entry.scroll = value
				}}
				label="Route content"
			>
				<View style={{ height: fixture.contentHeight }}>
					<Text>{props.data.id}</Text>
				</View>
			</ScrollableArea>
		</View>
	)
}

function createFixture(host: ClientRouterHost, pane: boolean) {
	let started = false
	let release!: () => void
	const delayed = new Promise<void>((resolve) => {
		release = resolve
	})

	const late = defineRoute({
		path: '/retention-late',
		transition: 'none',
		loader: () => {
			started = true
			return delayed
		},
	}).screen(Late)

	const navigation = createRouter({
		catalog: defineRoutes([item.screen(Item), late]),
		host: host.host,
		stacks: ['retention-controls'],
	})

	host.attach(navigation)
	return {
		host,
		navigation,
		get started() {
			return started
		},
		release,
		stack: pane ? 'retention-controls' : 'root',
		navigator: navigation.forStack(pane ? 'retention-controls' : 'root'),
		entries: new Set<Entry>(),
		lateMounted: 0,
		ready: false,
		height: 280,
		contentHeight: 1600,
	}
}

function Late(): any {
	const fixture = useContext(Context)!
	useLayoutEffect(() => {
		fixture.lateMounted++
	}, [])

	return <Text>Late result</Text>
}

function App(props: { fixture: Fixture }): any {
	useLayoutEffect(() => {
		props.fixture.ready = true
	}, [])

	return (
		<Provider value={props.fixture}>
			<ClientRouteOutlet host={props.fixture.host} flow={props.fixture.stack} />
		</Provider>
	)
}

/** Programmatic focus/scroll calls qualify retention, not physical or AT input. */
export async function qualifyRouteRetention(options: {
	host: ClientRouterHost
	pane?: boolean
	mount(
		component: (props: { fixture: Fixture }) => Renderable,
		props: { fixture: Fixture },
	): () => void
	offset(scroll: ScrollableAreaHandle): number
	range(scroll: ScrollableAreaHandle): number
	describe?(scroll: ScrollableAreaHandle): unknown
	focused(input: TextInputHandle): boolean
	check(name: string, pass: boolean): void
	wait(name: string, condition: () => boolean): Promise<void>
	settled(): Promise<void>
}) {
	const fixture = createFixture(options.host, options.pane === true)
	const unmount = options.mount(App, { fixture })
	const navigation = fixture.navigator
	const prefix = options.pane ? 'retained pane: ' : 'retained page: '
	const check = (name: string, pass: boolean) => options.check(prefix + name, pass)
	const wait = (name: string, condition: () => boolean) => options.wait(prefix + name, condition)
	async function drive<Result>(name: string, operation: Promise<Result>): Promise<Result> {
		let done = false
		void operation.then(
			() => {
				done = true
			},
			() => {
				done = true
			},
		)

		await wait(name, () => done)
		return operation
	}

	const find = (id: string) => [...fixture.entries].find((entry) => entry.id === id)
	const near = (actual: number, expected: number) => Math.abs(actual - expected) < 2
	try {
		await wait('outlet mounted', () => fixture.ready)
		check(
			'first entry commits',
			(
				await drive(
					'first push settles',
					navigation.push({ to: '/retention/:id', params: { id: 'a' } }),
				)
			).status === 'committed',
		)

		await wait(
			'first controls mounted',
			() => !!find('a')?.scroll?.native && !!find('a')?.input?.native,
		)

		const a = find('a')!
		const originalScroll = a.scroll!.native
		const originalInput = a.input!.native
		await wait(
			'first viewport has measured scrollable content',
			() => options.range(a.scroll!) >= 400,
		)

		a.scroll!.scrollToOffset({ block: 120 })
		await wait('first entry scrolls', () => near(options.offset(a.scroll!), 120))

		check(
			'second entry commits',
			(
				await drive(
					'second push settles',
					navigation.push({ to: '/retention/:id', params: { id: 'b' } }),
				)
			).status === 'committed',
		)

		await wait(
			'second controls mounted',
			() => !!find('b')?.scroll?.native && !!find('b')?.input?.native,
		)

		const b = find('b')!
		await wait(
			'second viewport has measured scrollable content',
			() => options.range(b.scroll!) >= 400,
		)

		b.scroll!.scrollToOffset({ block: 280 })
		await wait('second entry scrolls independently', () => near(options.offset(b.scroll!), 280))
		check(
			'hidden first entry keeps its native controls',
			a.scroll!.native === originalScroll && a.input!.native === originalInput,
		)

		check('Back commits', (await drive('Back settles', navigation.back())).status === 'committed')
		await wait('Back restores first offset', () => near(options.offset(a.scroll!), 120))
		check('Back releases the removed controls', !b.scroll && !b.input)
		check(
			'Back restores the same native controls',
			a.scroll!.native === originalScroll && a.input!.native === originalInput,
		)

		a.input!.blur()
		await wait('explicit blur clears native focus', () => !options.focused(a.input!))
		a.input!.focus()
		await wait('explicit focus reaches the native field', () => options.focused(a.input!))
		const beforePending = options.offset(a.scroll!)
		const pending = navigation.push({ to: '/retention-late' })
		await wait('delayed loader starts', () => fixture.started)
		check('pending loader keeps committed focus', options.focused(a.input!))
		check(
			'refresh supersedes the pending loader',
			(await drive('refresh settles', navigation.refresh())).status === 'committed',
		)

		check(
			'superseded attempt cancels',
			(await drive('old attempt settles', pending)).status === 'cancelled',
		)

		fixture.release()
		await Promise.resolve()
		await Promise.resolve()
		check(
			'cancelled loader cannot mount or take focus',
			fixture.lateMounted === 0 && options.focused(a.input!),
		)

		check(
			'refresh keeps the native scroll position',
			near(options.offset(a.scroll!), beforePending),
		)

		a.input!.blur()

		check(
			'modal commits',
			(
				await drive(
					'modal push settles',
					navigation.push({
						to: '/retention/:id',
						params: { id: 'modal' },
						presentation: 'modal',
					}),
				)
			).status === 'committed',
		)

		await wait(
			'modal controls mounted',
			() => !!find('modal')?.scroll?.native && !!find('modal')?.input?.native,
		)

		const modal = find('modal')!
		await wait(
			'modal viewport has measured scrollable content',
			() => options.range(modal.scroll!) >= 400,
		)

		modal.scroll!.scrollToOffset({ block: 340 })
		await wait('modal scrolls independently', () => near(options.offset(modal.scroll!), 340))
		check('modal keeps background scroll', near(options.offset(a.scroll!), beforePending))
		check(
			'modal dismisses',
			(await drive('modal dismissal settles', modal.dismiss())).status === 'committed',
		)

		check(
			'dismiss preserves presenter controls and offset',
			a.scroll!.native === originalScroll && near(options.offset(a.scroll!), beforePending),
		)

		check('dismiss releases modal controls', !modal.scroll && !modal.input)
	} catch (error) {
		const geometry = [...fixture.entries].map((entry) => ({
			id: entry.id,
			offset: entry.scroll ? options.offset(entry.scroll) : null,
			range: entry.scroll ? options.range(entry.scroll) : null,
			native: entry.scroll ? options.describe?.(entry.scroll) : null,
		}))

		throw new Error(String(error) + ' ' + JSON.stringify(geometry))
	} finally {
		unmount()
		fixture.navigation.dispose()
		fixture.release()
		await options.settled()
	}
}

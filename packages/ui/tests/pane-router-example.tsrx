// Shared qualification example: all routing imports use the public client API.
import { createContext, useContext, useState } from 'octane'
import { Text, View, RouteOutlet, type Renderable } from '@octane-xplat/ui'
import {
	createPaneRouterHost,
	createRouter,
	defineRoute,
	defineRoutes,
	getRouteApi,
	RouterPane,
	useRouter,
	type RouteScreenProps,
} from '@octane-xplat/ui/routing'

type Entry = { id: string; title: string; count: number; person: string; increment(): void }
type PaneExampleState = ReturnType<typeof createPaneRouterExample>
const Person = createContext('missing')
const PersonProvider: any = Person
const Fixture = createContext<PaneExampleState | null>(null)
const FixtureProvider: any = Fixture
const item = defineRoute({
	path: '/pane-example/:id',
	loader: ({ params }) => ({ title: params.id }),
})

function Item(props: RouteScreenProps<typeof item>): any {
	const fixture = useContext(Fixture)
	if (!fixture) {
		throw new Error('The pane example requires its instance provider')
	}

	const route = getRouteApi('/pane-example/:id', fixture.navigation)
	const id = route.useParams().id
	const person = useContext(Person)
	const navigator = useRouter(fixture.navigation)
	const [count, setCount] = useState(0)
	fixture.entries.set(props.params.id, {
		id,
		title: props.data.title,
		count,
		person,
		increment: () => setCount((value) => value + 1),
	})

	return (
		<View>
			<Text id={'pane-example-' + props.params.id}>
				{id +
					':' +
					props.data.title +
					':' +
					count +
					':' +
					person +
					':' +
					navigator.getSnapshot().modal}
			</Text>
		</View>
	)
}

function Layout(props: { children?: Renderable }): any {
	return <RouteOutlet>{props.children}</RouteOutlet>
}

const catalog = defineRoutes({ routes: [item.screen(Item)], layouts: { 'pane-example': Layout } })

export function createPaneRouterExample() {
	const host = createPaneRouterHost()
	const navigation = createRouter({ catalog, host: host.host, stacks: ['other'] })
	host.attach(navigation)
	const entries = new Map<string, Entry>()
	let removeRoot = () => {}
	let changePerson = (_person: string) => {}
	return {
		navigation,
		host,
		entries,
		bindViewActions(actions: { removeRoot(): void; changePerson(person: string): void }) {
			removeRoot = actions.removeRoot
			changePerson = actions.changePerson
		},
		removeRoot: () => removeRoot(),
		changePerson: (person: string) => changePerson(person),
	}
}

export function PaneRouterExample(props: { fixture: PaneExampleState }): any {
	const fixture = props.fixture
	const [shown, setShown] = useState(true)
	const [person, setPerson] = useState('Avery')
	fixture.bindViewActions({ removeRoot: () => setShown(false), changePerson: setPerson })
	return (
		<FixtureProvider value={fixture}>
			<PersonProvider value={person}>
				<View className="flex-1">
					{shown ? (
						<RouterPane host={fixture.host} router={fixture.navigation}>
							<Text id="pane-example-base">Pane base</Text>
						</RouterPane>
					) : null}
					<RouterPane host={fixture.host} router={fixture.navigation} stack="other">
						<Text>Other base</Text>
					</RouterPane>
				</View>
			</PersonProvider>
		</FixtureProvider>
	)
}

/** Renderer adapters supply actual native/DOM identity and their commit wait. */
export async function qualifyPaneRouterExample(options: {
	mount(
		component: (props: { fixture: PaneExampleState }) => Renderable,
		props: { fixture: PaneExampleState },
	): () => void
	find(id: string): unknown
	check(name: string, pass: boolean): void
	wait(name: string, predicate: () => boolean): Promise<void>
}) {
	const fixture = createPaneRouterExample()
	const unmount = options.mount(PaneRouterExample, { fixture })
	const check = (name: string, pass: boolean) => options.check('public panes: ' + name, pass)
	const wait = (name: string, predicate: () => boolean) =>
		options.wait('public panes: ' + name, predicate)

	const destination = (id: string) => ({ to: '/pane-example/:id', params: { id } }) as const
	try {
		await wait('base mounts', () => !!options.find('pane-example-base'))
		check(
			'push commits',
			(await fixture.navigation.push(destination('coat'))).status === 'committed',
		)

		const coat = options.find('pane-example-coat')
		check(
			'prepared data and source provider render',
			!!coat &&
				fixture.entries.get('coat')?.title === 'coat' &&
				fixture.entries.get('coat')?.person === 'Avery',
		)

		fixture.entries.get('coat')!.increment()
		await wait('local state updates', () => fixture.entries.get('coat')?.count === 1)
		check(
			'next route commits',
			(await fixture.navigation.push(destination('hat'))).status === 'committed',
		)

		check(
			'retained entry keeps its own match',
			fixture.entries.get('coat')?.id === 'coat' &&
				fixture.entries.get('coat')?.count === 1 &&
				options.find('pane-example-coat') === coat,
		)

		check(
			'named flow commits',
			(await fixture.navigation.forStack('other').push(destination('glove'))).status ===
				'committed',
		)

		const glove = options.find('pane-example-glove')
		check(
			'flows stay independent',
			fixture.navigation.getSnapshot().route?.params.id === 'hat' &&
				fixture.navigation.forStack('other').getSnapshot().route?.params.id === 'glove',
		)

		fixture.changePerson('Jordan')
		await wait('providers reach retained entries', () =>
			['coat', 'hat', 'glove'].every((id) => fixture.entries.get(id)?.person === 'Jordan'),
		)

		check('Back commits', (await fixture.navigation.back()).status === 'committed')
		check(
			'Back retains native or DOM identity',
			options.find('pane-example-coat') === coat && fixture.entries.get('coat')?.count === 1,
		)

		const modal = await fixture.navigation
			.forStack('other')
			.push({ ...destination('modal'), presentation: 'modal' })

		check(
			'modal subset is explicit',
			modal.status === 'unsupported' &&
				fixture.navigation.forStack('other').getSnapshot().route?.params.id === 'glove',
		)

		fixture.removeRoot()
		await wait(
			'removal releases owned history',
			() => fixture.navigation.getSnapshot().route === null && !options.find('pane-example-coat'),
		)

		check(
			'removal preserves another flow',
			options.find('pane-example-glove') === glove && !fixture.navigation.getSnapshot().canGoBack,
		)

		check(
			'remaining instance stays usable',
			(await fixture.navigation.forStack('other').push(destination('scarf'))).status ===
				'committed',
		)
	} finally {
		unmount()
		fixture.navigation.dispose()
	}
}

import { Text } from '@octane-xplat/ui'
import { defineStory } from '@octane-xplat/workshop'
import { WorkshopCounter, type CounterState } from '../counter.tsrx'

type Props = { step: number; label?: string }
type Fixture = { account: string }

export const Basic = defineStory<Props, CounterState, Fixture>({
	id: 'counter/basic',
	title: 'Examples / Counter / Basic',
	targets: 'all',
	component: WorkshopCounter,
	args: { step: 1 },
	controls: {
		step: { type: 'number', min: 1, max: 10 },
		label: { type: 'string', allowUnset: true },
	},
	state: () => ({ count: 0 }),
	fixture: () => ({ account: 'Demo' }),
})

function StaticCard() {
	return <Text>A static story — no controls, state or fixture.</Text>
}

export const Static = defineStory({
	id: 'counter/static',
	title: 'Examples / Counter / Static',
	targets: 'all',
	component: StaticCard,
	args: {},
})

export const AsyncFixture = defineStory<Props, CounterState, Fixture>({
	id: 'counter/async-fixture',
	title: 'Examples / Counter / Async fixture',
	targets: 'all',
	component: WorkshopCounter,
	args: { step: 2 },
	controls: { step: { type: 'enum', options: [1, 2, 5] } },
	state: () => ({ count: 0 }),
	fixture: async ({ signal }) => {
		await new Promise((resolve, reject) => {
			const timer = setTimeout(resolve, 600)
			signal.addEventListener('abort', () => {
				clearTimeout(timer)
				reject(new Error('fixture cancelled'))
			})
		})
		return { account: 'AsyncAccount' }
	},
})

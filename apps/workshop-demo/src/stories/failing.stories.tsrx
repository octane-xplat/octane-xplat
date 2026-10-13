import { defineStory } from '@octane-xplat/workshop'

function AlwaysFails() {
	throw new Error('deliberate render failure for recovery testing')
}

export const Broken = defineStory({
	id: 'failing/broken',
	title: 'Recovery / Broken story',
	targets: 'all',
	component: AlwaysFails,
	args: {},
})

export const FixtureFails = defineStory<Record<string, never>, void, { ok: boolean }>({
	id: 'failing/fixture',
	title: 'Recovery / Fixture failure',
	targets: 'all',
	component: () => null,
	args: {},
	fixture: async () => {
		throw new Error('deliberate fixture rejection')
	},
})

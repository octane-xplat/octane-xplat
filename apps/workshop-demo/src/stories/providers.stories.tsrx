import { Text } from '@octane-xplat/ui'
import { createStore, useStore, type Store } from '@octane-xplat/ui/data'
import { defineStory } from '@octane-xplat/workshop'

const themeStore = createStore({ theme: 'sunset' })

export function ThemeProviders(props: { fixture: { account: string }; children?: unknown }) {
	return props.children
}

export function ThemeBadge(props: { fixture: { account: string } }) {
	const { theme } = useStore(themeStore)
	return <Text>{props.fixture.account} — theme: {theme}</Text>
}

export const Provided = defineStory<Record<string, never>, void, { account: string }>({
	id: 'providers/theme',
	title: 'Examples / Providers',
	targets: 'all',
	component: ThemeBadge,
	args: {},
	fixture: () => ({ account: 'Provided' }),
	providers: [ThemeProviders],
})

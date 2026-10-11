import { createRoot } from 'octane'
import { composeStory } from 'storybook/preview-api'
import meta, { UncheckedLight } from './Switch.stories.web'
import './stage.web.css'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'

const catalog = { 'switch--unchecked-light': UncheckedLight }

/** Storybook composes args/decorators; Octane owns component execution and disposal. */
export function mountStory(storyId: string) {
	const story = catalog[storyId as keyof typeof catalog]
	if (!story) {
		throw new Error(`Unknown story: ${storyId}`)
	}

	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	let disposed = false
	try {
		const composed = composeStory(
			story,
			meta,
			{
				render: (args: any, context: any) => <context.component {...args} />,
			},
			{},
			'UncheckedLight',
		)

		root.render(composed())
		return {
			host,
			storyId: composed.id,
			dispose() {
				if (disposed) {
					return
				}

				disposed = true
				root.unmount()
				host.remove()
			},
		}
	} catch (error) {
		root.unmount()
		host.remove()
		throw error
	}
}

import { createRoot } from 'octane'
import { composeStory } from 'storybook/preview-api'
import meta, { CheckedLight, UncheckedLight } from './Switch.stories.web'
import './stage.web.css'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'

const catalog = {
	'switch--unchecked-light': { story: UncheckedLight, exportName: 'UncheckedLight' },
	'switch--checked-light': { story: CheckedLight, exportName: 'CheckedLight' },
}

/** Storybook composes args/decorators; Octane owns component execution and disposal. */
export function mountStory(storyId: string, args?: Record<string, unknown>) {
	const entry = catalog[storyId as keyof typeof catalog]
	if (!entry) {
		throw new Error(`Unknown story: ${storyId}`)
	}

	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	let disposed = false
	try {
		const composed = composeStory(
			entry.story,
			meta,
			{
				render: (args: any, context: any) => <context.component {...args} />,
			},
			{},
			entry.exportName,
		)

		let currentArgs = { ...composed.args, ...args }
		root.render(composed(currentArgs))
		return {
			host,
			storyId: composed.id,
			get args() {
				return currentArgs
			},
			update(nextArgs: Record<string, unknown>) {
				if (disposed) {
					throw new Error(`Cannot update a disposed story: ${storyId}`)
				}

				currentArgs = { ...currentArgs, ...nextArgs }
				root.render(composed(currentArgs))
			},
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

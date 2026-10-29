import { createRoot, flushSync } from 'octane'
import { useImageManipulator } from '../src/index.web'
import type { ImageLoadOptions, ImageManipulatorContext } from '../src/types'

export async function exerciseHook(uri: string) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	let active!: ImageManipulatorContext
	function Consumer(props: { source: string; options: ImageLoadOptions }) {
		active = useImageManipulator(props.source, props.options)
		return null
	}
	const render = async (source: string, options: ImageLoadOptions) => {
		flushSync(() => root.render(Consumer, { source, options }))
		await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))
	}
	const disposed = (value: ImageManipulatorContext) => {
		try {
			value.reset()
			return false
		} catch {
			return true
		}
	}
	await render(uri, { maxWidth: 3 })
	const initial = active
	await render(uri, { maxWidth: 3 })
	const stable = active === initial
	await render(uri, { maxWidth: 2 })
	const boundsChanged = active !== initial && disposed(initial)
	const previous = active
	await render(`${uri}#replacement`, { maxWidth: 2 })
	const sourceChanged = active !== previous && disposed(previous)
	const last = active
	root.unmount()
	await new Promise((resolve) => setTimeout(resolve, 0))
	const unmounted = disposed(last)
	host.remove()
	return { stable, boundsChanged, sourceChanged, unmounted }
}

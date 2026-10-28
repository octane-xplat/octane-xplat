// @vitest-environment jsdom
import { act, createContext, createRoot, useEffect } from 'octane'
import { describe, expect, it } from 'vitest'

const Context = createContext('missing')
let mounts = 0
let unmounts = 0
let current: any = null

function Content() {
	useEffect(() => {
		mounts++
		return () => {
			unmounts++
		}
	}, [])

	return (
		<span
			ref={(view: any) => {
				current = view
			}}
		>
			Owned content
		</span>
	)
}

function ProviderCase(props: { open: boolean; undefinedChild?: boolean }) {
	return (
		<Context value="outside">
			<Context value="Avery">
				{props.open ? <Content /> : props.undefinedChild ? undefined : null}
			</Context>
		</Context>
	)
}

describe('provider child disposal', () => {
	it.each([false, true])(
		'disposes descendants when children become empty (undefined=%s)',
		(undefinedChild) => {
			mounts = unmounts = 0
			const host = document.createElement('div')
			document.body.append(host)
			const root = createRoot(host)
			try {
				act(() => root.render(ProviderCase, { open: true, undefinedChild }))
				expect(host.textContent).toBe('Owned content')
				expect(mounts).toBe(1)
				act(() => root.render(ProviderCase, { open: false, undefinedChild }))
				expect(host.textContent).toBe('')
				expect(current).toBeNull()
				expect(unmounts).toBe(1)
				act(() => root.render(ProviderCase, { open: true, undefinedChild }))
				expect(host.textContent).toBe('Owned content')
				expect(mounts).toBe(2)
			} finally {
				act(() => root.unmount())
				host.remove()
			}

			expect(unmounts).toBe(2)
		},
	)
})

/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it } from 'vitest'
import { useEffect, useState } from 'octane'
import { Text } from '@octane-xplat/ui'
import { mountXplat, viewText, waitUntil } from '@octane-xplat/platform/testing'

// Async state machine — loading first, then a settled value or an error.
// The `live` flag keeps a late timer from writing into an unmounted tree.
function FetchLabel(props: { fail?: boolean }) @{
	const [state, setState] = useState('loading')
	useEffect(() => {
		let live = true
		const timer = setTimeout(() => {
			if (live) setState(props.fail ? 'error' : 'ready')
		}, 30)

		return () => {
			live = false
			clearTimeout(timer)
		}
	}, [])

	<Text>{'fetch: ' + state}</Text>
}

describe('async loading and error states', () => {
	it('shows loading, then the settled value', async () => {
		const { view } = await mountXplat(FetchLabel)
		expect(viewText(view).includes('fetch: loading')).toBe(true)
		await waitUntil(() => viewText(view).includes('fetch: ready'), {
			message: 'loading state never settled to ready',
		})
	})

	it('shows loading, then the error state', async () => {
		const { view } = await mountXplat(FetchLabel, { fail: true })
		expect(viewText(view).includes('fetch: loading')).toBe(true)
		await waitUntil(() => viewText(view).includes('fetch: error'), {
			message: 'loading state never settled to error',
		})
	})
})

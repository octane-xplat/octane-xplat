/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { ChatLayoutProvider, useChatLayoutContext } from './chat-context'

function Reader(props: { seen: string[] }) @{
	const context = useChatLayoutContext()
	const value = (context?.scrollContainerRef.current as { id?: string } | null)?.id ?? 'missing'
	props.seen.push(value)

	<label text={value} />
}

function Provider(props: { value: any; seen: string[] }) @{
	<ChatLayoutProvider value={props.value}>
		<Reader seen={props.seen} />
	</ChatLayoutProvider>
}

it('compiled context readers update even when their own props retain identity', async () => {
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	const seen: string[] = []
	try {
		root.render(Provider as any, {
			value: { scrollContainerRef: { current: { id: 'first' } }, contentRef() {} },
			seen,
		})

		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(seen.at(-1)).toBe('first'))
		root.render(Provider as any, {
			value: { scrollContainerRef: { current: { id: 'replacement' } }, contentRef() {} },
			seen,
		})

		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(seen.at(-1)).toBe('replacement'))
	} finally {
		root.unmount()
		flushUniversalSync(() => {})
	}
})

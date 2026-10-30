/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
import { useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from 'octane'
import { createPortal } from 'octane'
import {
	createContentOwner,
	type ContentOwner,
	type ContentEntry,
	type OwnedContentResult,
} from './owned-content'

function OwnedEntry(props: { key?: number; entry: ContentEntry }) {
	const entry = props.entry
	const Component = entry.component
	useLayoutEffect(() => {
		entry.committed()
	}, [entry])

	return createPortal(<Component {...entry.props} />, entry.target as Element | DocumentFragment)
}

function ContentOutlet(props: { owner: ContentOwner }) {
	const entries = useSyncExternalStore(
		props.owner.entries.subscribe,
		props.owner.entries.getSnapshot,
		props.owner.entries.getSnapshot,
	)

	useEffect(() => () => props.owner.dispose(), [props.owner])
	return (
		<>
			<span
				ref={(view: any) => {
					props.owner.host = view
				}}
				style={{ display: 'none' }}
			/>
			@for (const entry of entries; key entry.id) {
				<OwnedEntry entry={entry} />
			}
		</>
	)
}

export function useOwnedContent(): OwnedContentResult {
	const owner = useMemo(() => createContentOwner(), [])
	useEffect(() => () => owner.dispose(), [owner])
	return { owner, element: <ContentOutlet owner={owner} /> }
}

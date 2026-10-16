/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from 'octane'
import { createPortal } from './native-portal'
import { createContentOwner, type ContentOwner, type ContentEntry } from './owned-content'

function OwnedEntry(props: { key?: number; entry: ContentEntry }) {
	const entry = props.entry
	const Component = entry.component
	useLayoutEffect(() => { entry.committed() }, [entry])
	return createPortal(<Component {...entry.props} />, entry.target as any)
}

function ContentOutlet(props: { owner: ContentOwner }) {
	const entries = useSyncExternalStore(props.owner.entries.subscribe, props.owner.entries.getSnapshot, props.owner.entries.getSnapshot)
	useEffect(() => () => props.owner.dispose(), [props.owner])
	return <>
		<flexboxlayout ref={(view: any) => { props.owner.host = view }} style={{ width: 0, height: 0 }} />
		{entries.map(entry => <OwnedEntry key={entry.id} entry={entry} />)}
	</>
}

export function useOwnedContent() {
	const owner = useMemo(() => createContentOwner(), [])
	useEffect(() => () => owner.dispose(), [owner])
	return { owner, element: <ContentOutlet owner={owner} /> }
}

// Port of upstream TreeList/TreeListMailboxTree.tsx (Astryx 0.6.4, MIT).
// Per-node endContent (Badge count) is a framework gap — the count is kept
// in the label text so the visible signal survives.
import { TreeList } from '@octane-xplat/ui'

export function TreeListMailboxTree() @{
	<TreeList
		defaultExpandedKeys={new Set(['inbox'])}
		nodes={[
			{
				key: 'inbox',
				label: 'Inbox (3)',
				children: [
					{ key: 'unread', label: 'Unread (3)' },
					{ key: 'starred', label: 'Starred' },
				],
			},
			{ key: 'sent', label: 'Sent' },
			{ key: 'drafts', label: 'Drafts (1)' },
		]}
		onAction={() => {}}
	/>
}

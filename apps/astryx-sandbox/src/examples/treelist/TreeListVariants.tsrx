// Port of upstream TreeList/TreeListVariants.tsx (Astryx 0.6.4, MIT).
// Per-node endContent is a framework gap — count kept in label text.
import { TreeList } from '@octane-xplat/ui'

export function TreeListVariants() @{
	<TreeList
		defaultExpandedKeys={new Set(['inbox'])}
		selectionMode="single"
		defaultSelectedKeys={new Set(['starred'])}
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
		]}
		onAction={() => {}}
	/>
}

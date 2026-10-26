// Port of upstream TreeList/TreeListInteractiveSettings.tsx (Astryx 0.6.4, MIT).
// Per-node icon/endContent slots: framework gap — see coverage.md.
import { TreeList } from '@octane-xplat/ui'

export function TreeListInteractiveSettings() @{
	<TreeList
		defaultExpandedKeys={new Set(['settings'])}
		nodes={[
			{
				key: 'settings',
				label: 'Settings',
				children: [
					{ key: 'general', label: 'General' },
					{ key: 'advanced', label: 'Advanced' },
				],
			},
			{ key: 'docs', label: 'Documentation', href: '#' },
		]}
		onAction={() => {}}
	/>
}

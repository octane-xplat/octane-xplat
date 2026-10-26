// Port of upstream TreeList/TreeListShowcase.tsx (Astryx 0.6.4, MIT).
import { TreeList } from '@octane-xplat/ui'

export function TreeListShowcase() @{
	<TreeList
		defaultExpandedKeys={new Set(['docs'])}
		nodes={[
			{
				key: 'docs',
				label: 'Documents',
				children: [
					{ key: 'notes', label: 'Notes' },
					{ key: 'projects', label: 'Projects' },
				],
			},
			{ key: 'shared', label: 'Shared with me' },
		]}
		onAction={() => {}}
	/>
}

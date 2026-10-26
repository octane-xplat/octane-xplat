// Port of upstream TreeList/TreeListFileTreeWithIcons.tsx (Astryx 0.6.4, MIT).
// GAP: upstream TreeListNode carries startContent/endContent per node; the
// public TreeListNode has key/label/children/disabled/href only — node icons
// are recorded as a finding rather than faked.
import { TreeList } from '@octane-xplat/ui'

export function TreeListFileTreeWithIcons() @{
	<TreeList
		defaultExpandedKeys={new Set(['src'])}
		nodes={[
			{
				key: 'src',
				label: 'src',
				children: [
					{ key: 'app', label: 'App.tsx' },
					{ key: 'index', label: 'index.tsx' },
				],
			},
			{ key: 'pkg', label: 'package.json' },
		]}
		onAction={() => {}}
	/>
}

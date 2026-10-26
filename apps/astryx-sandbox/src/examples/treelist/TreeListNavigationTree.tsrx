// Port of upstream TreeList/TreeListNavigationTree.tsx (Astryx 0.6.4, MIT).
import { TreeList } from '@octane-xplat/ui'

export function TreeListNavigationTree() @{
	<TreeList
		defaultExpandedKeys={new Set(['nav'])}
		selectionMode="single"
		defaultSelectedKeys={new Set(['about'])}
		nodes={[
			{
				key: 'nav',
				label: 'Navigation',
				children: [
					{ key: 'home', label: 'Home' },
					{ key: 'about', label: 'About' },
					{ key: 'contact', label: 'Contact' },
				],
			},
		]}
		onAction={() => {}}
	/>
}

// Measured parity fixtures — assertions live in TreeList.parity.check.ts.
import { TreeList } from '../../index.shared'
import type { ParityFixture } from '../../parity'

function TreeFixture() @{
	<TreeList
		className="parity-tree-root"
		style={{ width: 180, height: 96, backgroundColor: '#f5f5f5' }}
		nodes={[
			{
				key: 'root',
				label: 'Workspace',
				children: [{ key: 'leaf', label: 'Project', disabled: true }],
			},
		]}
		defaultExpandedKeys={['root']}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'tree-expanded', component: 'TreeList', renderer: TreeFixture, props: {}, height: 112 },
]

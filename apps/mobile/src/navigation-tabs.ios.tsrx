/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane'
import { UITabBar } from '@octane-xplat/ui/ios'
import { Text } from '@octane-xplat/ui'
import type { TabSpec } from '@octane-xplat/ui'

const first = () => <Text>ios first base</Text>
const second = () => <Text>ios second base</Text>
const tabs: TabSpec[] = [
	{ key: 'first', title: 'First', stack: 'ios-first', render: first },
	{ key: 'second', title: 'Second', stack: 'ios-second', render: second },
]

export function NavigationTabs() @{
	const [selected, setSelected] = useState('first')

	<UITabBar id="nav-ios-tabs" tabs={tabs} selectedKey={selected} onSelectionChange={setSelected} />
}

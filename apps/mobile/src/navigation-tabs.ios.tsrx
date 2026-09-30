/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import { UITabBar } from '@octane-xplat/ui/ios';
import { Text } from '@octane-xplat/ui';
import type { TabSpec } from '@octane-xplat/ui';

const first = () => <Text>ios first base</Text>;
const second = () => <Text>ios second base</Text>;
const tabs: TabSpec[] = [
	{ title: 'First', stack: 'ios-first', render: first },
	{ title: 'Second', stack: 'ios-second', render: second },
];

export function NavigationTabs() @{
	const [selected, setSelected] = useState(0);

	<UITabBar id="nav-ios-tabs" tabs={tabs} selectedIndex={selected} onSelectedIndexChanged={setSelected} />
}

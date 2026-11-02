import { NavLink, Tabs, Text, View } from '@octane-xplat/ui'
import type { TabSpec } from '@octane-xplat/ui'

function CatalogBase() {
	return <View>
		<Text>Choose an item</Text>
		<NavLink to="/items/:id" params={{ id: 'coat' }}>Open coat</NavLink>
	</View>
}
function AccountBase() {
	return <Text>Account settings</Text>
}
const tabs: readonly TabSpec[] = [
	{ key: 'catalog', title: 'Catalog', stack: 'catalog', render: CatalogBase },
	{ key: 'account', title: 'Account', stack: 'account', render: AccountBase },
]
export function Sections() {
	return <Tabs tabs={tabs} defaultSelectedKey="catalog" />
}

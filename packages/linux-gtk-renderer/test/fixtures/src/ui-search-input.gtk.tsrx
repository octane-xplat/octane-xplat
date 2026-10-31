/** @jsxImportSource @octane-xplat/jsx */
import { View, HStack, SearchInput } from '@octane-xplat/ui'
import { FormField } from '../../../../ui/src/components/forms/FormField'
import type { SearchInputProps, TextInputHandle } from '../../../../ui/src/props'
export const searchRef: { current: TextInputHandle | null } = { current: null }
export function SearchHarness(props: SearchInputProps) @{
	<View style={{ width: 320, height: 320 }}>
		<SearchInput {...props} id="search-control" testID="search-automation" ref={searchRef} />
	</View>
}
export function NestedSearch(props: { childLabel?: string }) @{
	<View style={{ width: 320, height: 320 }}>
		<FormField label="Parent query" inputID="search-control" width="80%" isReadOnly isRequired isLoading size="sm">
			<SearchInput id="search-control" testID="nested-search" ref={searchRef}
				defaultValue="Nested" label={props.childLabel} width="50%" />
		</FormField>
	</View>
}


export function GrowingSearchRow() @{
	<HStack style={{ width: 320, height: 80 }}>
		<FormField className="vx-power-search-input">
			<SearchInput id="search-control" defaultValue="Row" ref={searchRef} />
		</FormField>
		<View style={{ width: 40, height: 20 }} />
	</HStack>
}

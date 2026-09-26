import { useState } from 'octane';
import { Heading, SearchInput, Text, View } from '@octane-xplat/ui';

export function SearchDemo() @{
	const [query, setQuery] = useState('sunsets');
	const [submitted, setSubmitted] = useState('');

	<View className="pager-demo gap-4">
		<Heading>Search input</Heading>
		<SearchInput
			value={query}
			onChange={setQuery}
			onSubmit={() => setSubmitted(query)}
			onClear={() => {}}
			placeholder="Search photos"
			accessibilityLabel="Search photos"
		/>
		<Text className="text-sm text-muted">{'Query: ' + (query || '—')}</Text>
		{submitted !== '' ? <Text className="text-sm text-muted">{'Submitted: ' + submitted}</Text> : null}

		<SearchInput
			defaultValue="wildlife"
			icon={false}
			placeholder="Search without glyph"
			onChange={() => {}}
			onClear={() => {}}
		/>
		<Text className="text-sm text-muted">Uncontrolled — defaultValue, icon=false</Text>

		<SearchInput defaultValue="locked query" editable={false} onChange={() => {}} />
		<Text className="text-sm text-muted">editable=false</Text>
	</View>
}

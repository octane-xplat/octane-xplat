import { useState } from 'octane';
import { Heading, RichText, RichTextSpan, Text, View } from '@octane-xplat/ui';

/** Rich inline runs: the same nested composition drives DOM spans and native
 * FormattedString spans, including per-run tap callbacks. */
export function RichTextDemo() @{
	const [lastRun, setLastRun] = useState('Nothing tapped yet');

	<View className="rich-text-demo gap-4">
		<Heading level={2}>Rich text</Heading>
		<Text>Styled and tappable inline runs share one component tree.</Text>
		<RichText id="rich-text-sample" className="rich-text-sample">
			<RichTextSpan text="Read " />
			<RichTextSpan
				text="@octane"
				className="rich-text-link"
				style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
				onPress={() => setLastRun('@octane')}
			/>
			<RichTextSpan text=" updates, then tap " />
			<RichTextSpan
				text="the docs"
				className="rich-text-link"
				style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
				onPress={() => setLastRun('the docs')}
			/>
			<RichTextSpan text=" for more." />
		</RichText>
		<Text id="rich-text-status">{'Last tapped: ' + lastRun}</Text>
	</View>
}

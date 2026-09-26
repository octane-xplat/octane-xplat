import { useState } from 'octane';
import { Button, Heading, Pager, Pressable, Row, Text, View } from '@octane-xplat/ui';

const PAGES = [
	{
		title: 'Welcome',
		body: 'Swipe horizontally to move between pages. Each page is a full-size cell — onboarding flows and media galleries use the same contract.',
		tint: '#4f6ef7',
	},
	{
		title: 'Controlled',
		body: 'The page index is controlled: dots and buttons below write `page`, the settle event reports swipes through `onPageChange`.',
		tint: '#7b5bf5',
	},
	{
		title: 'No indicator',
		body: 'Pager ships no dots — the indicator below is composed from Row + Pressable, identical on every target.',
		tint: '#2f9e6e',
	},
	{
		title: 'Done',
		body: 'Same props, same pixels: scroll-snap on web, ViewPager2 / UICollectionView paging on native.',
		tint: '#d97706',
	},
];

const renderPage = (page: (typeof PAGES)[number]) => @{
	<View className="pager-page" style={{ backgroundColor: page.tint }}>
		<Text className="pager-page-title">{page.title}</Text>
		<Text className="pager-page-body">{page.body}</Text>
	</View>
};

/** Shared `Pager` demo — controlled page + a self-drawn dot indicator and
 *  prev/next buttons exercising the programmatic-write path. */
export function PagerDemo() @{
	const [page, setPage] = useState(0);

	<View className="pager-demo gap-4">
		<Heading level={2}>Pager</Heading>
		<Pager
			className="pager-demo-pager"
			items={PAGES}
			renderItem={renderPage}
			page={page}
			onPageChange={setPage}
		/>
		<Row className="pager-dots">
			@for (const _p of PAGES; index i; key i) {
				<Pressable
					id={'pager-dot-' + i}
					className={['pager-dot', i === page ? 'pager-dot-on' : '']}
					onPress={() => setPage(i)}
					accessibilityLabel={'Go to page ' + (i + 1)}
				/>
			}
		</Row>
		<Row className="pager-controls">
			<Button className="btn btn-secondary" onPress={() => setPage(Math.max(0, page - 1))}>
				<Text>Previous</Text>
			</Button>
			<Text className="pager-page-index">{'Page ' + (page + 1) + ' of ' + PAGES.length}</Text>
			<Button className="btn btn-secondary" onPress={() => setPage(Math.min(PAGES.length - 1, page + 1))}>
				<Text>Next</Text>
			</Button>
		</Row>
	</View>
}

/** @jsxImportSource @nativescript-community/octane */
import '@octane-xplat/ui/theme/tokens.css'
import { Grid, SafeArea, Screen, Text, VStack } from '@octane-xplat/ui'
import { prepareFullScreenPage } from '@octane-xplat/ui/nativescript'
import type { View } from '@nativescript/core'
import type { ProbeContext } from '../../scripts/probe/context'

// Run in a fresh process: #47 affected the session's first Screen. This also
// keeps a percentage-height app root, which exposed the Page measurement bug.
function Content(props: { safe?: boolean }) @{
	<rootlayout id="page-content" width="100%" height="100%">
		<Screen id="screen">
			<VStack id="stage" style={{ width: '100%', height: '100%' }}>
				@if (props.safe) {
					<SafeArea>
						<Text id="safe-child">Safe once</Text>
					</SafeArea>
				} @else {
					<Text>First Screen without reactive inset readers</Text>
				}
			</VStack>
		</Screen>
	</rootlayout>
}

function InsetContent() @{
	<Grid id="page-content" rows="*" columns="*" style={{ width: '100%', height: '100%' }}>
		<Screen id="screen">
			<VStack id="stage" style={{ width: '100%', height: '100%' }}>
				<Text>First Screen</Text>
			</VStack>
		</Screen>
	</Grid>
}

function bounds(view: View) {
	return { ...view.getLocationOnScreen(), ...view.getActualSize() }
}

export async function run(ctx: ProbeContext) {
	const { page } = ctx.host as { page: import('@nativescript/core').Page }
	page.iosIgnoreSafeArea = false
	ctx.mount(InsetContent)
	await ctx.waitFor(() => (ctx.find('stage') as View)?.getActualSize().height > 0)
	const inspect = () => {
		const stage = ctx.find('stage') as View
		return {
			page: bounds(page),
			app: bounds(ctx.find('page-content') as View),
			screen: bounds(ctx.find('screen') as View),
			content: bounds(stage.parent as View),
			stage: bounds(stage),
			safeChild: ctx.find('safe-child') ? bounds(ctx.find('safe-child') as View) : null,
		}
	}

	const first = inspect()
	ctx.record('first', first)
	const near = (name: string, actual: number, expected: number) =>
		ctx.assert(name, Math.abs(actual - expected) < 1, true)

	for (const key of ['screen', 'content', 'stage'] as const) {
		near(`${key} origin matches inset host`, first[key].y, first.app.y)
		near(`${key} height matches inset host`, first[key].height, first.app.height)
		near(`${key} width matches inset host`, first[key].width, first.app.width)
	}

	near(
		'inset host starts below status bar',
		first.app.y - first.page.y,
		page.nativeViewProtected.safeAreaInsets.top,
	)

	;(ctx.find('stage') as View).requestLayout()
	// Compare after a distinct layout pass, without using that pass to repair
	// the initial assertions above.
	await new Promise((resolve) => setTimeout(resolve, 100))
	const next = inspect()
	ctx.record('relayout', next)
	near('relayout preserves stage origin', next.stage.y, first.stage.y)
	near('relayout preserves stage height', next.stage.height, first.stage.height)
	prepareFullScreenPage(page)
	ctx.mount(Content, {})
	await ctx.waitFor(() => (ctx.find('stage') as View)?.getActualSize().height > 0)
	const prepared = inspect()
	ctx.record('preparedPage', prepared)
	for (const key of ['app', 'screen', 'content', 'stage'] as const) {
		near(`${key} origin matches prepared Page`, prepared[key].y, prepared.page.y)
		near(`${key} height matches prepared Page`, prepared[key].height, prepared.page.height)
		near(`${key} width matches prepared Page`, prepared[key].width, prepared.page.width)
	}

	ctx.mount(Content, { safe: true })
	await ctx.waitFor(() => (ctx.find('stage') as View)?.getActualSize().height > 0)
	const later = inspect()
	ctx.record('laterScreen', later)
	near(
		'SafeArea pads top once',
		later.safeChild!.y - later.stage.y,
		page.nativeViewProtected.safeAreaInsets.top,
	)

	near('later Screen has the same origin', later.stage.y, prepared.stage.y)
	near('later Screen has the same height', later.stage.height, prepared.stage.height)
}

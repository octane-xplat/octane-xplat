import { NavLink, Pressable, Row, Screen, Text, View } from '@octane-xplat/ui';
import { addRoutes, defineRoutes } from '@octane-xplat/ui';
import { goBack } from './platform/nav';

/** Programmatic-route probe — a manifest built from a data array at module
 *  scope, layered over the route-dir manifest via `addRoutes` (decision #66).
 *  This is the host-framework escape hatch: an app deriving routes from a
 *  content directory (Coreframe-style `readdirSync` + `route()` specs) emits
 *  this same shape. One `guides/:slug` route carries the doc key as a URL
 *  param — the universal compiler only lowers JSX in top-level component
 *  declarations, so a per-doc closure component can't express this. */

export interface GuideDoc {
	slug: string;
	title: string;
	body: string;
}

export const GUIDES: GuideDoc[] = [
	{ slug: 'install', title: 'Install', body: 'Scaffold with the create template, then run the dev server per target.' },
	{ slug: 'routes', title: 'Routes from data', body: 'defineRoutes turns specs into a manifest; addRoutes layers it over the file routes.' },
	{ slug: 'deploy', title: 'Deploy', body: 'xplat build emits the web bundle and the native app package.' },
];

const GUIDE_BY_SLUG: Record<string, GuideDoc> = Object.fromEntries(GUIDES.map((doc) => [doc.slug, doc]));

/** Programmatic layout — the `layouts` map plays the _layout.tsrx role:
 *  wraps every guides/* screen (RouteHost on native, outlet wrap on web).
 *  The banner proves the wrap. */
export function GuideShell(props: { children?: any }) @{
	<View className="guide-layout flex-1 min-h-0">
		<Text className="guide-layout-banner">guides layout</Text>
		{props.children}
	</View>
}

export function GuideIndex(props: { _stack?: string }) @{
	const stack = props._stack ?? 'test';

	<Screen className="vx-app flex-1 gap-6">
		<Row className="gap-4 items-center">
			<Pressable id="guides-back" onPress={() => goBack({ into: props._stack })} className="btn btn-secondary">
				<Text>← Back</Text>
			</Pressable>
			<Text className="text-xl font-semibold flex-1">Guides</Text>
		</Row>
		<Text className="text-sm text-muted">{'Registered from a ' + GUIDES.length + '-record data array.'}</Text>
		<View className="gap-2">
			@for (const doc of GUIDES; key doc.slug) {
				<NavLink route={{ stack, name: 'guides/' + doc.slug, params: {} }} className="chip">
					<Text>{doc.title} →</Text>
				</NavLink>
			}
		</View>
	</Screen>
}

/** Doc screen — `slug` arrives as a route param (URL-scalar); the doc is
 *  looked up rather than closed over. Unknown slugs render a not-found
 *  note rather than throwing. */
export function GuideScreen(props: { slug?: string; _stack?: string }) @{
	const doc = props.slug ? GUIDE_BY_SLUG[props.slug] : undefined;

	<Screen className="vx-app flex-1 gap-6">
		<Row className="gap-4 items-center">
			<Pressable id={'guide-back-' + (props.slug ?? 'missing')} onPress={() => goBack({ into: props._stack })} className="btn btn-secondary">
				<Text>← Back</Text>
			</Pressable>
			<Text className="text-xl font-semibold flex-1">{doc?.title ?? 'Unknown guide'}</Text>
		</Row>
		<Text className="guide-slug text-sm text-muted">{'guides/' + (props.slug ?? '?')}</Text>
		<Text>{doc?.body ?? 'No guide is registered at this path.'}</Text>
	</Screen>
}

/** Exported so `routes.ts` can merge the spec-derived route types into the
 *  app's typed navigation surface (ManifestRouteParams et al.). */
export const guideRoutes = defineRoutes({
	routes: [
		{ path: 'guides', screen: GuideIndex, head: { title: 'Guides' } },
		{
			path: 'guides/:slug',
			screen: GuideScreen,
			head: (params: Record<string, unknown>) => ({ title: GUIDE_BY_SLUG[params.slug as string]?.title ?? 'Guide' }),
		},
	],
	layouts: { guides: GuideShell },
});

addRoutes(guideRoutes);

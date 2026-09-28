import { NavLink, Pressable, Row, Screen, Text, View } from '@octane-xplat/ui';
import { addRoutes, defineRoutes } from '@octane-xplat/ui';
import { goBack } from './platform/nav';

/** Programmatic-route probe — a manifest built from a data array at module
 *  scope, layered over the route-dir manifest via `addRoutes` (decision #66).
 *  This is the host-framework escape hatch: an app deriving routes from a
 *  content directory (Coreframe-style `readdirSync` + `route()` specs) emits
 *  this same shape. The screens get `doc` by closure, not params — the route
 *  table stays URL-scalar. */

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

export function GuideScreen(props: { doc: GuideDoc; _stack?: string }) @{
	<Screen className="vx-app flex-1 gap-6">
		<Row className="gap-4 items-center">
			<Pressable id={'guide-back-' + props.doc.slug} onPress={() => goBack({ into: props._stack })} className="btn btn-secondary">
				<Text>← Back</Text>
			</Pressable>
			<Text className="text-xl font-semibold flex-1">{props.doc.title}</Text>
		</Row>
		<Text className="guide-slug text-sm text-muted">{'guides/' + props.doc.slug}</Text>
		<Text>{props.doc.body}</Text>
	</Screen>
}

// One screen per content record — the doc closes over the component instead
// of traveling as a param.
function guideScreen(doc: GuideDoc) {
	return function GuideDocScreen(props: { _stack?: string }) @{
		<GuideScreen {...props} doc={doc} />
	}
}

addRoutes(
	defineRoutes({
		routes: [
			{ path: 'guides', screen: GuideIndex, head: { title: 'Guides' } },
			...GUIDES.map((doc) => ({
				path: `guides/${doc.slug}`,
				screen: guideScreen(doc),
				head: { title: doc.title },
			})),
		],
		layouts: { guides: GuideShell },
	}),
);

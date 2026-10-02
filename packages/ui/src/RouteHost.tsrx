/** @jsxImportSource @nativescript-community/octane */

import type { Route } from './props';

type RouteHostProps = {
	screen: any;
	layouts: any[];
	params: Record<string, unknown>;
};

/** Props a pushed screen receives inside a swap-pane host — the same shape
 *  commitRoute stamps on a native frame.navigate (params + context + _stack
 *  for self-pops + _pushed + loader results). Shared by the self-drawn Tabs
 *  pane and the platform tab bars' pane roots. */
export function screenParamsFor(route: Route): Record<string, unknown> {
	const params: Record<string, unknown> = {
		...route.params,
		...route.context,
		_stack: route.stack,
		_pushed: true,
	};

	if (Object.prototype.hasOwnProperty.call(route, 'loaderData')) {
		params.data = route.loaderData;
	}

	if (Object.prototype.hasOwnProperty.call(route, 'loaderError')) {
		params.error = route.loaderError;
	}

	return params;
}

export function RouteHost(props: RouteHostProps) @{
	const Screen = props.screen;
	let child = <Screen {...props.params} />;
	for (let i = props.layouts.length - 1; i >= 0; i--) {
		const Layout = props.layouts[i];
		const nested = child;
		child = <Layout>{nested}</Layout>;
	}

	<>{child}</>
}

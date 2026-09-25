/** @jsxImportSource @nativescript-community/octane */

type RouteHostProps = {
	screen: any;
	layouts: any[];
	params: Record<string, unknown>;
};

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

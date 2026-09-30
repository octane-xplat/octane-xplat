/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import { Pressable, Screen, Tabs, Text, View, defineRoutes, registerRoutes } from '@octane-xplat/ui';
import type { TabSpec } from '@octane-xplat/ui';

export function NavigationScreen(props: { id?: string; data?: any; error?: any; guarded?: boolean; close?: () => void }) @{
	<View id="nav-screen">
		<Text>{'route:' + (props.id ?? 'base')}</Text>
		<Text>{'data:' + String(props.data ?? '')}</Text>
		<Text>{'error:' + String(props.error?.message ?? '')}</Text>
		<Text>{'guard:' + String(props.guarded === true)}</Text>
		@if (props.close) {
			<Pressable id="nav-modal-close" onPress={() => props.close?.()}><Text>Close</Text></Pressable>
		}
	</View>
}

export function NavigationLayout(props: { children?: any }) @{
	<View><Text>navigation layout</Text>{props.children}</View>
}

const first = () => <Text>first base</Text>;
const second = () => <Text>second base</Text>;
const tabs: TabSpec[] = [
	{ title: 'First', stack: 'first', render: first },
	{ title: 'Second', stack: 'second', render: second },
];

export function NavigationShell() @{
	const [selected, setSelected] = useState(0);

	<Screen><Tabs id="nav-tabs" tabs={tabs} selectedIndex={selected} onSelectedIndexChanged={setSelected} /></Screen>
}

export const navigationRoutes = defineRoutes({
	routes: [
		{ path: 'nav/:id', screen: NavigationScreen },
		{ path: 'loaded/:id', screen: NavigationScreen, beforeLoad: () => ({ guarded: true }), loader: (params: Record<string, unknown>) => 'loaded-' + params.id },
		{ path: 'broken/:id', screen: NavigationScreen, loader: () => { throw new Error('expected loader failure'); } },
		{ path: 'blocked', screen: NavigationScreen, beforeLoad: () => { throw new Error('expected guard rejection'); } },
		{ path: 'modal/:id', screen: NavigationScreen, presentation: 'modal' },
	],
	layouts: { nav: NavigationLayout },
});

registerRoutes(navigationRoutes);

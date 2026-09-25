/** @jsxImportSource @nativescript-community/octane */
import { Application } from '@nativescript/core';
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import { Drawer as NSDrawer, install } from '@nativescript-community/ui-drawer';
import { useEffect, useRef } from 'octane';
import type { DrawerProps } from './props';
import { cx } from './cx';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		drawer: Attributes<typeof NSDrawer>;
	}
}

// Optional peer: this leaf resolves only when the app ships the plugin
// (isolated linker resolves it under the app root). install() registers the
// plugin's gesture handler once at module load.
install();
registerElement('drawer', NSDrawer);

/** Drawer — ui-drawer host. `main`/`drawer` are slot props wired via the
 *  driver's hostSlot mechanism (parentView[slot] = view → mainContent /
 *  leftDrawer); `open` drives the imperative open()/close(). Slot hosts are
 *  gridlayout so each side stays multi-child. */
export function Drawer(props: DrawerProps) @{
	const host = useRef<NSDrawer | null>(null);
	const platformProps = Application.ios != null ? props.ios : props.android;

	useEffect(() => {
		const d = host.current;
		if (!d) return;
		if (props.open && !d.isOpened('left')) d.open('left').catch(() => {});
		else if (!props.open && d.isOpened('left')) d.close('left').catch(() => {});
	}, [props.open]);

	// `main`/`drawer` are component props: JSX element props don't lower on
	// the universal runtime (materializeValue rejects element descriptors),
	// but component references lower through universalComponent — the same
	// mechanism as Modal's `component` prop.
	const Main = props.main;
	const Panel = props.drawer;

	<drawer
		id={props.id}
		ref={(d: any) => { host.current = d; if (d && platformProps) Object.assign(d, platformProps); }}
		className={cx('vx-drawer', props.className)}
		style={props.style}
	>
		@if (Main != null) {
			<gridlayout hostSlot="mainContent"><Main /></gridlayout>
		}
		@if (Panel != null) {
			<gridlayout hostSlot="leftDrawer"><Panel /></gridlayout>
		}
	</drawer>
}

/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import { Drawer as NSDrawer, install } from '@nativescript-community/ui-drawer';
import { useEffect, useRef } from 'octane';
import type { DrawerProps } from '../props';
import { cx } from '../cx';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		drawer: Attributes<typeof NSDrawer>;
	}
}

// Optional peer: this leaf resolves only when the app ships the plugin
// (isolated linker resolves it under the app root). install() registers the
// plugin's gesture handler once at module load. The self-drawn shared
// `Drawer` lives in the root export.
install();
registerElement('drawer', NSDrawer);

/** DrawerLayout — ui-drawer host (AndroidX DrawerLayout behavior via the
 *  plugin). `main`/`drawer` are slot props wired via the driver's hostSlot
 *  mechanism; `open` drives the imperative open()/close(). Slot hosts are
 *  gridlayout so each side stays multi-child. */
export function DrawerLayout(props: DrawerProps) @{
	const host = useRef<NSDrawer | null>(null);

	useEffect(() => {
		const d = host.current;
		if (!d) return;
		if (props.open && !d.isOpened('left')) d.open('left').catch(() => {});
		else if (!props.open && d.isOpened('left')) d.close('left').catch(() => {});
	}, [props.open]);

	<drawer
		id={props.id}
		ref={(d: any) => { host.current = d; if (d && props.android) Object.assign(d, props.android); }}
		className={cx('vx-drawer', props.className)}
		style={props.style}
	>
		<gridlayout hostSlot="mainContent">{props.main}</gridlayout>
		@if (props.drawer != null) {
			<gridlayout hostSlot="leftDrawer">{props.drawer}</gridlayout>
		}
	</drawer>
}

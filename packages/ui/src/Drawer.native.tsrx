/** @jsxImportSource @nativescript-community/octane */
import { Application } from '@nativescript/core';
import type { DrawerProps } from './props';
import { cx } from './cx';

/** Native drawer support requires a registered drawer host/plugin.
 *  Until then this leaf deliberately renders the main slot only. */
export function Drawer(props: DrawerProps) @{
	const platformProps = Application.ios != null ? props.ios : props.android;
	<flexboxlayout
		ref={(host: any) => { if (host && platformProps) Object.assign(host, platformProps); }}
		className={cx('vx-drawer', props.className)}
		style={props.style}
	>
		{props.main}
	</flexboxlayout>
}

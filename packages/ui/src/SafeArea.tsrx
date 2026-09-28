/** @jsxImportSource @nativescript-community/octane */
import { Application } from '@nativescript/core';
import type { SafeAreaProps } from './props';
import { cx } from './cx';
import { useSafeAreaInsets } from './safeAreaInsets.tsrx';

export function SafeArea(props: SafeAreaProps) @{
	const measuredInsets = useSafeAreaInsets();
	const insets = props.ignoreSafeArea ? { top: 0, right: 0, bottom: 0, left: 0 } : measuredInsets;
	const platformProps = Application.ios != null ? props.ios : props.android;

	<flexboxlayout
		id={props.id}
		ref={(host: any) => { if (host && platformProps) Object.assign(host, platformProps); }}
		className={cx('vx-safe-area', props.className)}
		style={{ ...props.style, paddingTop: insets.top, paddingRight: insets.right, paddingBottom: insets.bottom, paddingLeft: insets.left }}
	>
		{props.children}
	</flexboxlayout>
}

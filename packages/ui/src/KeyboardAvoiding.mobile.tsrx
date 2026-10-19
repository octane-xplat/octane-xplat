/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useKeyboardInset } from './use-keyboard-inset.tsrx';
import { useConsumedInsets } from './inset-consumption';
import { Application } from '@nativescript/core';
import type { KeyboardAvoidingProps } from './props';
import { cx } from '@octane-xplat/lib';

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	const enabled = props.enabled ?? true;
	const keyboardInset = useKeyboardInset({ enabled });
	const consumed = useConsumedInsets();
	const platformProps = Application.ios != null ? props.ios : props.android;
	const offset = props.keyboardVerticalOffset ?? 0;

	// iOS pads inside the scroll view — subtract the bottom inset an
	// enclosing SafeArea already consumed so the two never double-count.
	// Android avoidance is the subscription's adjustResize lease; only the
	// caller's offset lands as extra padding. No padding while closed.
	const paddingBottom =
		keyboardInset > 0
			? Math.max(0, (Application.ios ? keyboardInset - consumed.bottom : 0) + offset)
			: 0;

	<scrollview
		id={props.id}
		className={cx('vx-keyboard-avoiding', props.className)}
		style={props.style as any}
		ref={(host: any) => { if (host && platformProps) Object.assign(host, platformProps); }}
	>
		<masonview style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, paddingBottom ? { paddingBottom } : undefined))}>
			{props.children}
		</masonview>
	</scrollview>
}

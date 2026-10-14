/** @jsxImportSource @nativescript-community/octane */
import { useKeyboardInset } from './use-keyboard-inset.tsrx';
import { Application } from '@nativescript/core';
import type { KeyboardAvoidingProps } from './props';
import { cx } from '@octane-xplat/lib';

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	const keyboardInset = useKeyboardInset();
	const platformProps = Application.ios != null ? props.ios : props.android;

	<scrollview
		id={props.id}
		className={cx('vx-keyboard-avoiding', props.className)}
		style={props.style as any}
		ref={(host: any) => { if (host && platformProps) Object.assign(host, platformProps); }}
	>
		<flexboxlayout
			flexDirection="column"
			style={Application.ios && keyboardInset ? { paddingBottom: keyboardInset } : undefined}
		>
			{props.children}
		</flexboxlayout>
	</scrollview>
}

/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useState } from 'octane';
import { Application } from '@nativescript/core';
import type { KeyboardAvoidingProps } from './props';
import { cx } from './cx';

function useKeyboardInset() {
	const [inset, setInset] = useState(0);
	useEffect(() => {
		if (!Application.ios) return;
		const center = NSNotificationCenter.defaultCenter;
		const token = center.addObserverForNameObjectQueueUsingBlock(
			UIKeyboardWillChangeFrameNotification,
			null,
			NSOperationQueue.mainQueue,
			(note: any) => {
				const frame = note.userInfo.objectForKey(UIKeyboardFrameEndUserInfoKey);
				const screenHeight = UIScreen.mainScreen.bounds.size.height;
				setInset(Math.max(0, screenHeight - frame.origin.y));
			},
		);
		return () => center.removeObserver(token);
	}, []);
	return inset;
}

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	const keyboardInset = useKeyboardInset();
	const platformProps = Application.ios != null ? props.ios : props.android;
	<scrollview
		className={cx('vx-keyboard-avoiding', props.className)}
		style={props.style}
		ref={(host: any) => { if (host && platformProps) Object.assign(host, platformProps); }}
	>
		<flexboxlayout
			flexDirection="column"
			style={keyboardInset ? { paddingBottom: keyboardInset } : undefined}
		>
			{props.children}
		</flexboxlayout>
	</scrollview>
}

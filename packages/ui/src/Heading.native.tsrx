/** @jsxImportSource @nativescript-community/octane */
import { AccessibilityRole } from '@nativescript/core';
import type { HeadingProps } from './props';
import { cx } from './cx';
import { applyNativeProps } from './platformProps.native';

export function Heading(props: HeadingProps) @{
	const level = props.level ?? 2;

	<label
		id={props.id}
		className={cx(`vx-h${level}`, props.className)}
		style={props.style}
		accessibilityRole={AccessibilityRole.Header}
		ref={(el: any) => applyNativeProps(el, props)}
	>{props.children}</label>
}

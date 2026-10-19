/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle, styleRecord } from './style-merge'
import type { SkeletonProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";

/** Skeleton — placeholder block while content loads. Sizing via
 *  `width`/`height` or the app's `vx-skeleton` styling. */
export function Skeleton(props: SkeletonProps) @{
	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-skeleton', props.className)} style={mergeStyle({display: "flex"}, { ...styleRecord(props.style), width: props.width, height: props.height })}/>
}

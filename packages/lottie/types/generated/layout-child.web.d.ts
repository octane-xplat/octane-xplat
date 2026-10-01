import type { LayoutChildProps, FlexContainerProps } from './props.js';
/** The shared contract is "numbers are dips" (RN semantics), but octane's DOM
 *  renderer keeps React's unitless list — lineHeight is unitless there, so
 *  `style={{lineHeight: 40}}` would render a 40× multiplier instead of 40px.
 *  lineHeight is the one unitless-in-React prop that is a length in the
 *  shared vocabulary; force the px suffix. */
export declare function normStyle(style: any): any;
/** Convert parent-layout metadata to CSS on the web leaf. Native's `dock`
 *  attribute has no CSS equivalent and is ignored on web. Grid indices are
 *  zero-based in the shared API, matching NativeScript. */
export declare function layoutChildProps(props: LayoutChildProps & Partial<FlexContainerProps> & {
    style?: any;
}, baseStyle?: any): {
    style: any;
};

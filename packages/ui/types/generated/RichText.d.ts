import type { RichTextProps, RichTextSpanProps } from './props.js';
/**  Native rich text is a Label hosting one FormattedString. The driver knows
 * how to parent FormattedString → Span, while each run writes its text
 * directly because Span is not a TextBase host for #text children. */
export declare function RichText(props: RichTextProps): unknown;
/**  A FormattedString run. `onLinkTap` is NativeScript's per-span tap event. */
export declare function RichTextSpan(props: RichTextSpanProps): unknown;

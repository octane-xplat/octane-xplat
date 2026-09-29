import type { TextAreaProps } from "./props.js";
/**  Multiline input — <textview>. TextView measures to content natively, so
 *  `autoGrow` is its default; `rows`/`maxRows` have no NS equivalent, so the
 *  leaf converts them to min/maxHeight in dips using the widget's own line
 *  height (iOS `font.lineHeight`, Android `getLineHeight()` px→dip — measured
 *  on `loaded`, re-fit every commit for prop/style changes). The driver's
 *  text→textChange echo suppression applies here unchanged. */
export declare function TextArea(props: TextAreaProps): unknown;

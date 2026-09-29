import type { TextAreaProps } from "./props.js";
/**  Multiline input — <textarea>. `autoGrow` re-fits height to content after
 *  every commit via scrollHeight, capped by `maxRows` translated to a real
 *  max-height from the element's computed line-height; past the cap the
 *  field scrolls. `useLayoutEffect` so the measure lands pre-paint in the
 *  commit that wrote `value`. Deps are explicit — tsrx infers them from the
 *  closure's reads otherwise, and `props.value` (the thing that changes the
 *  height) isn't read inside. */
export declare function TextArea(props: TextAreaProps): import("octane/jsx-runtime").JSX.Element;

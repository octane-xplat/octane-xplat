import type { SearchInputProps } from './props.js';
/**  Chrome-reset search field — a styled TextField (not UISearchBar) with a
 *  leading glyph and a self-drawn clear button, matching the web leaf.
 *  Controlled `value` writes go through `writeText` so Android keeps its
 *  selection (same path as TextInput); `defaultValue` seeds uncontrolled
 *  use. `returnKeyType` is fixed 'search' — the normalized chrome. */
export declare function SearchInput(props: SearchInputProps): unknown;

import type { TabsProps } from './props.js';
export type { TabSpec } from './props.js';
/**  Platform tab shell — web version: a button row + the active pane. The
 *  pane also acts as the route outlet for its `stack`; a route on the
 *  'root' stack covers the whole shell (native: root push covers tabs). */
export declare function Tabs(props: TabsProps): import("octane/jsx-runtime").JSX.Element;

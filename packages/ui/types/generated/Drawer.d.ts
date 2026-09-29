/**  @jsxImportSource @nativescript-community/octane */
import type { DrawerProps } from './props.js';
/**  Self-drawn drawer — grid host: `main` fills the cell, backdrop + left
 *  panel overlay it while `open`. Identical pixels/behavior across targets
 *  (backdrop tap fires `onDismiss` on both). The edge-gesture plugin widget
 *  lives in `ui/android` (DrawerLayout) and `ui/ios` (SideDrawer). */
export declare function Drawer(props: DrawerProps): unknown;

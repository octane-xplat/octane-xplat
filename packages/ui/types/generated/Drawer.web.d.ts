/** @jsxImportSource octane */
import type { DrawerProps } from './props.js';
/**  Self-drawn drawer — `main` fills the host, backdrop + left panel overlay
 *  it while `open`. Identical pixels/behavior across targets (backdrop
 *  click fires `onDismiss` on both). The edge-gesture plugin widget lives
 *  in `ui/android` (DrawerLayout) and `ui/ios` (SideDrawer). */
export declare function Drawer(props: DrawerProps): import("octane/jsx-runtime").JSX.Element;

import { Drawer as NSDrawer } from '@nativescript-community/ui-drawer';
import type { DrawerProps, PlatformWidgetProps } from '../props.js';
declare module '@nativescript-community/octane/intrinsics' {
    interface NativeScriptElements {
        drawer: Attributes<typeof NSDrawer>;
    }
}
/**  SideDrawer — ui-drawer host. `main`/`drawer` are slot props wired via the
 *  driver's hostSlot mechanism (parentView[slot] = view → mainContent /
 *  leftDrawer); `open` drives the imperative open()/close(). Slot hosts are
 *  gridlayout so each side stays multi-child. */
export declare function SideDrawer(props: PlatformWidgetProps<DrawerProps>): unknown;

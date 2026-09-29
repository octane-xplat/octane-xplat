import { Drawer as NSDrawer } from '@nativescript-community/ui-drawer';
import type { DrawerProps, PlatformWidgetProps } from '../props.js';
declare module '@nativescript-community/octane/intrinsics' {
    interface NativeScriptElements {
        drawer: Attributes<typeof NSDrawer>;
    }
}
/**  DrawerLayout — ui-drawer host (AndroidX DrawerLayout behavior via the
 *  plugin). `main`/`drawer` are slot props wired via the driver's hostSlot
 *  mechanism; `open` drives the imperative open()/close(). Slot hosts are
 *  gridlayout so each side stays multi-child. */
export declare function DrawerLayout(props: PlatformWidgetProps<DrawerProps>): unknown;

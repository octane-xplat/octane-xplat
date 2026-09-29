import { RootLayout } from '@nativescript/core';
/** Called by the Screen leaf's <rootlayout> onLoaded/onUnloaded. */
export declare function registerRootLayout(rl: RootLayout | undefined | null): void;
export declare function unregisterRootLayout(rl: RootLayout | undefined | null): void;
/** The most recently mounted rootlayout — the top of the push stack. For
 *  imperative services (toast, sheet) there is no invoking component to
 *  walk from; last-mounted is the pushed page when one exists. Caveat: tabs
 *  keep visited panes mounted — last is the newest, not the visible tab. */
export declare function topRootLayout(): RootLayout | undefined;
/** Resolve the RootLayout enclosing `view` by walking the native parent
 *  chain — the screen shell is a RootLayout (Screen), so the first
 *  RootLayout ancestor IS the current page's overlay host. Falls back to
 *  the top registry entry when the component renders outside any Screen. */
export declare function rootLayoutFor(view: any): RootLayout | undefined;
/** Search every registered rootlayout for a view by id — overlays/sheets/
 *  toasts land on different rootlayouts depending on which screen's shell
 *  mounted last. Unloaded subtrees are skipped: a covered page unloads its
 *  views (NativeScript detaches their native recognizers while the JS views
 *  stay parented), so an unloaded match is a dead twin that can swallow
 *  interaction probes — the live view either doesn't exist here yet or sits
 *  under a loaded branch. */
export declare function findInRootLayouts(id: string): any;

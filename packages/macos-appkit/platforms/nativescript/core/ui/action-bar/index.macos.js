// Placeholder — ui/action-bar ships .ios/.android only upstream.
// ActionBarBase/ActionItemBase get the provider's view machinery so
// imports and page.actionBarHidden evaluate; no native bar exists.
export * from '@nativescript/core/ui/action-bar/action-bar-common';
import { ActionBarBase, ActionItemBase } from '@nativescript/core/ui/action-bar/action-bar-common';
export class ActionBar extends ActionBarBase {
}
export class ActionItem extends ActionItemBase {
}
export class NavigationButton extends ActionItemBase {
}

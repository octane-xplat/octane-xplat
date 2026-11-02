/** Candidate-app stub for `@nativescript/core` — web builds of shared UI
 *  import these names along the Markdown chain but never call native paths
 *  on web. Values mirror the real package where observable (role strings);
 *  platform flags are falsy on web by contract. */

export const AccessibilityRole = {
	None: 'none',
	Button: 'button',
	Link: 'link',
	Search: 'search',
	Image: 'image',
	ImageButton: 'imagebutton',
	KeyboardKey: 'keyboardkey',
	Text: 'text',
	Adjustable: 'adjustable',
	Header: 'header',
	Summary: 'summary',
	Alert: 'alert',
	Checkbox: 'checkbox',
	ComboBox: 'combobox',
	Menu: 'menu',
	MenuBar: 'menubar',
	MenuItem: 'menuitem',
	ProgressBar: 'progressbar',
	Radio: 'radio',
	RadioGroup: 'radiogroup',
	ScrollBar: 'scrollbar',
	SpinButton: 'spinbutton',
	Switch: 'switch',
	TabBar: 'tabbar',
	TabList: 'tablist',
	Tab: 'tab',
	TextBox: 'textbox',
	Timer: 'timer',
	ToolBar: 'toolbar',
	Expandable: 'expandable',
} as const

export const Application = {
	ios: undefined as unknown,
	android: undefined as unknown,
	on() {},
	off() {},
	run() {},
} as const

export const Utils = {
	openUrl(_url: string) {
		return false
	},
} as const

export const Screen = {
	mainScreen: { widthDIPs: 0, heightDIPs: 0, scale: 1 },
} as const

export class View {}
export class ViewBase {}
export type PercentLengthType = string | number

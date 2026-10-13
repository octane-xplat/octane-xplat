// The flat `index.d.ts` TabViewItem omits `iconFontFamily` (the platform
// `index.ios.d.ts`/`index.android.d.ts` variants inherit it from
// TabViewItemBase). Combined programs resolve the unsuffixed index first, so
// this augmentation restores the member. Must live in a module — a `declare
// module` in a script file shadows the real package.
declare module '@nativescript/core' {
	interface TabViewItem {
		iconFontFamily: string
	}
}

export {}

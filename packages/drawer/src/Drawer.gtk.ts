import type { DrawerProps } from './props'

/** GTK4/GJS drawers have not been implemented. Importing the package is safe;
 * rendering fails explicitly rather than loading the NativeScript plugin. */
export function Drawer(_props: DrawerProps): never {
	throw new Error('@octane-xplat/drawer: Drawer is not available on GTK4/GJS')
}

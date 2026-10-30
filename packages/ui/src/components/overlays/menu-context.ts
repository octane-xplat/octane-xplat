import { createContext, useContext, type Context } from 'octane'
import type { MenuContextValue, MenuRadioGroupProps } from '../../props'

/**
 * Context the menu surface provides its rows — `closeMenu` and inherited size.
 */
export const DropdownMenuContext: Context<MenuContextValue | null> =
	createContext<MenuContextValue | null>(null)

export const MenuProvider: any = DropdownMenuContext
/**
 * Read the enclosing menu's context inside a menu row.
 *
 * @see MenuContextValue.
 */
export function useDropdownMenuContext(): MenuContextValue | null {
	return useContext(DropdownMenuContext)
}

export const MenuRadioContext: Context<MenuRadioGroupProps | null> =
	createContext<MenuRadioGroupProps | null>(null)

export const MenuRadioProvider: any = MenuRadioContext

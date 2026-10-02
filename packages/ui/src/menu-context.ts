import { createContext, useContext } from 'octane'
import type { MenuContextValue, MenuRadioGroupProps } from './props'

export const DropdownMenuContext = createContext<MenuContextValue | null>(null)
export const MenuProvider: any = DropdownMenuContext
export function useDropdownMenuContext(): MenuContextValue | null {
	return useContext(DropdownMenuContext)
}

export const MenuRadioContext = createContext<MenuRadioGroupProps | null>(null)
export const MenuRadioProvider: any = MenuRadioContext

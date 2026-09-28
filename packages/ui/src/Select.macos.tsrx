/** @jsxImportSource @xplat/macos/renderer */
import type { SelectProps } from './props'

export function Select(_props: SelectProps) @{
	<label className="vx-unsupported">Select menus are unsupported by the AppKit host</label>
}

export const SelectMenu = Select
export const Combobox = Select
export const InputMenu = Select

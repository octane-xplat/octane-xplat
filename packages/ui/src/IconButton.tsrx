/** @jsxImportSource @nativescript-community/octane */
import type { IconButtonProps } from './props'
import { Button } from './Button.tsrx'

/**
 * Square icon-only button — `label` is the accessible name (and pointer-platform tooltip); `icon` is required. Import from `@octane-xplat/ui`.
 *
 * @see IconButtonProps, ButtonProps.
 */
export function IconButton(props: IconButtonProps) @{
	<Button {...props} isIconOnly={true} />
}

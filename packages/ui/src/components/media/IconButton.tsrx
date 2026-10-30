/** @jsxImportSource @octane-xplat/jsx */
import type { IconButtonProps } from '../../props'
import { Button } from '../actions/Button.tsrx'

/**
 * Square icon-only button — `label` is the accessible name (and pointer-platform tooltip); `icon` is required. Import from `@octane-xplat/ui`.
 *
 * @see IconButtonProps, ButtonProps.
 */
export function IconButton(props: IconButtonProps): unknown @{
	<Button {...props} isIconOnly={true} />
}

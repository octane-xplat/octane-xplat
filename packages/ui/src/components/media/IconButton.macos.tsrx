/** @jsxImportSource @octane-xplat/jsx */
import type { IconButtonProps } from '../../props'
import { Button } from '../actions/Button.macos.tsrx'

export function IconButton(props: IconButtonProps): unknown @{
	<Button {...props} isIconOnly={true} />
}

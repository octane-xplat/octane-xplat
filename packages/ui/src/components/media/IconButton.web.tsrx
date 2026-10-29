/** @jsxImportSource @octane-xplat/jsx/dom */
import type { IconButtonProps } from '../../props'
import { Button } from '../actions/Button.web.tsrx'
export function IconButton(props: IconButtonProps) @{
	<Button {...props} isIconOnly={true} />
}

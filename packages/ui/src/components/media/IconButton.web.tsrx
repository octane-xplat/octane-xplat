/** @jsxImportSource @octane-xplat/jsx/dom */
import type { IconButtonProps } from '../../props'
import { Button } from '../actions/Button.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'
export function IconButton(props: IconButtonProps): JSX.Element @{
	<Button {...props} isIconOnly={true} />
}

/** @jsxImportSource @nativescript-community/octane */
import type { IconButtonProps } from './props'
import { Button } from './Button.tsrx'

export function IconButton(props: IconButtonProps) @{
	<Button {...props} isIconOnly={true} />
}

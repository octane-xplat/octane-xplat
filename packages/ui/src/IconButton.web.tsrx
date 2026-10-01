import type { IconButtonProps } from './props'
import { Button } from './Button.web.tsrx'
export function IconButton(props: IconButtonProps) @{
	<Button {...props} isIconOnly={true} />
}

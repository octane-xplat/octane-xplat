/** @jsxImportSource @octane-xplat/jsx/dom */
import type { Renderable } from '@octane-xplat/ui'

export function Paragraph(props: { children?: Renderable }) @{
	<p className="p">{props.children}</p>
}

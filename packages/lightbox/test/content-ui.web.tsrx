/** @jsxImportSource @octane-xplat/jsx/dom */
import { Overlay as UIOverlay } from '../../ui/src/components/overlays/Overlay.web.tsrx'
let read: (() => void) | undefined
export function setRead(next: typeof read) { read = next }
export function Overlay(props: Parameters<typeof UIOverlay>[0]) { read?.(); return <UIOverlay {...props} /> }
export function Text(props: { children?: unknown }) { return <span>{props.children as never}</span> }
export function Icon() { return <span /> }
export function Pressable(props: { children?: unknown }) { return <button>{props.children as never}</button> }

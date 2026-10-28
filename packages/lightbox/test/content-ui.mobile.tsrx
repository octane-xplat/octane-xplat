/** @jsxImportSource @octane-xplat/jsx */
import type { Renderable } from '@octane-xplat/ui'
let read: (() => void) | undefined
export function setRead(next: typeof read) { read = next }
export function Overlay(props: { children?: Renderable }) { read?.(); return <masonview>{props.children}</masonview> }
export function Pressable(props: { children?: Renderable }) { return <masonview>{props.children}</masonview> }
export function Text(props: { children?: Renderable }) { return <label>{props.children}</label> }

export function ScrollView(props: { children?: Renderable }) { return <masonview>{props.children}</masonview> }

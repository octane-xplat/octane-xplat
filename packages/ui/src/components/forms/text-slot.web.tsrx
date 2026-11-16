/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ClassValue } from '../../props'
import type { JSX } from 'octane/jsx-runtime'

/** DOM text children already have a supported host in the surrounding element. */
export function TextSlot(props: { children?: any; className?: ClassValue }): JSX.Element @{
  <>{props.children}</>
}

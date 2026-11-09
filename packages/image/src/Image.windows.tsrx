/** @jsxImportSource @octane-xplat/jsx */
// Windows leaf — delegates to the core native image host like the AppKit
// leaf; engine-level cache/transition props stay bounded (cache.windows.ts
// reports no pipeline).
import { Image as CoreImage } from '@octane-xplat/ui'
import type { ImageProps } from './props'

export function Image(props: ImageProps) @{
  <CoreImage {...props} />
}

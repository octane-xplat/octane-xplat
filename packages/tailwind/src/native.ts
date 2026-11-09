import type { Root } from 'postcss'
import type { TailwindTarget } from './target.ts'

/** Native adapter boundary; the private package must not deliver browser CSS. */
export function adaptNativeStylesheet(root: Root, target: Exclude<TailwindTarget, 'web'>): void {
  throw root.error(`Native Tailwind adaptation for ${target} is not qualified yet`, {
    plugin: 'xplat-tailwind',
  })
}

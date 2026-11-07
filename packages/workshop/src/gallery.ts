import type { StoryMeta } from './catalog'

/** One component and its deterministic representative in the gallery. */
export interface GalleryEntry {
  componentId: string
  title: string
  selected: StoryMeta | undefined
  variants: readonly StoryMeta[]
  height: number
}

/** Group metadata without loading or evaluating any story module. */
export function galleryEntries(entries: readonly StoryMeta[]): GalleryEntry[] {
  const groups = new Map<string, StoryMeta[]>()
  for (const entry of entries) {
    const id = entry.componentId ?? entry.id
    const group = groups.get(id) ?? []
    group.push(entry)
    groups.set(id, group)
  }
  return [...groups]
    .map(([componentId, variants]) => {
      variants.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      const applicable = variants.filter((entry) => entry.applicable)
      const primary = applicable.filter((entry) => entry.gallery?.primary)
      if (primary.length > 1) {
        throw new Error(`multiple primary gallery stories for ${componentId}`)
      }
      const selected = primary[0] ?? applicable[0]
      return {
        componentId,
        title: variants[0].title.split('/').slice(0, -1).join('/').trim() || variants[0].title,
        variants,
        selected,
        height: selected?.gallery?.height ?? 320,
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title) || a.componentId.localeCompare(b.componentId))
}

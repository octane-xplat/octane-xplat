import { describe, expect, it } from 'vitest'
import { galleryEntries } from '../src/gallery'
import type { StoryMeta } from '../src/catalog'

const story = (id: string, options: Partial<StoryMeta> = {}): StoryMeta => ({
  id,
  title: `Button / ${id}`,
  targets: ['web'],
  capabilities: [],
  file: '',
  exportName: id,
  applicable: true,
  ...options,
})

describe('gallery representatives', () => {
  it('keeps legacy stories, groups explicit identities, selects primary and retains unsupported groups', () => {
    const entries = galleryEntries([
      story('z', { componentId: 'button', gallery: { primary: true, height: 200 } }),
      story('a', { componentId: 'button' }),
      story('legacy'),
      story('native', { componentId: 'native', applicable: false, targets: ['ios'] }),
    ])

    expect(entries).toHaveLength(3)
    expect(entries.find((e) => e.componentId === 'button')?.selected?.id).toBe('z')
    expect(entries.find((e) => e.componentId === 'button')?.height).toBe(200)
    expect(entries.find((e) => e.componentId === 'native')?.selected).toBeUndefined()
  })

  it('uses stable story identity ordering, independent of discovery order', () => {
    const entries = [story('z', { componentId: 'button' }), story('a', { componentId: 'button' })]

    expect(galleryEntries(entries)[0].selected?.id).toBe('a')
    expect(galleryEntries([...entries].reverse())).toEqual(galleryEntries(entries))
  })

  it('uses explicit group metadata across variants and defaults other components', () => {
    const entries = galleryEntries([
      story('a', { componentId: 'button' }),
      story('b', { componentId: 'button', gallery: { group: 'primitives' } }),
      story('chart', { title: 'Chart / Basic' }),
    ])

    expect(entries.find((entry) => entry.componentId === 'button')?.group).toBe('primitives')
    expect(entries.find((entry) => entry.componentId === 'chart')?.group).toBe('components')
    expect(() =>
      galleryEntries([
        story('a', { componentId: 'button', gallery: { group: 'primitives' } }),
        story('b', { componentId: 'button', gallery: { group: 'components' } }),
      ]),
    ).toThrow('conflicting gallery groups')
  })

  it('rejects conflicting representatives', () => {
    expect(() =>
      galleryEntries(
        ['a', 'b'].map((id) => story(id, { componentId: 'button', gallery: { primary: true } })),
      ),
    ).toThrow('multiple primary')
  })
})

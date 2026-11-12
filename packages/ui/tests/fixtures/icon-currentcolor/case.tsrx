/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { createIconRegistry, Icon, Pressable, Text, View } from '@octane-xplat/ui'
import asset from './compass.svg'
import url from './compass.svg?url'
import source from './compass.svg?raw'
import { paint } from './paint'
import type { ProbeContext } from '../../../../../tools/probe/context'

const registry = createIconRegistry()
// This wrapper removal is specific to our authored fixture, not an SVG parser.
registry.registerIcon('compass', {
  markup: source.replace(/^<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, ''),
  viewBox: '0 0 32 32',
})
registry.registerIcon('asset', { src: asset })
registry.registerIcon('url', { src: url })

export default function Fixture() @{
  const [color, setColor] = useState('#2563eb')
  <View>
    <Icon id="tinted" name="compass" registry={registry} size={80} color={color} />
    <Icon id="asset" name="asset" registry={registry} size={40} color={color} />
    <Icon id="url" name="url" registry={registry} size={40} color={color} />
    <Pressable id="change" onPress={() => setColor('#be123c')}><Text>Change color</Text></Pressable>
  </View>
}

export async function run(ctx: ProbeContext) {
  ctx.assert('default SVG asset import', typeof asset, 'string')
  ctx.assert('explicit SVG URL import', typeof url, 'string')
  for (const [phase, tint] of [['blue', '#2563eb'], ['rose', '#be123c']]) {
    if (phase === 'rose') await ctx.press('change')
    await ctx.waitFor(() => paint(ctx.find('tinted'), 'compass-needle', 'fill') === tint)
    const host = ctx.find('tinted')
    const expected = [
      ['compass-ring', 'stroke', tint], ['compass-ring', 'fill', 'none'],
      ['compass-needle', 'fill', tint], ['compass-center', 'fill', '#f59e0b'],
      ['compass-center', 'stroke', '#7c2d12'], ['scope-green', 'fill', '#166534'],
      ['scope-purple', 'fill', '#7e22ce'], ['scope-inherit', 'fill', '#166534'],
      ['scope-current', 'fill', '#166534'], ['scope-none', 'fill', 'none'],
      ['scope-none', 'stroke', '#7c2d12'], ['scope-class', 'fill', '#0891b2'],
      ['scope-inline', 'fill', '#7e22ce'], ['scope-inline', 'stroke', 'none'],
      ['scope-sibling', 'fill', tint],
    ] as const
    for (const [id, property, color] of expected) {
      ctx.assert(`${phase} ${id} ${property}`, paint(host, id, property), color)
    }
    for (const id of ['asset', 'url']) {
      // External assets keep their own color context; Icon.color is not injected.
      ctx.assert(`${phase} ${id} source receives no Icon tint`, /#2563eb|#be123c/.test(ctx.find(id).src), false)
      if (ctx.target === 'ios') {
        await ctx.waitFor(() => paint(ctx.find(id), 'compass-needle', 'fill') != null)
        ctx.assert(`${phase} ${id} own default color`, paint(ctx.find(id), 'compass-needle', 'fill'), '#000000')
        ctx.assert(`${phase} ${id} literal paint`, paint(ctx.find(id), 'compass-center', 'fill'), '#f59e0b')
      }
    }
    ctx.record(phase, expected.map(([id, property]) => [id, property, paint(host, id, property)]))
  }
}

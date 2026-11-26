/** @jsxImportSource @octane-xplat/jsx */
import { useLayoutEffect, useMemo, useState } from 'octane'
import 'octane/signals'
import { useTheme } from '../../theme/use-theme.tsrx'
import type { BalancedTextProps } from '../../props'
import { headingScaleStyle, textScaleStyle } from '../forms/text-scale'
import { useMeasure$ } from '../layout/useMeasure.tsrx'
import { View } from '../layout/View.tsrx'
import { Heading } from './Heading.tsrx'
import { Text } from './Text.tsrx'

type TextLayout = typeof import('./balanced-text-layout')

export function BalancedText(props: BalancedTextProps): unknown @{
  const [layout, setLayout] = useState<TextLayout | null>(null)
  useLayoutEffect(() => {
    let active = true
    void import('./balanced-text-layout').then(
      (engine) => {
        if (active) setLayout(engine)
      },
      (error: unknown) => {
        if (active) console.error('BalancedText could not load text measurement', error)
      },
    )
    return () => {
      active = false
    }
  }, [])

  const { ref, bounds$ } = useMeasure$()
  const width = bounds$.get()?.width ?? 0
  const { text, id, level, color, weight, align, className, style, ...placement } = props
  const { tokens } = useTheme()
  const scale = level
    ? headingScaleStyle(tokens, { level, weight })
    : textScaleStyle(tokens, { type: 'body', weight })
  const familyStack = tokens[level ? '--font-family-heading' : '--font-family-body'] ?? ''
  // The native measurement adapters and label renderers take one font family.
  const family = /^\s*(?:"([^"]+)"|'([^']+)'|([^,]+))/.exec(familyStack)
  const fontFamily = (family?.[1] ?? family?.[2] ?? family?.[3])?.trim() || 'system-ui'
  const fontSize = scale.fontSizePx
  const font = fontSize
    ? `${scale.fontWeight || '400'} ${fontSize}px ${JSON.stringify(fontFamily)}`
    : undefined
  const prepared = useMemo(
    () => (layout && font ? layout.prepareBalancedText(text, font) : null),
    [layout, text, font],
  )
  const content = useMemo(
    () => (layout && prepared ? layout.wrapBalancedText(prepared, width) : text),
    [layout, prepared, text, width],
  )
  const textStyle = { fontFamily, textAlign: align }

  <View {...placement} {className} {style}>
    <View {ref}>
      @if (level) {
        <Heading
          {id}
          {level}
          {color}
          {weight}
          style={textStyle}
        >
          {content}
        </Heading>
      } @else {
        <Text
          {id}
          type="body"
          {color}
          {weight}
          accessibilityLabel={text}
          style={textStyle}
        >
          {content}
        </Text>
      }
    </View>
  </View>
}

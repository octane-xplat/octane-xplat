/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import { defineTheme, Pressable, Text, Theme, View } from '@octane-xplat/ui'

const palette = defineTheme({
  name: 'tailwind-app-proof',
  tokens: { '--color-primary': ['#123456', '#654321'], '--radius-lg': '12px' },
})

const nested = defineTheme({
  name: 'tailwind-nested-proof',
  tokens: { '--color-primary': ['#abcdef', '#fedcba'] },
})

export function App() @{
  const [wide, setWide] = useState(false)
  const [inline, setInline] = useState(false)
  const [dark, setDark] = useState(false)

  <Theme theme={palette} mode={dark ? 'dark' : 'light'}>
    <View className="flex flex-col gap-4">
      <View testID="spacing" className="p-4 bg-primary rounded-lg">
        <Text testID="type" className="text-xl leading-6 font-bold">
          Packed app
        </Text>
      </View>
      <View testID="row" className="flex flex-row gap-2 w-[200px]">
        <View testID="first" className="w-6 h-5 shrink-0" />
        <View testID="second" className="w-8 h-5 shrink-0" />
      </View>
      <View testID="grid" className="grid grid-cols-[40px_60px] gap-2 w-[200px]">
        <View testID="cell-a" className="h-5" />
        <View testID="cell-b" className="h-5" />
      </View>
      <View testID="relative" className="relative w-[200px] h-[80px]">
        <View testID="absolute" className="absolute left-3 top-4 w-6 h-5" />
      </View>
      <View testID="responsive" className="opacity-50 sm:opacity-75 h-5" />
      <View
        testID="dynamic"
        className={wide ? 'w-12 h-5' : 'w-8 h-5'}
        style={{ width: inline ? 56 : undefined }}
      />
      <Theme theme={nested} mode="light">
        <View testID="nested" className="bg-primary w-8 h-5" />
      </Theme>
      <Pressable testID="toggle-width" onPress={() => setWide(!wide)}>
        <Text>Toggle width</Text>
      </Pressable>
      <Pressable testID="toggle-inline" onPress={() => setInline(!inline)}>
        <Text>Toggle inline width</Text>
      </Pressable>
      <Pressable testID="toggle-mode" onPress={() => setDark(!dark)}>
        <Text>Toggle mode</Text>
      </Pressable>
    </View>
  </Theme>
}

/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import './mobile-input.css'
import { File, knownFolders, path, Screen } from '@nativescript/core'
import { Button, ClickableCard, Pressable, Text, View, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../probe/context'

const presses = { button: 0, pressable: 0, card: 0 }
const targetNames = ['button', 'pressable', 'card'] as const

export default function Example() {
  return (
    <VStack padding={8} gap={4}>
      <Button
        id="os-button"
        className="layout-os-host"
        onPress={() => {
          presses.button++
        }}
      >
        Action
      </Button>
      <Pressable
        id="os-pressable"
        className="layout-os-host"
        onPress={() => {
          presses.pressable++
        }}
      >
        <View id="os-first" className="layout-os-child" flexGrow={1} />
        <View id="os-second" className="layout-os-child" flexGrow={1} />
      </Pressable>
      <ClickableCard
        label="Open details"
        id="os-card"
        className="layout-os-host"
        padding={0}
        onPress={() => {
          presses.card++
        }}
      >
        <Text>Open details</Text>
      </ClickableCard>
    </VStack>
  )
}

export async function run(ctx: ProbeContext) {
  await ctx.waitFor(() => (ctx.inspect('os-card').frame?.height ?? 0) > 0)

  const first = ctx.inspect('os-first').frame!
  const second = ctx.inspect('os-second').frame!

  ctx.assert('pressable uses block content before OS input', Math.abs(second.y - first.y - 20) <= 1)

  const file = File.fromPath(path.join(knownFolders.documents().path, 'layout-os-targets.json'))

  ctx.onCleanup(() => file.removeSync())

  const targets = targetNames.map((name) => {
    const frame = ctx.inspect(`os-${name}`).frame!

    ctx.assert(`${name} has a usable hit frame`, frame.width > 100 && frame.height >= 50)
    return { name, x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 }
  })

  file.writeTextSync(
    JSON.stringify({ createdAt: Date.now(), scale: Screen.mainScreen.scale, targets }),
  )

  await ctx.waitFor(() => targetNames.every((name) => presses[name] === 1), { timeout: 30000 })
  for (const name of targetNames) {
    ctx.assert(`${name} OS tap activates exactly once`, presses[name], 1)
  }

  ctx.record('OS activation', { presses, targets })
}

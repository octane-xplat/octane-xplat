/** @jsxImportSource @octane-xplat/jsx */
import { Button, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../../tools/probe/context'

export default function Buttons() {
  return (
    <VStack>
      <Button id="idle-button" label="Save changes" style={{ width: 180 }} />
      <Button id="busy-button" label="Save changes" isLoading style={{ width: 180 }} />
    </VStack>
  )
}

export async function run(ctx: ProbeContext) {
  await ctx.mount(Buttons, {})
  const button = await ctx.waitFor(() => {
    const host = ctx.find('busy-button')

    return host?.isLoaded && host.getActualSize().width > 0 ? host : null
  })
  const idle = ctx.find('idle-button')
  const overlay = button.getChildAt(0)
  const spinner = overlay.getChildAt(0)
  const content = button.getChildAt(1)
  const size = button.getActualSize()
  const idleSize = idle.getActualSize()
  const spinnerSize = spinner.getActualSize()
  const relative = spinner.getLocationRelativeTo(button)
  ctx.record('button loading geometry', {
    size,
    idleSize,
    spinnerSize,
    relative,
    overlay: overlay.getActualSize(),
    spinner: spinner.className,
    content: content.className,
  })
  ctx.assert('spinner is visible', spinnerSize.width > 0 && spinnerSize.height > 0, true)
  ctx.assert('button retains width', Math.abs(idleSize.width - size.width) <= 1, true)
  ctx.assert('button retains height', Math.abs(idleSize.height - size.height) <= 1, true)
  ctx.assert(
    'centered horizontally',
    Math.abs(relative.x + spinnerSize.width / 2 - size.width / 2) <= 1,
    true,
  )
  ctx.assert(
    'centered vertically',
    Math.abs(relative.y + spinnerSize.height / 2 - size.height / 2) <= 1,
    true,
  )
}

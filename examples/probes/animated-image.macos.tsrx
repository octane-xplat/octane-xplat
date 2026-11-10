/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { AnimatedImage } from '../../packages/gif/src/index.macos'
import { Button, Text, TextInput, VStack } from '@octane-xplat/ui'
import type { AnimatedImageProps } from '../../packages/gif/src/props'
import type { ProbeContext } from '../../tools/probe/context'

export default function AnimatedImageProbe() {
  const [address, setAddress] = useState(''),
    [source, setSource] = useState(''),
    [shown, setShown] = useState(true)

  const [fit, setFit] = useState<AnimatedImageProps['stretch']>('aspectFit'),
    [count, setCount] = useState(0)

  return (
    <VStack id="animated-image-controls" gap={2}>
      <Text>
        No source loads automatically. Enter a test GIF URL, absolute file, data URI or ~/bundle
        path. Verify animation, source replacement, fit, reduced motion, hide/unmount and VoiceOver
        separately.
      </Text>
      <TextInput label="Test image source" value={address} onChange={setAddress} />
      <Button label="Apply source" onPress={() => setSource(address)} />
      <Button label="Clear source" onPress={() => setSource('')} />
      <Button label="Toggle mount" onPress={() => setShown(!shown)} />
      <Button label="Unrelated render" onPress={() => setCount(count + 1)} />
      <Text>
        Unrelated updates: {count}; fit: {fit}
      </Text>
      <Button label="Fit" onPress={() => setFit('aspectFit')} />
      <Button label="Fill" onPress={() => setFit('fill')} />
      <Button label="Cover" onPress={() => setFit('aspectFill')} />
      <Button label="Natural size" onPress={() => setFit('none')} />
      {shown ? (
        <AnimatedImage
          src={source}
          alt="Test animated image"
          width={240}
          height={140}
          stretch={fit}
        />
      ) : (
        <Text>Unmounted</Text>
      )}
    </VStack>
  )
}

export async function run(ctx: ProbeContext) {
  await ctx.waitFor(() => ctx.find('animated-image-controls'))
  ctx.record(
    'qualification',
    'Controls mounted only; no image requested and no animation/rendering/AX proof',
  )
}

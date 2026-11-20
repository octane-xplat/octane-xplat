/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { useState } from 'octane'
import { media } from '@octane-xplat/media'

const describe = (error: unknown) => `error:${(error as { message?: unknown })?.message ?? error}`

export default function MediaPick() {
  const [single, setSingle] = useState('pending')
  const [multi, setMulti] = useState('pending')

  const pickOne = async () => {
    setSingle('picking')
    try {
      const result = await media.pickImage()
      setSingle(result === null ? 'null' : `picked:${result.name}`)
    } catch (error) {
      setSingle(describe(error))
    }
  }

  const pickMany = async () => {
    setMulti('picking')
    try {
      const result = await media.pickImages()
      setMulti(`count:${result.length}`)
    } catch (error) {
      setMulti(describe(error))
    }
  }

  return (
    <VStack className="maestro-screen">
      <Text>Media pick probe</Text>
      <Pressable testID="pick-one" className="maestro-increment" onPress={() => void pickOne()}>
        <Text>Pick one image</Text>
      </Pressable>
      <Text testID="single-result">{`single: ${single}`}</Text>
      <Pressable testID="pick-many" className="maestro-increment" onPress={() => void pickMany()}>
        <Text>Pick many images</Text>
      </Pressable>
      <Text testID="multi-result">{`multi: ${multi}`}</Text>
    </VStack>
  )
}

/** @jsxImportSource @octane-xplat/jsx */
import { useEffect } from 'octane'
import { useSignal$ } from 'octane/signals/client'
import { Grid, Pressable, Screen, Text, View } from '@octane-xplat/ui'

export function VisibilitySamples() @{
  const visibility$ = useSignal$<'hidden' | 'collapse' | 'visible'>('hidden')
  const mounted$ = useSignal$(false)
  const revision$ = useSignal$(0)
  const wide$ = useSignal$(false)
  const ticks$ = useSignal$(0)
  const presses$ = useSignal$(0)

  useEffect(() => {
    const timer = setInterval(() => ticks$.set((n) => n + 1), 50)

    return () => clearInterval(timer)
  }, [])

  <View>
    <Text id="heartbeat">{ticks$.get()}</Text>
    <Pressable id="input" onPress={() => presses$.set((n) => n + 1)}>
      <Text>{'Input ' + presses$.get()}</Text>
    </Pressable>
    <Pressable
      id="next"
      onPress={() =>
        visibility$.set((v) =>
          v === 'hidden' ? 'collapse' : v === 'collapse' ? 'visible' : 'hidden',
        )
      }
    >
      <Text>Next visibility</Text>
    </Pressable>
    <Pressable id="text" onPress={() => revision$.set((n) => n + 1)}>
      <Text>Change text</Text>
    </Pressable>
    <Pressable id="mount" onPress={() => mounted$.set((v) => !v)}>
      <Text>Toggle mount</Text>
    </Pressable>
    <Pressable id="resize" onPress={() => wide$.set((v) => !v)}>
      <Text>Resize</Text>
    </Pressable>
    <View id="stage" style={{ width: wide$.get() ? 260 : 180 }}>
      <Text id="visible" className="visibility-label">
        Visible
      </Text>
      <Text id="initial-hidden" className="visibility-label visibility-hidden">
        Hidden
      </Text>
      <Text id="initial-collapse" className="visibility-label visibility-collapse">
        Collapsed
      </Text>
      <View className="visibility-row">
        <Text id="inline" className="visibility-label" style={{ visibility: visibility$.get() }}>
          {revision$.get() === 0 ? '-10s' : '+10s changed while hidden ' + revision$.get()}
        </Text>
        <Text id="inline-after">After</Text>
      </View>
      <View className="visibility-row">
        <Text id="class" className={['visibility-label', 'visibility-' + visibility$.get()]}>
          {revision$.get() === 0 ? '-10s' : '+10s changed while hidden ' + revision$.get()}
        </Text>
        <Text id="class-after">After</Text>
      </View>
      <View className="visibility-row">
        @if (mounted$.get()) {
          <Text id="conditional" className="visibility-label">
            {revision$.get() === 0 ? '-10s' : '+10s changed while hidden ' + revision$.get()}
          </Text>
        }
        <Text id="conditional-after">After</Text>
      </View>
    </View>
  </View>
}

export function SimpleVisibility() @{
  <Screen>
    <VisibilitySamples />
  </Screen>
}

export function LayeredVisibility() @{
  <Screen>
    <Grid rows="*" columns="*">
      <View row={0} col={0}>
        <Text>Library</Text>
      </View>
      <View row={0} col={0} style={{ flexGrow: 1 }}>
        <Screen>
          <Grid rows="auto,*" columns="*">
            <Text row={0}>Player</Text>
            <View row={1}>
              <VisibilitySamples />
            </View>
          </Grid>
        </Screen>
      </View>
    </Grid>
  </Screen>
}

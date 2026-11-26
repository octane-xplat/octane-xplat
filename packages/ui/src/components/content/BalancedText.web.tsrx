/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
import type { BalancedTextProps } from '../../props'
import { View } from '../layout/View.web.tsrx'
import { Heading } from './Heading.web.tsrx'
import { Text } from './Text.web.tsrx'

const styles = <style>
  .text {
    display: block;
    white-space: pre-line;
    text-wrap: balance;
  }
</style>

export function BalancedText(props: BalancedTextProps): JSX.Element @{
  const { text, id, level, color, weight, align, className, style, ...placement } = props
  const textStyle = { textAlign: align }

  <View {...placement} {className} {style}>
    @if (level) {
      <Heading
        {id}
        {level}
        {color}
        {weight}
        className={styles.text}
        style={textStyle}
      >
        {text}
      </Heading>
    } @else {
      <Text
        {id}
        type="body"
        {color}
        {weight}
        className={styles.text}
        style={textStyle}
      >
        {text}
      </Text>
    }
  </View>
}

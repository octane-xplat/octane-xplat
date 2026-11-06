import { css } from 'styled-system/css'

// Shared harness classes exercise the real Bamboo → native CSS path.
export const fontTestClasses = {
  regular: css({ fontWeight: '400' }),
  medium: css({ fontWeight: '500' }),
  semibold: css({ fontWeight: '600' }),
  bold: css({ fontWeight: '700' }),
}

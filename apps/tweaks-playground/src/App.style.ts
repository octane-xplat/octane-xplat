import { css } from './styled-system/css'

// Bamboo extracts css() from plain .ts only — .tsrx is not parseable by its
// extractor — so static styles live here and the .tsrx screen imports them.
export default {
  card: css({
    padding: '6',
    borderWidth: '1',
    borderColor: 'primary',
    backgroundColor: 'surface',
    _web: { color: 'primary' },
  }),
  row: css({ display: 'flex', gap: '3', alignItems: 'center' }),
  button: css({
    padding: '3',
    backgroundColor: 'primary',
    color: 'onprimary',
  }),
  screen: css({ padding: '8', gap: '6' }),
}

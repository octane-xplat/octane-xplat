// Maintained explicit opt-in example. Neither ui nor Lingui's root installs this.
import '@octane-xplat/lingui/polyfills/locales/de'
import '@octane-xplat/lingui/polyfills/time-zones/all'
import '@octane-xplat/lingui/polyfills/collator'
import '@octane-xplat/lingui/polyfills/segmenter'

export const formatted = new Intl.NumberFormat('de').format(1234.5)
export const comparison = new Intl.Collator('en', { numeric: true }).compare('item2', 'item10')

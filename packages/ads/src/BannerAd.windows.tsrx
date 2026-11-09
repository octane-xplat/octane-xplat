/** @jsxImportSource @octane-xplat/jsx */
// Banner ad — Windows leaf. No AdMob backend exists on Windows; renders an
// empty host and reports once via onAdEvent error.
import { useEffect } from 'octane'
import type { BannerAdProps } from './props'

export function BannerAd(props: BannerAdProps): unknown @{
  useEffect(() => {
    props.onAdEvent?.({
      type: 'error',
      error: new Error('unsupported: AdMob is not available on windows'),
    })
  }, [])

  <masonview className={props.className} style={props.style} />
}

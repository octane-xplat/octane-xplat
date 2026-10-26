// Port of upstream Banner/BannerFloating.tsx (Astryx 0.6.4, MIT).
import { Banner } from '@octane-xplat/ui'

export function BannerFloating() @{
	return <Banner status="info" title="You have unsaved changes" description="A raised banner reads as an overlay floating above the page." elevation="med" />
}

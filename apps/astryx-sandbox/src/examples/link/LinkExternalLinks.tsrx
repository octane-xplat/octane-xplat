// Port of upstream Link/LinkExternalLinks.tsx (Astryx 0.6.4, MIT).
import { Link, VStack } from '@octane-xplat/ui'

export function LinkExternalLinks() @{
	<VStack gap={2}>
		<Link href="https://github.com" isExternalLink isStandalone>GitHub</Link>
		<Link href="https://developer.mozilla.org" isExternalLink isStandalone>MDN Web Docs</Link>
		<Link href="https://react.dev" isExternalLink hasUnderline isStandalone>React Documentation</Link>
	</VStack>
}

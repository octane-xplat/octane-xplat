// Port of upstream templates/blocks/components/LinkProvider/
// LinkProviderCustomLink.tsx — LinkProvider routes every link-capable
// component in the subtree through the injected component; the custom link
// intercepts the click instead of navigating. Upstream fires window.alert;
// this port records the interception as DOM text so the behavior swap is
// observable without a dialog (adaptation recorded in docs/coverage.md).

import { useState } from 'octane'
import { Link, LinkProvider, Text, VStack } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'

const intercepted = createStore<string | null>(null)

/** Stand-in for a framework router link (Next.js/React Router): intercepts
 *  the click and hands the destination to the app — here it surfaces the
 *  target so the swap is observable in the preview. */
function RouterLink(props: any) @{
	const { href, onClick, children, ...rest } = props
	return (
		<a
			{...rest}
			href={href}
			onClick={(e: any) => {
				e?.preventDefault?.()
				onClick?.(e)
				intercepted.set(href)
			}}
		>
			{children}
		</a>
	)
}

export function LinkProviderCustomLink() @{
	const hit = useStore(intercepted)
	return (
		<LinkProvider component={RouterLink}>
			<VStack gap={3}>
				<Link href="/dashboard">
					<Text type="body">Go to dashboard</Text>
				</Link>
				{hit != null ? (
					<Text className="sb-link-intercept">RouterLink intercepted navigation to: {hit}</Text>
				) : null}
			</VStack>
		</LinkProvider>
	)
}

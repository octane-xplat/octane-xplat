// 404 surface — framed like upstream's static 404.html inside the sandbox
// shell.

import { Text, VStack, Heading, Layout, LayoutHeader, LayoutContent } from '@octane-xplat/ui'
import { SandboxShell } from '../shell/SandboxShell'

export function NotFoundScreen(props: { title?: string; message?: string }) @{
	return (
		<SandboxShell>
			<Layout
				header={
					<LayoutHeader hasDivider padding={6}>
						<Heading level={1}>{props.title ?? '404'}</Heading>
					</LayoutHeader>
				}
				content={
					<LayoutContent padding={6}>
						<VStack gap={3}>
							<Text className="sb-type-body sb-color-secondary">
								{props.message ?? 'This route is not part of the pinned sandbox route table.'}
							</Text>
						</VStack>
					</LayoutContent>
				}
			/>
		</SandboxShell>
	)
}

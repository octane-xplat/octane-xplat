// 404 surface — framed like upstream's static 404.html inside the sandbox
// shell.

import { Text, VStack } from '@octane-xplat/ui'
import { PageLayout } from '../shell/PageLayout'
import { SandboxShell } from '../shell/SandboxShell'

export function NotFoundScreen(props: { title?: string; message?: string }) @{
	return (
		<SandboxShell>
			<PageLayout title={props.title ?? '404'}>
				<VStack gap={3}>
					<Text className="sb-type-body sb-color-secondary">
						{props.message ?? 'This route is not part of the pinned sandbox route table.'}
					</Text>
				</VStack>
			</PageLayout>
		</SandboxShell>
	)
}

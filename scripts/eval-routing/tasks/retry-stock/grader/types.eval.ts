import { router } from '@octane-xplat/ui/routing'

void router.push({ to: '/stock/:id', params: { id: 'coat' } })
// @ts-expect-error The stock id is a required path parameter.
void router.push({ to: '/stock/:id' })

import { router } from '@octane-xplat/ui/routing'

void router.push({ to: '/items/:id', params: { id: 'coat' } })
// @ts-expect-error The detail route requires its id parameter.
void router.push({ to: '/items/:id' })
// @ts-expect-error Unknown routes are rejected.
void router.push({ to: '/itemz/:id', params: { id: 'coat' } })

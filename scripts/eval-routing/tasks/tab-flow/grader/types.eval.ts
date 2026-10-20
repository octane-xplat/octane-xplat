import { router } from '@octane-xplat/ui/routing'

void router.forStack('catalog').push({ to: '/items/:id', params: { id: 'coat' } })
void router.forStack('account').back()
// @ts-expect-error Only declared stacks are accepted.
void router.forStack('settings').back()

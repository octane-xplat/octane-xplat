import { router } from '@octane-xplat/ui/routing'

void router.push({ to: '/items' })
void router.push({ to: '/items', search: { sort: 'price' } })
// @ts-expect-error Only validated sort values are accepted.
void router.push({ to: '/items', search: { sort: 'color' } })

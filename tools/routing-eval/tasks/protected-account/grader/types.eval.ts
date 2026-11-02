import { router } from '@octane-xplat/ui/routing'

void router.push({ to: '/account' })
void router.push({ to: '/login', search: { returnTo: '/account' } })
// @ts-expect-error returnTo is a validated string.
void router.push({ to: '/login', search: { returnTo: 42 } })

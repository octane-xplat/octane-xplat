import { router } from '@octane-xplat/ui/routing'

void router.push({ to: '/guides/:slug', params: { slug: 'setup' } })
// @ts-expect-error The guide slug is a required path parameter.
void router.push({ to: '/guides/:slug' })
// @ts-expect-error Unknown destinations are rejected.
void router.push({ to: '/guide/:slug', params: { slug: 'setup' } })

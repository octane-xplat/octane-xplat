// Compiler-only consumer cases; never imported by the runtime fixture.
import { navigation } from './routing.gtk'
void navigation.push({ to: '/probe/:id', params: { id: 'coat' } })
// @ts-expect-error a declared path parameter is required
void navigation.push({ to: '/probe/:id' })
// @ts-expect-error path parameters are strings
void navigation.push({ to: '/probe/:id', params: { id: 1 } })
// @ts-expect-error undeclared paths must not widen to strings
void navigation.push({ to: '/missing' })
// @ts-expect-error this catalog has no named flow
navigation.forStack('missing')

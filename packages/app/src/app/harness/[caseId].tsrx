/** @jsxImportSource @octane-xplat/jsx */
import { Harness } from '../../Harness.tsrx'
import type { RouteProps } from '../../routes.gen.contracts'

export function HarnessCase(props: RouteProps<'/harness/:caseId'>) @{
  <Harness caseId={props.params.caseId} />
}

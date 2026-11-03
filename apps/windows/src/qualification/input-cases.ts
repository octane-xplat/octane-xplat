// Type contract for the packaged Windows input qualification scenes.
export type InputEmit = (event: string, data?: Record<string, unknown>) => void

export declare function InputCases(props: {
  emit: InputEmit
  mounted: boolean
  controlledValue: string
  onControlledWrite: (value: string) => void
}): unknown

export declare function ScrollCases(props: {
  emit: InputEmit
  rows: number
  axis: 'block' | 'inline'
}): unknown

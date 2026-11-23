/** Frame scheduler; timestamps and elapsed time are milliseconds. */
export interface Clock {
  now(): number
  getRate?(): number
  request(callback: () => void): number
  cancel(id: number): void
}

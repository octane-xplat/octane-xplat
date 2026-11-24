import type { VirtualListBenchResult, VirtualListInputResult } from '../virtual-list-benchmark'

export async function runVirtualListBenchmark(_listId: string): Promise<VirtualListBenchResult> {
  throw new Error('The VirtualList benchmark has no Windows profiling adapter.')
}

export async function runVirtualListInputBenchmark(
  _listId: string,
): Promise<VirtualListInputResult> {
  throw new Error('The VirtualList benchmark has no Windows input profiling adapter.')
}

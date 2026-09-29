/** Web twin — one linear URL stack; named stacks don't apply. */
export declare function registerStack(_name: string, _frame: unknown): void;
export declare function getStack(_name: string): undefined;
export declare function stackEntries(): IterableIterator<[string, never]>;

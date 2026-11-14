export type QueryPrimitive = string | number | boolean | null | undefined
export type ParsedQuery = Record<string, string | string[]>
export interface QuerystringModule {
  parse(
    value: string,
    separator?: string,
    equals?: string,
    options?: { maxKeys?: number },
  ): ParsedQuery
  decode: QuerystringModule['parse']
  stringify(
    value: Record<string, QueryPrimitive | readonly QueryPrimitive[]>,
    separator?: string,
    equals?: string,
    options?: { encodeURIComponent?: (value: string) => string },
  ): string
  encode: QuerystringModule['stringify']
  escape(value: string): string
  unescape(value: string): string
  /** Experimental ns-node helper; currently returns a string, not Node's Buffer. */
  unescapeBuffer(value: string): string
}

// Ported from react-native-nano-icons (MIT, © Software Mansion) — see
// packages/nano-icons/LICENSES.md for full attribution.
// Regexes for parsing/validating SVG path data and XML markup.

// --- SVG path data ---
/** Path already starts with a moveto. */
export const SVG_MOVE_PREFIX: RegExp = /^[Mm]/
/** Trailing close-path command (+ optional whitespace). */
export const SVG_TRAILING_CLOSE: RegExp = /[Zz]\s*$/
/** A signed int/float token. */
export const SVG_NUMBER: RegExp = /-?\d+(?:\.\d+)?/g
/** Whitespace separator (e.g. viewBox parts). */
export const WHITESPACE: RegExp = /\s+/

// --- SVG/XML validation ---
/** `<mask …>` element (unsupported). */
export const XML_MASK: RegExp = /<mask[\s/>]/i
/** `<filter …>` element (unsupported). */
export const XML_FILTER: RegExp = /<filter[\s/>]/i
/** `<image …>` element (unsupported). */
export const XML_IMAGE: RegExp = /<image[\s/>]/i
export const XML_UNCONVERTIBLE: RegExp = /<(text|style|foreignObject|a|switch)[\s/>]/i
/** An `xmlns=` attribute. */
export const XML_XMLNS: RegExp = /xmlns\s*=/
/** Opening `<svg` tag. */
export const SVG_OPEN_TAG: RegExp = /<svg\b/
export const PX_ATTRIBUTE_VALUE: RegExp = /=(["'])(\s*-?(?:\d+\.?\d*|\.\d+))px\s*\1/g
export const PX_STYLE_VALUE: RegExp = /(:\s*-?(?:\d+\.?\d*|\.\d+))px(?=\s*(?:;|["']|$))/g

// --- SVG attribute value separators ---
/** viewBox: comma or whitespace separated. */
export const VIEWBOX_SEPARATOR: RegExp = /,|\s+/
/** transform() arguments: comma and/or whitespace separated. */
export const TRANSFORM_ARG_SEPARATOR: RegExp = /\s*[,\s]\s*/
/** stroke-dasharray: single comma or space separated. */
export const DASHARRAY_SEPARATOR: RegExp = /[, ]/
/** One transform function call, e.g. `rotate(30)`; captures name and args. */
export const TRANSFORM_FUNCTION: RegExp =
	/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/gi

/** `url(#id)` reference; captures the id. */
export const URL_ID_REFERENCE: RegExp = /^url[(]#([\w-]+)[)]$/
/** A well-formed XML attribute name. */
export const XML_ATTRIBUTE_NAME: RegExp = /^[A-Za-z_][\w.-]*$/

// --- XML escaping / font emit ---
export const XML_AMP: RegExp = /&/g
export const XML_LT: RegExp = /</g
export const XML_GT: RegExp = />/g
export const XML_QUOT: RegExp = /"/g
/** svg2ttf error `glyph "u<hex>"` → captures the hex codepoint. */
export const GLYPH_CODEPOINT: RegExp = /glyph\s+"u([0-9a-fA-F]+)"/

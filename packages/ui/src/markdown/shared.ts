// Renderer-neutral Markdown document, streaming, outline and syntax contracts.
export { parseMdDoc, parseMdNodes, parseMdInline } from './markdown-parse'
export {
  createMarkdownStreamParser,
  createMarkdownIncrementalState,
  parseMarkdownIncremental,
  trimStreamingArtifacts,
} from './markdown-stream'

export type { MarkdownStreamParser, MarkdownIncrementalState } from './markdown-stream'
export { decodeMarkdownCharacterReferences } from './markdown-character-references'
export {
  assertMdDoc,
  isMdDoc,
  mdDoc,
  mdInlineText,
  mdInlineLen,
  mdNodeText,
  MD_DOC_KIND,
  MD_DOC_VERSION,
} from './markdown-ast'

export {
  outlineFromDoc,
  parseOutlineFromMarkdown,
  markdownHeadings,
  projectMdHeadings,
  inlineMarkdownText,
  slugify,
  uniqueSlug,
} from '../components/collections/outline-utils'

export {
  useOutlineFromDoc,
  useOutlineFromMarkdown,
} from '../components/collections/outline-hooks.tsrx'

export {
  tokenize,
  tokenizeAsync,
  tokenizeStreaming,
  flatTokensToLines,
  TOKEN_TYPES,
  syntaxTokenVar,
  syntaxTokenVarRef,
} from './code-tokenizer'

export type { SyntaxTokenType } from './code-tokenizer'
export type {
  MdDoc,
  MdNode,
  MdInline,
  MdDataValue,
  MdPoint,
  MdPosition,
  MdExtension,
  MdText,
  MdStrong,
  MdEmphasis,
  MdDelete,
  MdInlineCode,
  MdInlineMath,
  MdLink,
  MdImage,
  MdCitation,
  MdBreak,
  MdHeading,
  MdParagraph,
  MdCode,
  MdMath,
  MdBlockquote,
  MdList,
  MdListItem,
  MdTable,
  MdTableRow,
  MdTableCell,
  MdTableAlignment,
  MdThematicBreak,
  MdParseOptions,
  MarkdownProps,
  MarkdownDataProps,
  MarkdownSourceProps,
  MarkdownPresentationProps,
  MarkdownComponents,
  MarkdownInlinePlugin,
  MarkdownSource,
  MarkdownSourceLines,
  MarkdownScreenProps,
  OutlineItem,
  CodeToken,
  SyntaxToken,
  TokenLine,
  CodeTokenizer,
} from '../props'

export { useStreamingText } from '../components/content/use-streaming-text.tsrx'
export type {
  StreamingTextSpeed,
  UseStreamingTextOptions,
} from '../components/content/use-streaming-text.tsrx'

// Markdown extension protocol (Astryx plugins) — renderer-neutral contract.
export {
  createMarkdownPlugin,
  createMarkdownSourceLinesEntry,
  getMarkdownPluginCapabilities,
  getMarkdownPluginDefinition,
  isMarkdownExtensionNode,
  isMarkdownPluginData,
  freezeMarkdownPluginData,
  markdownExtensionText,
  getMarkdownExtensionRenderer,
  markMarkdownTransformClaim,
  markMarkdownTransformTrusted,
  getMarkdownTransformPluginName,
  getMarkdownHelperOwnership,
  adoptMarkdownHelperNode,
  adoptMarkdownHelperNodes,
  reportMarkdownPluginFailure,
  prepareMarkdownPlugins,
  applyMarkdownTransforms,
} from './markdown-plugins'

export type {
  MdPluginEntry,
  MarkdownPluginEntry,
  MarkdownExtensionNode,
  MarkdownPluginData,
  MarkdownPluginCapabilities,
  MarkdownPluginDefinition,
  MarkdownSyntaxPluginDefinition,
  MarkdownTransformPluginDefinition,
  MarkdownNodeOf,
  MarkdownExtensionsOf,
  MarkdownTokenizerInput,
  MarkdownTokenizeResult,
  MarkdownSyntaxContribution,
  MarkdownSyntaxCapability,
  MarkdownTransform,
  MarkdownTransformContext,
  MarkdownExtensionRenderer,
  MarkdownExtensionRenderers,
  MarkdownHelperOwnership,
  PreparedMarkdownPlugins,
  PreparedSyntaxContribution,
} from './markdown-plugins'

export {
  createMarkdownTextTransform,
  createMarkdownFenceTransform,
  getMarkdownFenceProposal,
  createMarkdownSourceDecoration,
  getMarkdownSourceDecorations,
  createMarkdownFrontmatter,
  markdownSoftBreaksPlugin,
  markdownSourceLinesPlugin,
  createMarkdownHeadingLinks,
  projectMarkdownHeadingLinks,
} from './markdown-plugin-helpers'

export { createMarkdownRemarkTransform } from './markdown-remark'
export type {
  MarkdownRemarkPoint,
  MarkdownRemarkPosition,
  MarkdownRemarkNodeBase,
  MarkdownRemarkText,
  MarkdownRemarkInlineCode,
  MarkdownRemarkInlineMath,
  MarkdownRemarkBreak,
  MarkdownRemarkPhrasingParent,
  MarkdownRemarkLink,
  MarkdownRemarkImage,
  MarkdownRemarkCitation,
  MarkdownRemarkExtension,
  MarkdownRemarkPhrasingContent,
  MarkdownRemarkHeading,
  MarkdownRemarkParagraph,
  MarkdownRemarkCode,
  MarkdownRemarkMath,
  MarkdownRemarkBlockquote,
  MarkdownRemarkListItem,
  MarkdownRemarkList,
  MarkdownRemarkTableAlignment,
  MarkdownRemarkTableCell,
  MarkdownRemarkTableRow,
  MarkdownRemarkTable,
  MarkdownRemarkThematicBreak,
  MarkdownRemarkBlockContent,
  MarkdownRemarkRoot,
  MarkdownRemarkMessage,
  MarkdownRemarkFile,
  MarkdownRemarkTransformer,
  MarkdownRemarkPlugin,
  MarkdownRemarkCompatibleTransformer,
  MarkdownRemarkCompatiblePlugin,
} from './markdown-remark'

export type {
  MarkdownTextTransformContext,
  MarkdownTextTransformOptions,
  MarkdownFenceContext,
  MarkdownFenceNode,
  MarkdownFenceTransformOptions,
  MarkdownSourceDecoration,
  MarkdownSourceDecorationRange,
  MarkdownSourceDecorationOptions,
  MarkdownFrontmatter,
  MarkdownFrontmatterOptions,
  MarkdownFrontmatterParseResult,
  MarkdownHeadingLinksOptions,
  MarkdownHeadingLinksProjection,
} from './markdown-plugin-helpers'

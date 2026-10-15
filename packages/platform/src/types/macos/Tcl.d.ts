import type { Tcl_HashEntry, Tcl_HashKeyType, Tcl_HashSearch, Tcl_HashTable, Tcl_NotifierProcs, Tcl_ObjType, Tcl_Time, in_addr } from './Runtime'

import type { interop } from './objc-runtime'

import { Tcl_PathType } from './Runtime'



export declare const tclEmptyString: number;

export declare const tclEmptyStringRep: string;

export declare const tclOneWordHashKeyType: Tcl_HashKeyType;

export declare const tclArrayHashKeyType: Tcl_HashKeyType;

export declare const tclEnsembleCmdType: Tcl_ObjType;

export declare const tclProcBodyType: Tcl_ObjType;

export declare const tclListType: Tcl_ObjType;

export declare const tclIntType: Tcl_ObjType;

export declare const tclEndOffsetType: Tcl_ObjType;

export declare const tclByteArrayType: Tcl_ObjType;

export declare const tclTimeClientData: interop.Pointer;

export declare const tclScaleTimeProcPtr: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

export declare const tclOriginalNotifier: Tcl_NotifierProcs;

export declare const tclPlatform: interop.Enum<typeof TclPlatformType>;

export declare const tclFindExecutableSearchDone: number;

export declare const TclBNMpSRmap: string;

export declare const ltm_prime_tab: interop.Pointer;

export declare const TclBNToomMulCutoff: number;

export declare const TclBNKaratsubaMulCutoff: number;

export declare const tclGetTimeProcPtr: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void;

export declare const tclIntStubsPtr: interop.Pointer;

export declare const tclIntPlatStubsPtr: interop.Pointer;

export declare const tclByteCodeType: Tcl_ObjType;

export declare const tclJumptableInfoType: AuxDataType;

export declare const tclFreeObjList: interop.Pointer;

export declare const tclObjHashKeyType: Tcl_HashKeyType;

export declare const tclNativeExecutableName: string;

export declare const tclDictType: Tcl_ObjType;

export declare const tclDoubleType: Tcl_ObjType;

export declare const tclBooleanType: Tcl_ObjType;

export declare const TclBNKaratsubaSqrCutoff: number;

export declare const tclInstructionTable: interop.Pointer;

export declare const TclBNToomSqrCutoff: number;

export declare const tclStringType: Tcl_ObjType;

export declare const tclRegexpType: Tcl_ObjType;

export declare const tclForeachInfoType: AuxDataType;

export declare const tclStringHashKeyType: Tcl_HashKeyType;

export declare const tclMemDumpFileName: string;

export declare const tclBignumType: Tcl_ObjType;

export declare const tclDictUpdateInfoType: AuxDataType;

export declare const tclArraySearchType: Tcl_ObjType;

export declare const TclJumpType: {
  UNCONDITIONAL_: 0,
  TRUE_: 1,
  FALSE_: 2,
};

export declare const ExceptionRangeType: {
  LOOP_: 0,
  CATCH_: 1,
};

export declare const Tcl_PathPart: {
  DIRNAME: 0,
  TAIL: 1,
  EXTENSION: 2,
  ROOT: 3,
};

export declare const TclPlatformType: {
  UNIX: 0,
  WINDOWS: 2,
};

export declare const PkgPreferOptions: {
  LATEST: 0,
  STABLE: 1,
};

export declare const InstOperandType: {
  NONE: 0,
  INT1: 1,
  INT4: 2,
  UINT1: 3,
  UINT4: 4,
  IDX4: 5,
  LVT1: 6,
  LVT4: 7,
  AUX4: 8,
};

export declare const TclEolTranslation: {
  AUTO: 0,
  CR: 1,
  LF: 2,
  CRLF: 3,
};

export declare class TclOpCmdClientData {
  constructor(init?: TclOpCmdClientData);
  op: string | null;
  expected: string | null;
  i: unnamed_12498154485098774557;
}

export declare class DictUpdateInfo {
  constructor(init?: DictUpdateInfo);
  length: number;
  varIndices: unknown /* const array */;
}

export declare class ForeachInfo {
  constructor(init?: ForeachInfo);
  numLists: number;
  firstValueTemp: number;
  loopCtTemp: number;
  varLists: unknown /* const array */;
}

export declare class JumpFixup {
  constructor(init?: JumpFixup);
  jumpType: interop.Enum<typeof TclJumpType>;
  codeOffset: number;
  cmdIndex: number;
  exceptIndex: number;
}

export declare class InstructionDesc {
  constructor(init?: InstructionDesc);
  name: string | null;
  numBytes: number;
  stackEffect: number;
  numOperands: number;
  opTypes: unknown /* const array */;
}

export declare class AuxData {
  constructor(init?: AuxData);
  type: interop.Pointer;
  clientData: interop.Pointer;
}

export declare class ExtCmdLoc {
  constructor(init?: ExtCmdLoc);
  type: number;
  start: number;
  path: interop.Pointer;
  loc: interop.Pointer;
  nloc: number;
  nuloc: number;
  litInfo: Tcl_HashTable;
}

export declare class CmdLocation {
  constructor(init?: CmdLocation);
  codeOffset: number;
  numCodeBytes: number;
  srcOffset: number;
  numSrcBytes: number;
}

export declare class ByteCode {
  constructor(init?: ByteCode);
  interpHandle: interop.Pointer;
  compileEpoch: number;
  nsPtr: interop.Pointer;
  nsEpoch: number;
  refCount: number;
  flags: number;
  source: string | null;
  procPtr: interop.Pointer;
  structureSize: number;
  numCommands: number;
  numSrcBytes: number;
  numCodeBytes: number;
  numLitObjects: number;
  numExceptRanges: number;
  numAuxDataItems: number;
  numCmdLocBytes: number;
  maxExceptDepth: number;
  maxStackDepth: number;
  codeStart: interop.Pointer;
  objArrayPtr: interop.Pointer;
  exceptArrayPtr: interop.Pointer;
  auxDataArrayPtr: interop.Pointer;
  codeDeltaStart: interop.Pointer;
  codeLengthStart: interop.Pointer;
  srcDeltaStart: interop.Pointer;
  srcLengthStart: interop.Pointer;
  localCachePtr: interop.Pointer;
}

export declare class TclIntStubHooks {
  constructor(init?: TclIntStubHooks);
}

export declare class LimitHandler {
  constructor(init?: LimitHandler);
  flags: number;
  handlerProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  clientData: interop.Pointer;
  deleteProc: (p1: interop.PointerConvertible) => void | null;
  prevPtr: interop.Pointer;
  nextPtr: interop.Pointer;
}

export declare class LiteralEntry {
  constructor(init?: LiteralEntry);
  nextPtr: interop.Pointer;
  objPtr: interop.Pointer;
  refCount: number;
  nsPtr: interop.Pointer;
}

export declare class ExecEnv {
  constructor(init?: ExecEnv);
  execStackPtr: interop.Pointer;
  constants: unknown /* const array */;
}

export declare class CompileEnv {
  constructor(init?: CompileEnv);
  iPtr: interop.Pointer;
  source: string | null;
  numSrcBytes: number;
  procPtr: interop.Pointer;
  numCommands: number;
  exceptDepth: number;
  maxExceptDepth: number;
  maxStackDepth: number;
  currStackDepth: number;
  localLitTable: LiteralTable;
  codeStart: interop.Pointer;
  codeNext: interop.Pointer;
  codeEnd: interop.Pointer;
  mallocedCodeArray: number;
  literalArrayPtr: interop.Pointer;
  literalArrayNext: number;
  literalArrayEnd: number;
  mallocedLiteralArray: number;
  exceptArrayPtr: interop.Pointer;
  exceptArrayNext: number;
  exceptArrayEnd: number;
  mallocedExceptArray: number;
  cmdMapPtr: interop.Pointer;
  cmdMapEnd: number;
  mallocedCmdMap: number;
  auxDataArrayPtr: interop.Pointer;
  auxDataArrayNext: number;
  auxDataArrayEnd: number;
  mallocedAuxDataArray: number;
  staticCodeSpace: unknown /* const array */;
  staticLiteralSpace: unknown /* const array */;
  staticExceptArraySpace: unknown /* const array */;
  staticCmdMapSpace: unknown /* const array */;
  staticAuxDataArraySpace: unknown /* const array */;
  extCmdMapPtr: interop.Pointer;
  line: number;
  atCmdStart: number;
  clLoc: interop.Pointer;
  clNext: interop.Pointer;
}

export declare class ExtraFrameInfoField {
  constructor(init?: ExtraFrameInfoField);
  name: string | null;
  proc: (p1: interop.PointerConvertible) => interop.Pointer | null;
  clientData: interop.Pointer;
}

export declare class ContLineLoc {
  constructor(init?: ContLineLoc);
  num: number;
  loc: unknown /* const array */;
}

export declare class CFWordBC {
  constructor(init?: CFWordBC);
  framePtr: interop.Pointer;
  pc: number;
  word: number;
  prevPtr: interop.Pointer;
}

export declare class CFWord {
  constructor(init?: CFWord);
  framePtr: interop.Pointer;
  word: number;
  refCount: number;
}

export declare class unnamed_8645244662922216648 {
  constructor(init?: unnamed_8645244662922216648);
  cmd: string | null;
  len: number;
}

export declare class CmdFrame {
  constructor(init?: CmdFrame);
  type: number;
  level: number;
  line: interop.Pointer;
  nline: number;
  framePtr: interop.Pointer;
  nextPtr: interop.Pointer;
  data: unnamed_3838363081761054882;
  cmd: unnamed_8183570762359882055;
}

export declare class AssocData {
  constructor(init?: AssocData);
  proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  clientData: interop.Pointer;
}

export declare class Trace {
  constructor(init?: Trace);
  level: number;
  proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: string, p5: interop.PointerConvertible, p6: number, p7: interop.PointerConvertible) => number | null;
  clientData: interop.Pointer;
  nextPtr: interop.Pointer;
  flags: number;
  delProc: (p1: interop.PointerConvertible) => void | null;
}

export declare class Interp {
  constructor(init?: Interp);
  result: string | null;
  freeProc: (p1: string) => void | null;
  errorLine: number;
  stubTable: interop.Pointer;
  handle: interop.Pointer;
  globalNsPtr: interop.Pointer;
  hiddenCmdTablePtr: interop.Pointer;
  interpInfo: interop.Pointer;
  unused2: Tcl_HashTable;
  numLevels: number;
  maxNestingDepth: number;
  framePtr: interop.Pointer;
  varFramePtr: interop.Pointer;
  activeVarTracePtr: interop.Pointer;
  returnCode: number;
  rootFramePtr: interop.Pointer;
  lookupNsPtr: interop.Pointer;
  appendResult: string | null;
  appendAvl: number;
  appendUsed: number;
  packageTable: Tcl_HashTable;
  packageUnknown: string | null;
  cmdCount: number;
  evalFlags: number;
  unused1: number;
  literalTable: LiteralTable;
  compileEpoch: number;
  compiledProcPtr: interop.Pointer;
  resolverPtr: interop.Pointer;
  scriptFile: interop.Pointer;
  flags: number;
  randSeed: number;
  tracePtr: interop.Pointer;
  assocData: interop.Pointer;
  execEnvPtr: interop.Pointer;
  emptyObjPtr: interop.Pointer;
  resultSpace: unknown /* const array */;
  objResultPtr: interop.Pointer;
  threadId: interop.Pointer;
  activeCmdTracePtr: interop.Pointer;
  activeInterpTracePtr: interop.Pointer;
  tracesForbiddingInline: number;
  returnOpts: interop.Pointer;
  errorInfo: interop.Pointer;
  eiVar: interop.Pointer;
  errorCode: interop.Pointer;
  ecVar: interop.Pointer;
  returnLevel: number;
  limit: unnamed_10546957772915706595;
  ensembleRewrite: unnamed_878023278118248259;
  chanMsg: interop.Pointer;
  cmdFramePtr: interop.Pointer;
  invokeCmdFramePtr: interop.Pointer;
  invokeWord: number;
  linePBodyPtr: interop.Pointer;
  lineBCPtr: interop.Pointer;
  lineLABCPtr: interop.Pointer;
  lineLAPtr: interop.Pointer;
  scriptCLLocPtr: interop.Pointer;
  packagePrefer: number;
  varTraces: Tcl_HashTable;
  varSearches: Tcl_HashTable;
  allocCache: interop.Pointer;
  pendingObjDataPtr: interop.Pointer;
  asyncReadyPtr: interop.Pointer;
  stackBound: interop.Pointer;
}

export declare class TclIntPlatStubHooks {
  constructor(init?: TclIntPlatStubHooks);
}

export declare class CompiledLocal {
  constructor(init?: CompiledLocal);
  nextPtr: interop.Pointer;
  nameLength: number;
  frameIndex: number;
  flags: number;
  defValuePtr: interop.Pointer;
  resolveInfo: interop.Pointer;
  name: unknown /* const array */;
}

export declare class VarInHash {
  constructor(init?: VarInHash);
  var: Var;
  refCount: number;
  entry: Tcl_HashEntry;
}

export declare class Var {
  constructor(init?: Var);
  flags: number;
  value: unnamed_11390820063786587861;
}

export declare class EnsembleCmdRep {
  constructor(init?: EnsembleCmdRep);
  nsPtr: interop.Pointer;
  epoch: number;
  token: interop.Pointer;
  fullSubcmdName: string | null;
  realPrefixObj: interop.Pointer;
}

export declare class Namespace {
  constructor(init?: Namespace);
  name: string | null;
  fullName: string | null;
  clientData: interop.Pointer;
  deleteProc: (p1: interop.PointerConvertible) => void | null;
  parentPtr: interop.Pointer;
  childTable: Tcl_HashTable;
  nsId: number;
  interp: interop.Pointer;
  flags: number;
  activationCount: number;
  refCount: number;
  cmdTable: Tcl_HashTable;
  varTable: TclVarHashTable;
  exportArrayPtr: interop.Pointer;
  numExportPatterns: number;
  maxExportPatterns: number;
  cmdRefEpoch: number;
  resolverEpoch: number;
  cmdResProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number | null;
  varResProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number | null;
  compiledVarResProc: (p1: interop.PointerConvertible, p2: string, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  exportLookupEpoch: number;
  ensembles: interop.Pointer;
  unknownHandlerPtr: interop.Pointer;
  commandPathLength: number;
  commandPathArray: interop.Pointer;
  commandPathSourceList: interop.Pointer;
}

export declare class TclVarHashTable {
  constructor(init?: TclVarHashTable);
  table: Tcl_HashTable;
  nsPtr: interop.Pointer;
}

export declare class Tcl_Ensemble {
  constructor(init?: Tcl_Ensemble);
}

export declare class ActiveCommandTrace {
  constructor(init?: ActiveCommandTrace);
  cmdPtr: interop.Pointer;
  nextPtr: interop.Pointer;
  nextTracePtr: interop.Pointer;
  reverseScan: number;
}

export declare class Command {
  constructor(init?: Command);
  hPtr: interop.Pointer;
  nsPtr: interop.Pointer;
  refCount: number;
  cmdEpoch: number;
  compileProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  objProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number | null;
  objClientData: interop.Pointer;
  proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number | null;
  clientData: interop.Pointer;
  deleteProc: (p1: interop.PointerConvertible) => void | null;
  deleteData: interop.Pointer;
  flags: number;
  importRefPtr: interop.Pointer;
  tracePtr: interop.Pointer;
}

export declare class Tcl_ResolverInfo {
  constructor(init?: Tcl_ResolverInfo);
  cmdResProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number | null;
  varResProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number | null;
  compiledVarResProc: (p1: interop.PointerConvertible, p2: string, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
}

export declare class unnamed_878023278118248259 {
  constructor(init?: unnamed_878023278118248259);
  sourceObjs: interop.Pointer;
  numRemovedObjs: number;
  numInsertedObjs: number;
}

export declare class LocalCache {
  constructor(init?: LocalCache);
  refCount: number;
  numVars: number;
  varName0: interop.Pointer;
}

export declare class CommandTrace {
  constructor(init?: CommandTrace);
  traceProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string, p4: string, p5: number) => void | null;
  clientData: interop.Pointer;
  flags: number;
  nextPtr: interop.Pointer;
  refCount: number;
}

export declare class ExecStack {
  constructor(init?: ExecStack);
  prevPtr: interop.Pointer;
  nextPtr: interop.Pointer;
  markerPtr: interop.Pointer;
  endPtr: interop.Pointer;
  tosPtr: interop.Pointer;
  stackWords: unknown /* const array */;
}

export declare class ExceptionRange {
  constructor(init?: ExceptionRange);
  type: interop.Enum<typeof ExceptionRangeType>;
  nestingLevel: number;
  codeOffset: number;
  numCodeBytes: number;
  breakOffset: number;
  continueOffset: number;
  catchOffset: number;
}

export declare class ImportRef {
  constructor(init?: ImportRef);
  importedCmdPtr: interop.Pointer;
  nextPtr: interop.Pointer;
}

export declare class ResolverScheme {
  constructor(init?: ResolverScheme);
  name: string | null;
  cmdResProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number | null;
  varResProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number | null;
  compiledVarResProc: (p1: interop.PointerConvertible, p2: string, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number | null;
  nextPtr: interop.Pointer;
}

export declare class TclFileAttrProcs {
  constructor(init?: TclFileAttrProcs);
  getProc: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  setProc: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
}

export declare class ProcessGlobalValue {
  constructor(init?: ProcessGlobalValue);
  epoch: number;
  numBytes: number;
  value: string | null;
  encoding: interop.Pointer;
  proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  mutex: interop.Pointer;
  key: interop.Pointer;
}

export declare class CallFrame {
  constructor(init?: CallFrame);
  nsPtr: interop.Pointer;
  isProcCallFrame: number;
  objc: number;
  objv: interop.Pointer;
  callerPtr: interop.Pointer;
  callerVarPtr: interop.Pointer;
  level: number;
  procPtr: interop.Pointer;
  varTablePtr: interop.Pointer;
  numCompiledLocals: number;
  compiledLocals: interop.Pointer;
  clientData: interop.Pointer;
  localCachePtr: interop.Pointer;
}

export declare class Tcl_ResolvedVarInfo {
  constructor(init?: Tcl_ResolvedVarInfo);
  fetchProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => interop.Pointer | null;
  deleteProc: (p1: interop.PointerConvertible) => void | null;
}

export declare class List {
  constructor(init?: List);
  refCount: number;
  maxElemCount: number;
  elemCount: number;
  canonicalFlag: number;
  elements: interop.Pointer;
}

export declare class unnamed_10546957772915706595 {
  constructor(init?: unnamed_10546957772915706595);
  active: number;
  granularityTicker: number;
  exceeded: number;
  cmdCount: number;
  cmdHandlers: interop.Pointer;
  cmdGranularity: number;
  time: Tcl_Time;
  timeHandlers: interop.Pointer;
  timeGranularity: number;
  timeEvent: interop.Pointer;
  callbacks: Tcl_HashTable;
}

export declare class ExtraFrameInfo {
  constructor(init?: ExtraFrameInfo);
  length: number;
  fields: unknown /* const array */;
}

export declare class NamespacePathEntry {
  constructor(init?: NamespacePathEntry);
  nsPtr: interop.Pointer;
  creatorNsPtr: interop.Pointer;
  prevPtr: interop.Pointer;
  nextPtr: interop.Pointer;
}

export declare class VarTrace {
  constructor(init?: VarTrace);
  traceProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string, p4: string, p5: number) => string | null;
  clientData: interop.Pointer;
  flags: number;
  nextPtr: interop.Pointer;
}

export declare class ActiveInterpTrace {
  constructor(init?: ActiveInterpTrace);
  nextPtr: interop.Pointer;
  nextTracePtr: interop.Pointer;
  reverseScan: number;
}

export declare class JumpFixupArray {
  constructor(init?: JumpFixupArray);
  fixup: interop.Pointer;
  next: number;
  end: number;
  mallocedArray: number;
  staticFixupSpace: unknown /* const array */;
}

export declare class ForeachVarList {
  constructor(init?: ForeachVarList);
  numVars: number;
  varIndexes: unknown /* const array */;
}

export declare class AuxDataType {
  constructor(init?: AuxDataType);
  name: string | null;
  dupProc: (p1: interop.PointerConvertible) => interop.Pointer | null;
  freeProc: (p1: interop.PointerConvertible) => void | null;
  printProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number) => void | null;
}

export declare class ActiveVarTrace {
  constructor(init?: ActiveVarTrace);
  varPtr: interop.Pointer;
  nextPtr: interop.Pointer;
  nextTracePtr: interop.Pointer;
}

export declare class LiteralTable {
  constructor(init?: LiteralTable);
  buckets: interop.Pointer;
  staticBuckets: unknown /* const array */;
  numBuckets: number;
  numEntries: number;
  rebuildSize: number;
  mask: number;
}

export declare class InterpList {
  constructor(init?: InterpList);
  interpPtr: interop.Pointer;
  prevPtr: interop.Pointer;
  nextPtr: interop.Pointer;
}

export declare class JumptableInfo {
  constructor(init?: JumptableInfo);
  hashTable: Tcl_HashTable;
}

export declare class TclFile_ {
  constructor(init?: TclFile_);
}

export declare class EnsembleImplMap {
  constructor(init?: EnsembleImplMap);
  name: string | null;
  proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number | null;
  compileProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
}

export declare class ImportedCmdData {
  constructor(init?: ImportedCmdData);
  realCmdPtr: interop.Pointer;
  selfPtr: interop.Pointer;
}

export declare class unnamed_7773134410275066031 {
  constructor(init?: unnamed_7773134410275066031);
  path: interop.Pointer;
}

export declare class unnamed_10865474152434340258 {
  constructor(init?: unnamed_10865474152434340258);
  codePtr: interop.Pointer;
  pc: string | null;
}

export declare class ECL {
  constructor(init?: ECL);
  srcOffset: number;
  nline: number;
  line: interop.Pointer;
  next: interop.Pointer;
}

export declare class Proc {
  constructor(init?: Proc);
  iPtr: interop.Pointer;
  refCount: number;
  cmdPtr: interop.Pointer;
  bodyPtr: interop.Pointer;
  numArgs: number;
  numCompiledLocals: number;
  firstLocalPtr: interop.Pointer;
  lastLocalPtr: interop.Pointer;
}

export declare class ArraySearch {
  constructor(init?: ArraySearch);
  id: number;
  varPtr: interop.Pointer;
  search: Tcl_HashSearch;
  nextEntry: interop.Pointer;
  nextPtr: interop.Pointer;
}

export type unnamed_8183570762359882055Descriptor = 
  | { str: unnamed_8645244662922216648 }
  | { listPtr: interop.PointerConvertible };

export declare class unnamed_8183570762359882055 {
  constructor(init?: unnamed_8183570762359882055Descriptor);
  str: unnamed_8645244662922216648;
  listPtr: interop.Pointer;
}

export type unnamed_3838363081761054882Descriptor = 
  | { eval: unnamed_7773134410275066031 }
  | { tebc: unnamed_10865474152434340258 };

export declare class unnamed_3838363081761054882 {
  constructor(init?: unnamed_3838363081761054882Descriptor);
  eval: unnamed_7773134410275066031;
  tebc: unnamed_10865474152434340258;
}

export type unnamed_12498154485098774557Descriptor = 
  | { numArgs: number }
  | { identity: number };

export declare class unnamed_12498154485098774557 {
  constructor(init?: unnamed_12498154485098774557Descriptor);
  numArgs: number;
  identity: number;
}

export type unnamed_11390820063786587861Descriptor = 
  | { objPtr: interop.PointerConvertible }
  | { tablePtr: interop.PointerConvertible }
  | { linkPtr: interop.PointerConvertible };

export declare class unnamed_11390820063786587861 {
  constructor(init?: unnamed_11390820063786587861Descriptor);
  objPtr: interop.Pointer;
  tablePtr: interop.Pointer;
  linkPtr: interop.Pointer;
}

export declare function mp_get_int(a: interop.PointerConvertible): number;

export declare function TclUnixSetBlockingMode(fd: number, mode: number): number;

export declare function TclpLocaltime(p1: interop.PointerConvertible): interop.Pointer;

export declare function TclpGmtime(p1: interop.PointerConvertible): interop.Pointer;

export declare function TclpInetNtoa(p1: in_addr): string;

export declare function TclpGetPwNam(name: string): interop.Pointer;

export declare function TclpGetGrNam(name: string): interop.Pointer;

export declare function TclpGetPwUid(uid: number): interop.Pointer;

export declare function TclpGetGrGid(gid: number): interop.Pointer;

export declare function TclpGetHostByName(name: string): interop.Pointer;

export declare function TclpGetHostByAddr(addr: string, length: number, type: number): interop.Pointer;

export declare function TclFreeLocalCache(interp: interop.PointerConvertible, localCachePtr: interop.PointerConvertible): void;

export declare function TclThreadDataKeyGet(keyPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclThreadDataKeySet(keyPtr: interop.PointerConvertible, data: interop.PointerConvertible): void;

export declare function TclAdvanceContinuations(line: interop.PointerConvertible, next: interop.PointerConvertible, loc: number): void;

export declare function TclAdvanceLines(line: interop.PointerConvertible, start: string, end: string): void;

export declare function TclArgumentEnter(interp: interop.PointerConvertible, objv: interop.Pointer, objc: number, cf: interop.PointerConvertible): void;

export declare function TclArgumentRelease(interp: interop.PointerConvertible, objv: interop.Pointer, objc: number): void;

export declare function TclArgumentGet(interp: interop.PointerConvertible, obj: interop.PointerConvertible, cfPtrPtr: interop.PointerConvertible, wordPtr: interop.PointerConvertible): void;

export declare function TclArgumentBCEnter(interp: interop.PointerConvertible, objv: interop.Pointer, objc: number, codePtr: interop.PointerConvertible, cfPtr: interop.PointerConvertible, pc: number): void;

export declare function TclArgumentBCRelease(interp: interop.PointerConvertible, objv: interop.Pointer, objc: number, codePtr: interop.PointerConvertible, pc: number): void;

export declare function TclArraySet(interp: interop.PointerConvertible, arrayNameObj: interop.PointerConvertible, arrayElemObj: interop.PointerConvertible): number;

export declare function TclBignumToDouble(bignum: interop.PointerConvertible): number;

export declare function TclByteArrayMatch(string: interop.PointerConvertible, strLen: number, pattern: interop.PointerConvertible, ptnLen: number, flags: number): number;

export declare function TclCeil(a: interop.PointerConvertible): number;

export declare function TclCheckBadOctal(interp: interop.PointerConvertible, value: string): number;

export declare function TclChanCaughtErrorBypass(interp: interop.PointerConvertible, chan: interop.PointerConvertible): number;

export declare function TclCleanupLiteralTable(interp: interop.PointerConvertible, tablePtr: interop.PointerConvertible): void;

export declare function TclContinuationsEnter(objPtr: interop.PointerConvertible, num: number, loc: interop.PointerConvertible): interop.Pointer;

export declare function TclContinuationsEnterDerived(objPtr: interop.PointerConvertible, start: number, clNext: interop.PointerConvertible): void;

export declare function TclContinuationsGet(objPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclContinuationsCopy(objPtr: interop.PointerConvertible, originObjPtr: interop.PointerConvertible): void;

export declare function TclDoubleDigits(buf: string, value: number, signum: interop.PointerConvertible): number;

export declare function TclDeleteNamespaceVars(nsPtr: interop.PointerConvertible): void;

export declare function TclEvalEx(interp: interop.PointerConvertible, script: string, numBytes: number, flags: number, line: number, clNextOuter: interop.PointerConvertible, outerScript: string): number;

export declare function TclFileAttrsCmd(interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclFileCopyCmd(interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclFileDeleteCmd(interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclFileMakeDirsCmd(interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclFileRenameCmd(interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCreateLateExitHandler(proc: (p1: interop.PointerConvertible) => void, clientData: interop.PointerConvertible): void;

export declare function TclDeleteLateExitHandler(proc: (p1: interop.PointerConvertible) => void, clientData: interop.PointerConvertible): void;

export declare function TclFinalizeAllocSubsystem(): void;

export declare function TclFinalizeAsync(): void;

export declare function TclFinalizeDoubleConversion(): void;

export declare function TclFinalizeEncodingSubsystem(): void;

export declare function TclFinalizeEnvironment(): void;

export declare function TclFinalizeExecution(): void;

export declare function TclFinalizeIOSubsystem(): void;

export declare function TclFinalizeFilesystem(): void;

export declare function TclResetFilesystem(): void;

export declare function TclFinalizeLoad(): void;

export declare function TclFinalizeLock(): void;

export declare function TclFinalizeMemorySubsystem(): void;

export declare function TclFinalizeNotifier(): void;

export declare function TclFinalizeObjects(): void;

export declare function TclFinalizePreserve(): void;

export declare function TclFinalizeSynchronization(): void;

export declare function TclFinalizeThreadAlloc(): void;

export declare function TclFinalizeThreadData(): void;

export declare function TclFinalizeThreadObjects(): void;

export declare function TclFloor(a: interop.PointerConvertible): number;

export declare function TclFormatNaN(value: number, buffer: string): void;

export declare function TclFSFileAttrIndex(pathPtr: interop.PointerConvertible, attributeName: string, indexPtr: interop.PointerConvertible): number;

export declare function TclFSUnloadTempFile(loadHandle: interop.PointerConvertible): void;

export declare function TclGetAsyncReadyPtr(): interop.Pointer;

export declare function TclGetBgErrorHandler(interp: interop.PointerConvertible): interop.Pointer;

export declare function TclGetChannelFromObj(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, chanPtr: interop.PointerConvertible, modePtr: interop.PointerConvertible, flags: number): number;

export declare function TclGetNumberFromObj(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, clientDataPtr: interop.PointerConvertible, typePtr: interop.PointerConvertible): number;

export declare function TclGetOpenModeEx(interp: interop.PointerConvertible, modeString: string, seekFlagPtr: interop.PointerConvertible, binaryPtr: interop.PointerConvertible): number;

export declare function TclGetProcessGlobalValue(pgvPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclGetSrcInfoForCmd(iPtr: interop.PointerConvertible, lenPtr: interop.PointerConvertible): string;

export declare function TclGlob(interp: interop.PointerConvertible, pattern: string, unquotedPrefix: interop.PointerConvertible, globFlags: number, types: interop.PointerConvertible): number;

export declare function TclIncrObj(interp: interop.PointerConvertible, valuePtr: interop.PointerConvertible, incrPtr: interop.PointerConvertible): number;

export declare function TclIncrObjVar2(interp: interop.PointerConvertible, part1Ptr: interop.PointerConvertible, part2Ptr: interop.PointerConvertible, incrPtr: interop.PointerConvertible, flags: number): interop.Pointer;

export declare function TclInfoExistsCmd(dummy: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclInfoFrame(interp: interop.PointerConvertible, framePtr: interop.PointerConvertible): interop.Pointer;

export declare function TclInfoGlobalsCmd(dummy: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclInfoLocalsCmd(dummy: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclInfoVarsCmd(dummy: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclInitAlloc(): void;

export declare function TclInitDbCkalloc(): void;

export declare function TclInitDoubleConversion(): void;

export declare function TclInitEmbeddedConfigurationInformation(interp: interop.PointerConvertible): void;

export declare function TclInitEncodingSubsystem(): void;

export declare function TclInitIOSubsystem(): void;

export declare function TclInitLimitSupport(interp: interop.PointerConvertible): void;

export declare function TclInitNamespaceSubsystem(): void;

export declare function TclInitNotifier(): void;

export declare function TclInitObjSubsystem(): void;

export declare function TclInitSubsystems(): void;

export declare function TclInterpReady(interp: interop.PointerConvertible): number;

export declare function TclIsLocalScalar(src: string, len: number): number;

export declare function TclJoinThread(id: interop.PointerConvertible, result: interop.PointerConvertible): number;

export declare function TclLimitRemoveAllHandlers(interp: interop.PointerConvertible): void;

export declare function TclLindexList(interp: interop.PointerConvertible, listPtr: interop.PointerConvertible, argPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclLindexFlat(interp: interop.PointerConvertible, listPtr: interop.PointerConvertible, indexCount: number, indexArray: interop.Pointer): interop.Pointer;

export declare function TclListLines(listObj: interop.PointerConvertible, line: number, n: number, lines: interop.PointerConvertible, elems: interop.PointerConvertible): void;

export declare function TclListObjCopy(interp: interop.PointerConvertible, listPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclLoadFile(interp: interop.PointerConvertible, pathPtr: interop.PointerConvertible, symc: number, symbols: interop.Pointer, procPtrs: interop.Pointer, handlePtr: interop.PointerConvertible, clientDataPtr: interop.PointerConvertible, unloadProcPtr: interop.PointerConvertible): number;

export declare function TclLsetList(interp: interop.PointerConvertible, listPtr: interop.PointerConvertible, indexPtr: interop.PointerConvertible, valuePtr: interop.PointerConvertible): interop.Pointer;

export declare function TclLsetFlat(interp: interop.PointerConvertible, listPtr: interop.PointerConvertible, indexCount: number, indexArray: interop.Pointer, valuePtr: interop.PointerConvertible): interop.Pointer;

export declare function TclMakeEnsemble(interp: interop.PointerConvertible, name: string, map: interop.Pointer): interop.Pointer;

export declare function TclMarkList(interp: interop.PointerConvertible, list: string, end: string, argcPtr: interop.PointerConvertible, argszPtr: interop.PointerConvertible, argvPtr: interop.PointerConvertible): number;

export declare function TclMergeReturnOptions(interp: interop.PointerConvertible, objc: number, objv: interop.Pointer, optionsPtrPtr: interop.PointerConvertible, codePtr: interop.PointerConvertible, levelPtr: interop.PointerConvertible): number;

export declare function TclNokia770Doubles(): number;

export declare function TclObjVarErrMsg(interp: interop.PointerConvertible, part1Ptr: interop.PointerConvertible, part2Ptr: interop.PointerConvertible, operation: string, reason: string, index: number): void;

export declare function TclObjInvokeNamespace(interp: interop.PointerConvertible, objc: number, objv: interop.Pointer, nsPtr: interop.PointerConvertible, flags: number): number;

export declare function TclObjUnsetVar2(interp: interop.PointerConvertible, part1Ptr: interop.PointerConvertible, part2Ptr: interop.PointerConvertible, flags: number): number;

export declare function TclParseBackslash(src: string, numBytes: number, readPtr: interop.PointerConvertible, dst: string): number;

export declare function TclParseHex(src: string, numBytes: number, resultPtr: interop.PointerConvertible): number;

export declare function TclParseNumber(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, expected: string, bytes: string, numBytes: number, endPtrPtr: interop.PointerConvertible, flags: number): number;

export declare function TclParseInit(interp: interop.PointerConvertible, string: string, numBytes: number, parsePtr: interop.PointerConvertible): void;

export declare function TclParseAllWhiteSpace(src: string, numBytes: number): number;

export declare function TclProcessReturn(interp: interop.PointerConvertible, code: number, level: number, returnOpts: interop.PointerConvertible): number;

export declare function TclpGetCStackParams(stackBoundPtr: interop.PointerConvertible): number;

export declare function TclpObjLstat(pathPtr: interop.PointerConvertible, buf: interop.PointerConvertible): number;

export declare function TclpTempFileName(): interop.Pointer;

export declare function TclNewFSPathObj(dirPtr: interop.PointerConvertible, addStrRep: string, len: number): interop.Pointer;

export declare function TclpDeleteFile(path: string): number;

export declare function TclpFinalizeCondition(condPtr: interop.PointerConvertible): void;

export declare function TclpFinalizeMutex(mutexPtr: interop.PointerConvertible): void;

export declare function TclpFinalizePipes(): void;

export declare function TclpFinalizeSockets(): void;

export declare function TclpThreadCreate(idPtr: interop.PointerConvertible, proc: (p1: interop.PointerConvertible) => void, clientData: interop.PointerConvertible, stackSize: number, flags: number): number;

export declare function TclpFindVariable(name: string, lengthPtr: interop.PointerConvertible): number;

export declare function TclpInitLibraryPath(valuePtr: interop.PointerConvertible, lengthPtr: interop.PointerConvertible, encodingPtr: interop.PointerConvertible): void;

export declare function TclpInitLock(): void;

export declare function TclpInitPlatform(): void;

export declare function TclpInitUnlock(): void;

export declare function TclpLoadFile(interp: interop.PointerConvertible, pathPtr: interop.PointerConvertible, sym1: string, sym2: string, proc1Ptr: interop.PointerConvertible, proc2Ptr: interop.PointerConvertible, clientDataPtr: interop.PointerConvertible, unloadProcPtr: interop.PointerConvertible): number;

export declare function TclpObjListVolumes(): interop.Pointer;

export declare function TclpMasterLock(): void;

export declare function TclpMasterUnlock(): void;

export declare function TclpMatchFiles(interp: interop.PointerConvertible, separators: string, dirPtr: interop.PointerConvertible, pattern: string, tail: string): number;

export declare function TclpObjNormalizePath(interp: interop.PointerConvertible, pathPtr: interop.PointerConvertible, nextCheckpoint: number): number;

export declare function TclpNativeJoinPath(prefix: interop.PointerConvertible, joining: string): void;

export declare function TclpNativeSplitPath(pathPtr: interop.PointerConvertible, lenPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclpGetNativePathType(pathPtr: interop.PointerConvertible, driveNameLengthPtr: interop.PointerConvertible, driveNameRef: interop.PointerConvertible): interop.Enum<typeof Tcl_PathType>;

export declare function TclCrossFilesystemCopy(interp: interop.PointerConvertible, source: interop.PointerConvertible, target: interop.PointerConvertible): number;

export declare function TclpMatchInDirectory(interp: interop.PointerConvertible, resultPtr: interop.PointerConvertible, pathPtr: interop.PointerConvertible, pattern: string, types: interop.PointerConvertible): number;

export declare function TclpGetNativeCwd(clientData: interop.PointerConvertible): interop.Pointer;

export declare function TclNativeDupInternalRep(p1: interop.PointerConvertible): interop.Pointer;

export declare function TclpObjLink(pathPtr: interop.PointerConvertible, toPtr: interop.PointerConvertible, linkType: number): interop.Pointer;

export declare function TclpObjChdir(pathPtr: interop.PointerConvertible): number;

export declare function TclPathPart(interp: interop.PointerConvertible, pathPtr: interop.PointerConvertible, portion: interop.Enum<typeof Tcl_PathPart>): interop.Pointer;

export declare function TclpReadlink(fileName: string, linkPtr: interop.PointerConvertible): string;

export declare function TclpSetInterfaces(): void;

export declare function TclpSetVariables(interp: interop.PointerConvertible): void;

export declare function TclpUnloadFile(loadHandle: interop.PointerConvertible): void;

export declare function TclpThreadDataKeyGet(keyPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclpThreadDataKeySet(keyPtr: interop.PointerConvertible, data: interop.PointerConvertible): void;

export declare function TclpThreadExit(status: number): void;

export declare function TclpThreadGetStackSize(): number;

export declare function TclRememberCondition(mutex: interop.PointerConvertible): void;

export declare function TclRememberJoinableThread(id: interop.PointerConvertible): void;

export declare function TclRememberMutex(mutex: interop.PointerConvertible): void;

export declare function TclRemoveScriptLimitCallbacks(interp: interop.PointerConvertible): void;

export declare function TclReToGlob(interp: interop.PointerConvertible, reStr: string, reStrLen: number, dsPtr: interop.PointerConvertible, flagsPtr: interop.PointerConvertible): number;

export declare function TclSetBgErrorHandler(interp: interop.PointerConvertible, cmdPrefix: interop.PointerConvertible): void;

export declare function TclSetBignumIntRep(objPtr: interop.PointerConvertible, bignumValue: interop.PointerConvertible): void;

export declare function TclSetCmdNameObj(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible): void;

export declare function TclSetProcessGlobalValue(pgvPtr: interop.PointerConvertible, newValue: interop.PointerConvertible, encoding: interop.PointerConvertible): void;

export declare function TclSignalExitThread(id: interop.PointerConvertible, result: number): void;

export declare function TclStackRealloc(interp: interop.PointerConvertible, ptr: interop.PointerConvertible, numBytes: number): interop.Pointer;

export declare function TclStringMatch(str: string, strLen: number, pattern: string, ptnLen: number, flags: number): number;

export declare function TclStringMatchObj(stringObj: interop.PointerConvertible, patternObj: interop.PointerConvertible, flags: number): number;

export declare function TclStringObjReverse(objPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclSubstTokens(interp: interop.PointerConvertible, tokenPtr: interop.PointerConvertible, count: number, tokensLeftPtr: interop.PointerConvertible, line: number, clNextOuter: interop.PointerConvertible, outerScript: string): number;

export declare function TclTransferResult(sourceInterp: interop.PointerConvertible, result: number, targetInterp: interop.PointerConvertible): void;

export declare function TclpNativeToNormalized(clientData: interop.PointerConvertible): interop.Pointer;

export declare function TclpFilesystemPathType(pathPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclpFindSymbol(interp: interop.PointerConvertible, loadHandle: interop.PointerConvertible, symbol: string): (p1: interop.PointerConvertible) => number;

export declare function TclpDlopen(interp: interop.PointerConvertible, pathPtr: interop.PointerConvertible, loadHandle: interop.PointerConvertible, unloadProcPtr: interop.PointerConvertible): number;

export declare function TclpUtime(pathPtr: interop.PointerConvertible, tval: interop.PointerConvertible): number;

export declare function TclpLoadMemoryGetBuffer(interp: interop.PointerConvertible, size: number): interop.Pointer;

export declare function TclpLoadMemory(interp: interop.PointerConvertible, buffer: interop.PointerConvertible, size: number, codeSize: number, loadHandle: interop.PointerConvertible, unloadProcPtr: interop.PointerConvertible): number;

export declare function TclInitThreadStorage(): void;

export declare function TclpFinalizeThreadDataThread(): void;

export declare function TclFinalizeThreadStorage(): void;

export declare function TclpGetWideClicks(): number;

export declare function TclpWideClicksToNanoseconds(clicks: number): number;

export declare function TclDisassembleByteCodeObj(objPtr: interop.PointerConvertible): interop.Pointer;

export declare function Tcl_AfterObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_AppendObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ApplyObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ArrayObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_BinaryObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_BreakObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_CaseObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_CatchObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_CdObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclInitChanCmd(interp: interop.PointerConvertible): interop.Pointer;

export declare function TclChanCreateObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclChanPostEventObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclClockInit(interp: interop.PointerConvertible): void;

export declare function TclClockOldscanObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_CloseObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ConcatObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ContinueObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCreateAbsoluteTimerHandler(timePtr: interop.PointerConvertible, proc: (p1: interop.PointerConvertible) => void, clientData: interop.PointerConvertible): interop.Pointer;

export declare function TclDefaultBgErrorHandlerObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclInitDictCmd(interp: interop.PointerConvertible): interop.Pointer;

export declare function Tcl_DisassembleObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_EncodingObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_EofObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ErrorObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_EvalObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ExecObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ExitObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ExprObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_FblockedObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_FconfigureObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_FcopyObjCmd(dummy: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_FileObjCmd(dummy: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_FileEventObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_FlushObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ForObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ForeachObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_FormatObjCmd(dummy: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_GetsObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_GlobalObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_GlobObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_IfObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_IncrObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclInitInfoCmd(interp: interop.PointerConvertible): interop.Pointer;

export declare function Tcl_InterpObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, argc: number, objv: interop.Pointer): number;

export declare function Tcl_JoinObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LappendObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LassignObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LindexObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LinsertObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LlengthObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ListObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LoadObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LrangeObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LrepeatObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LreplaceObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LreverseObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LsearchObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LsetObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_LsortObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_NamespaceObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_OpenObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_PackageObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_PidObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_PutsObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_PwdObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ReadObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_RegexpObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_RegsubObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_RenameObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ReturnObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_ScanObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_SeekObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_SetObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_SplitObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_SocketObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_SourceObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclInitStringCmd(interp: interop.PointerConvertible): interop.Pointer;

export declare function Tcl_SubstObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_SwitchObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_TellObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_TimeObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_TraceObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_UnloadObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_UnsetObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_UpdateObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_UplevelObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_UpvarObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_VariableObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_VwaitObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function Tcl_WhileObjCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileAppendCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileBreakCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileCatchCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileContinueCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileDictAppendCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileDictForCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileDictGetCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileDictIncrCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileDictLappendCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileDictSetCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileDictUpdateCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileEnsemble(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileExprCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileForCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileForeachCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileGlobalCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileIfCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileInfoExistsCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileIncrCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileLappendCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileLassignCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileLindexCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileListCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileLlengthCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileLsetCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileNamespaceCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileNoOp(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileRegexpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileReturnCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileSetCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileStringCmpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileStringEqualCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileStringIndexCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileStringLenCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileStringMatchCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileSwitchCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileUpvarCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileVariableCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCompileWhileCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclInvertOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileInvertOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclNotOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileNotOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclAddOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileAddOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclMulOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileMulOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclAndOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileAndOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclOrOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileOrOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclXorOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileXorOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclPowOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompilePowOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclLshiftOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileLshiftOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclRshiftOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileRshiftOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclModOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileModOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclNeqOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileNeqOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclStrneqOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileStrneqOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclInOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileInOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclNiOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileNiOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclMinusOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileMinusOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclDivOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileDivOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclLessOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileLessOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclLeqOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileLeqOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclGreaterOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileGreaterOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclGeqOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileGeqOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclEqOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileEqOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclStreqOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclCompileStreqOpCmd(interp: interop.PointerConvertible, parsePtr: interop.PointerConvertible, cmdPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclObjLookupVarEx(interp: interop.PointerConvertible, part1Ptr: interop.PointerConvertible, part2Ptr: interop.PointerConvertible, flags: number, msg: string, createPart1: number, createPart2: number, arrayPtrPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclLookupArrayElement(interp: interop.PointerConvertible, arrayNamePtr: interop.PointerConvertible, elNamePtr: interop.PointerConvertible, flags: number, msg: string, createPart1: number, createPart2: number, arrayPtr: interop.PointerConvertible, index: number): interop.Pointer;

export declare function TclPtrGetVar(interp: interop.PointerConvertible, varPtr: interop.PointerConvertible, arrayPtr: interop.PointerConvertible, part1Ptr: interop.PointerConvertible, part2Ptr: interop.PointerConvertible, flags: number, index: number): interop.Pointer;

export declare function TclPtrSetVar(interp: interop.PointerConvertible, varPtr: interop.PointerConvertible, arrayPtr: interop.PointerConvertible, part1Ptr: interop.PointerConvertible, part2Ptr: interop.PointerConvertible, newValuePtr: interop.PointerConvertible, flags: number, index: number): interop.Pointer;

export declare function TclPtrIncrObjVar(interp: interop.PointerConvertible, varPtr: interop.PointerConvertible, arrayPtr: interop.PointerConvertible, part1Ptr: interop.PointerConvertible, part2Ptr: interop.PointerConvertible, incrPtr: interop.PointerConvertible, flags: number, index: number): interop.Pointer;

export declare function TclPtrObjMakeUpvar(interp: interop.PointerConvertible, otherPtr: interop.PointerConvertible, myNamePtr: interop.PointerConvertible, myFlags: number, index: number): number;

export declare function TclInvalidateNsPath(nsPtr: interop.PointerConvertible): void;

export declare function TclObjCallVarTraces(iPtr: interop.PointerConvertible, arrayPtr: interop.PointerConvertible, varPtr: interop.PointerConvertible, part1Ptr: interop.PointerConvertible, part2Ptr: interop.PointerConvertible, flags: number, leaveErrMsg: number, index: number): number;

export declare function TclCompareObjKeys(keyPtr: interop.PointerConvertible, hPtr: interop.PointerConvertible): number;

export declare function TclFreeObjEntry(hPtr: interop.PointerConvertible): void;

export declare function TclHashObjKey(tablePtr: interop.PointerConvertible, keyPtr: interop.PointerConvertible): number;

export declare function TclThreadAllocObj(): interop.Pointer;

export declare function TclThreadFreeObj(p1: interop.PointerConvertible): void;

export declare function TclpNewAllocMutex(): interop.Pointer;

export declare function TclFreeAllocCache(p1: interop.PointerConvertible): void;

export declare function TclpGetAllocCache(): interop.Pointer;

export declare function TclpSetAllocCache(p1: interop.PointerConvertible): void;

export declare function TclpFreeAllocMutex(mutex: interop.PointerConvertible): void;

export declare function TclpFreeAllocCache(p1: interop.PointerConvertible): void;

export declare function TclTommath_Init(interp: interop.PointerConvertible): number;

export declare function TclBNInitBignumFromLong(bignum: interop.PointerConvertible, initVal: number): void;

export declare function TclBNInitBignumFromWideInt(bignum: interop.PointerConvertible, initVal: number): void;

export declare function TclBNInitBignumFromWideUInt(bignum: interop.PointerConvertible, initVal: number): void;

export declare function TclAllocateFreeObjects(): void;

export declare function TclCleanupChildren(interp: interop.PointerConvertible, numPids: number, pidPtr: interop.PointerConvertible, errorChan: interop.PointerConvertible): number;

export declare function TclCleanupCommand(cmdPtr: interop.PointerConvertible): void;

export declare function TclCopyAndCollapse(count: number, src: string, dst: string): number;

export declare function TclCopyChannel(interp: interop.PointerConvertible, inChan: interop.PointerConvertible, outChan: interop.PointerConvertible, toRead: number, cmdPtr: interop.PointerConvertible): number;

export declare function TclCreatePipeline(interp: interop.PointerConvertible, argc: number, argv: interop.PointerConvertible, pidArrayPtr: interop.PointerConvertible, inPipePtr: interop.PointerConvertible, outPipePtr: interop.PointerConvertible, errFilePtr: interop.PointerConvertible): number;

export declare function TclCreateProc(interp: interop.PointerConvertible, nsPtr: interop.PointerConvertible, procName: string, argsPtr: interop.PointerConvertible, bodyPtr: interop.PointerConvertible, procPtrPtr: interop.PointerConvertible): number;

export declare function TclDeleteCompiledLocalVars(iPtr: interop.PointerConvertible, framePtr: interop.PointerConvertible): void;

export declare function TclDeleteVars(iPtr: interop.PointerConvertible, tablePtr: interop.PointerConvertible): void;

export declare function TclDumpMemoryInfo(outFile: interop.PointerConvertible): void;

export declare function TclExprFloatError(interp: interop.PointerConvertible, value: number): void;

export declare function TclFindElement(interp: interop.PointerConvertible, listStr: string, listLength: number, elementPtr: interop.PointerConvertible, nextPtr: interop.PointerConvertible, sizePtr: interop.PointerConvertible, bracePtr: interop.PointerConvertible): number;

export declare function TclFindProc(iPtr: interop.PointerConvertible, procName: string): interop.Pointer;

export declare function TclFreePackageInfo(iPtr: interop.PointerConvertible): void;

export declare function TclpGetDefaultStdChannel(type: number): interop.Pointer;

export declare function TclGetExtension(name: string): string;

export declare function TclGetFrame(interp: interop.PointerConvertible, str: string, framePtrPtr: interop.PointerConvertible): number;

export declare function TclGetIntForIndex(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, endValue: number, indexPtr: interop.PointerConvertible): number;

export declare function TclGetLong(interp: interop.PointerConvertible, str: string, longPtr: interop.PointerConvertible): number;

export declare function TclGetLoadedPackages(interp: interop.PointerConvertible, targetName: string): number;

export declare function TclGetNamespaceForQualName(interp: interop.PointerConvertible, qualName: string, cxtNsPtr: interop.PointerConvertible, flags: number, nsPtrPtr: interop.PointerConvertible, altNsPtrPtr: interop.PointerConvertible, actualCxtPtrPtr: interop.PointerConvertible, simpleNamePtr: interop.PointerConvertible): number;

export declare function TclGetObjInterpProc(): (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number;

export declare function TclGetOpenMode(interp: interop.PointerConvertible, str: string, seekFlagPtr: interop.PointerConvertible): number;

export declare function TclGetOriginalCommand(command: interop.PointerConvertible): interop.Pointer;

export declare function TclpGetUserHome(name: string, bufferPtr: interop.PointerConvertible): string;

export declare function TclGuessPackageName(fileName: string, bufPtr: interop.PointerConvertible): number;

export declare function TclHideUnsafeCommands(interp: interop.PointerConvertible): number;

export declare function TclInExit(): number;

export declare function TclInitCompiledLocals(interp: interop.PointerConvertible, framePtr: interop.PointerConvertible, nsPtr: interop.PointerConvertible): void;

export declare function TclInterpInit(interp: interop.PointerConvertible): number;

export declare function TclInvokeObjectCommand(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, argc: number, argv: interop.PointerConvertible): number;

export declare function TclInvokeStringCommand(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclIsProc(cmdPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclLookupVar(interp: interop.PointerConvertible, part1: string, part2: string, flags: number, msg: string, createPart1: number, createPart2: number, arrayPtrPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclNeedSpace(start: string, end: string): number;

export declare function TclNewProcBodyObj(procPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclObjCommandComplete(cmdPtr: interop.PointerConvertible): number;

export declare function TclObjInterpProc(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclObjInvoke(interp: interop.PointerConvertible, objc: number, objv: interop.Pointer, flags: number): number;

export declare function TclpAlloc(size: number): string;

export declare function TclpFree(ptr: string): void;

export declare function TclpGetClicks(): number;

export declare function TclpGetSeconds(): number;

export declare function TclpGetTime(time: interop.PointerConvertible): void;

export declare function TclpGetTimeZone(time: number): number;

export declare function TclpRealloc(ptr: string, size: number): string;

export declare function TclPrecTraceProc(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, name1: string, name2: string, flags: number): string;

export declare function TclPreventAliasLoop(interp: interop.PointerConvertible, cmdInterp: interop.PointerConvertible, cmd: interop.PointerConvertible): number;

export declare function TclProcCleanupProc(procPtr: interop.PointerConvertible): void;

export declare function TclProcCompileProc(interp: interop.PointerConvertible, procPtr: interop.PointerConvertible, bodyPtr: interop.PointerConvertible, nsPtr: interop.PointerConvertible, description: string, procName: string): number;

export declare function TclProcDeleteProc(clientData: interop.PointerConvertible): void;

export declare function TclRenameCommand(interp: interop.PointerConvertible, oldName: string, newName: string): number;

export declare function TclResetShadowedCmdRefs(interp: interop.PointerConvertible, newCmdPtr: interop.PointerConvertible): void;

export declare function TclServiceIdle(): number;

export declare function TclSetPreInitScript(string: string): string;

export declare function TclSetupEnv(interp: interop.PointerConvertible): void;

export declare function TclSockGetPort(interp: interop.PointerConvertible, str: string, proto: string, portPtr: interop.PointerConvertible): number;

export declare function TclSockMinimumBuffers(sock: number, size: number): number;

export declare function TclTeardownNamespace(nsPtr: interop.PointerConvertible): void;

export declare function TclUpdateReturnInfo(iPtr: interop.PointerConvertible): number;

export declare function Tcl_AddInterpResolvers(interp: interop.PointerConvertible, name: string, cmdProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number, varProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number, compiledVarProc: (p1: interop.PointerConvertible, p2: string, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): void;

export declare function Tcl_GetInterpResolvers(interp: interop.PointerConvertible, name: string, resInfo: interop.PointerConvertible): number;

export declare function Tcl_GetNamespaceResolvers(namespacePtr: interop.PointerConvertible, resInfo: interop.PointerConvertible): number;

export declare function Tcl_FindNamespaceVar(interp: interop.PointerConvertible, name: string, contextNsPtr: interop.PointerConvertible, flags: number): interop.Pointer;

export declare function Tcl_GetVariableFullName(interp: interop.PointerConvertible, variable: interop.PointerConvertible, objPtr: interop.PointerConvertible): void;

export declare function Tcl_PopCallFrame(interp: interop.PointerConvertible): void;

export declare function Tcl_PushCallFrame(interp: interop.PointerConvertible, framePtr: interop.PointerConvertible, nsPtr: interop.PointerConvertible, isProcCallFrame: number): number;

export declare function Tcl_RemoveInterpResolvers(interp: interop.PointerConvertible, name: string): number;

export declare function Tcl_SetNamespaceResolvers(namespacePtr: interop.PointerConvertible, cmdProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number, varProc: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number, compiledVarProc: (p1: interop.PointerConvertible, p2: string, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => number): void;

export declare function TclpHasSockets(interp: interop.PointerConvertible): number;

export declare function TclpGetDate(time: interop.PointerConvertible, useGMT: number): interop.Pointer;

export declare function TclGetEnv(name: string, valuePtr: interop.PointerConvertible): string;

export declare function TclpGetCwd(interp: interop.PointerConvertible, cwdPtr: interop.PointerConvertible): string;

export declare function TclSetByteCodeFromAny(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, hookProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, clientData: interop.PointerConvertible): number;

export declare function TclAddLiteralObj(envPtr: interop.PointerConvertible, objPtr: interop.PointerConvertible, litPtrPtr: interop.PointerConvertible): number;

export declare function TclHideLiteral(interp: interop.PointerConvertible, envPtr: interop.PointerConvertible, index: number): void;

export declare function TclGetAuxDataType(typeName: string): interop.Pointer;

export declare function TclHandleCreate(ptr: interop.PointerConvertible): interop.Pointer;

export declare function TclHandleFree(handle: interop.PointerConvertible): void;

export declare function TclHandlePreserve(handle: interop.PointerConvertible): interop.Pointer;

export declare function TclHandleRelease(handle: interop.PointerConvertible): void;

export declare function TclRegAbout(interp: interop.PointerConvertible, re: interop.PointerConvertible): number;

export declare function TclRegExpRangeUniChar(re: interop.PointerConvertible, index: number, startPtr: interop.PointerConvertible, endPtr: interop.PointerConvertible): void;

export declare function TclSetLibraryPath(pathPtr: interop.PointerConvertible): void;

export declare function TclGetLibraryPath(): interop.Pointer;

export declare function TclRegError(interp: interop.PointerConvertible, msg: string, status: number): void;

export declare function TclVarTraceExists(interp: interop.PointerConvertible, varName: string): interop.Pointer;

export declare function TclSetStartupScriptFileName(filename: string): void;

export declare function TclGetStartupScriptFileName(): string;

export declare function TclChannelTransform(interp: interop.PointerConvertible, chan: interop.PointerConvertible, cmdObjPtr: interop.PointerConvertible): number;

export declare function TclChannelEventScriptInvoker(clientData: interop.PointerConvertible, flags: number): void;

export declare function TclGetInstructionTable(): interop.Pointer;

export declare function TclExpandCodeArray(envPtr: interop.PointerConvertible): void;

export declare function TclpSetInitialEncodings(): void;

export declare function TclListObjSetElement(interp: interop.PointerConvertible, listPtr: interop.PointerConvertible, index: number, valuePtr: interop.PointerConvertible): number;

export declare function TclSetStartupScriptPath(pathPtr: interop.PointerConvertible): void;

export declare function TclGetStartupScriptPath(): interop.Pointer;

export declare function TclpUtfNcmp2(s1: string, s2: string, n: number): number;

export declare function TclCheckInterpTraces(interp: interop.PointerConvertible, command: string, numChars: number, cmdPtr: interop.PointerConvertible, result: number, traceFlags: number, objc: number, objv: interop.Pointer): number;

export declare function TclCheckExecutionTraces(interp: interop.PointerConvertible, command: string, numChars: number, cmdPtr: interop.PointerConvertible, result: number, traceFlags: number, objc: number, objv: interop.Pointer): number;

export declare function TclInThreadExit(): number;

export declare function TclUniCharMatch(string: interop.PointerConvertible, strLen: number, pattern: interop.PointerConvertible, ptnLen: number, flags: number): number;

export declare function TclCallVarTraces(iPtr: interop.PointerConvertible, arrayPtr: interop.PointerConvertible, varPtr: interop.PointerConvertible, part1: string, part2: string, flags: number, leaveErrMsg: number): number;

export declare function TclCleanupVar(varPtr: interop.PointerConvertible, arrayPtr: interop.PointerConvertible): void;

export declare function TclVarErrMsg(interp: interop.PointerConvertible, part1: string, part2: string, operation: string, reason: string): void;

export declare function Tcl_SetStartupScript(pathPtr: interop.PointerConvertible, encodingName: string): void;

export declare function Tcl_GetStartupScript(encodingNamePtr: interop.PointerConvertible): interop.Pointer;

export declare function TclpLocaltime(clock: interop.PointerConvertible): interop.Pointer;

export declare function TclpGmtime(clock: interop.PointerConvertible): interop.Pointer;

export declare function TclObjGetFrame(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, framePtrPtr: interop.PointerConvertible): number;

export declare function TclpObjRemoveDirectory(pathPtr: interop.PointerConvertible, recursive: number, errorPtr: interop.PointerConvertible): number;

export declare function TclpObjCopyDirectory(srcPathPtr: interop.PointerConvertible, destPathPtr: interop.PointerConvertible, errorPtr: interop.PointerConvertible): number;

export declare function TclpObjCreateDirectory(pathPtr: interop.PointerConvertible): number;

export declare function TclpObjDeleteFile(pathPtr: interop.PointerConvertible): number;

export declare function TclpObjCopyFile(srcPathPtr: interop.PointerConvertible, destPathPtr: interop.PointerConvertible): number;

export declare function TclpObjRenameFile(srcPathPtr: interop.PointerConvertible, destPathPtr: interop.PointerConvertible): number;

export declare function TclpObjStat(pathPtr: interop.PointerConvertible, buf: interop.PointerConvertible): number;

export declare function TclpObjAccess(pathPtr: interop.PointerConvertible, mode: number): number;

export declare function TclpOpenFileChannel(interp: interop.PointerConvertible, pathPtr: interop.PointerConvertible, mode: number, permissions: number): interop.Pointer;

export declare function TclpFindExecutable(argv0: string): void;

export declare function TclGetObjNameOfExecutable(): interop.Pointer;

export declare function TclSetObjNameOfExecutable(name: interop.PointerConvertible, encoding: interop.PointerConvertible): void;

export declare function TclStackAlloc(interp: interop.PointerConvertible, numBytes: number): interop.Pointer;

export declare function TclStackFree(interp: interop.PointerConvertible, freePtr: interop.PointerConvertible): void;

export declare function TclPushStackFrame(interp: interop.PointerConvertible, framePtrPtr: interop.PointerConvertible, namespacePtr: interop.PointerConvertible, isProcCallFrame: number): number;

export declare function TclPopStackFrame(interp: interop.PointerConvertible): void;

export declare function TclGetPlatform(): interop.Pointer;

export declare function TclTraceDictPath(interp: interop.PointerConvertible, rootPtr: interop.PointerConvertible, keyc: number, keyv: interop.Pointer, flags: number): interop.Pointer;

export declare function TclObjBeingDeleted(objPtr: interop.PointerConvertible): number;

export declare function TclSetNsPath(nsPtr: interop.PointerConvertible, pathLength: number, pathAry: interop.Pointer): void;

export declare function TclObjInterpProcCore(interp: interop.PointerConvertible, procNameObj: interop.PointerConvertible, skip: number, errorProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): number;

export declare function TclPtrMakeUpvar(interp: interop.PointerConvertible, otherP1Ptr: interop.PointerConvertible, myName: string, myFlags: number, index: number): number;

export declare function TclObjLookupVar(interp: interop.PointerConvertible, part1Ptr: interop.PointerConvertible, part2: string, flags: number, msg: string, createPart1: number, createPart2: number, arrayPtrPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclGetNamespaceFromObj(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, nsPtrPtr: interop.PointerConvertible): number;

export declare function TclEvalObjEx(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, flags: number, invoker: interop.PointerConvertible, word: number): number;

export declare function TclGetSrcInfoForPc(contextPtr: interop.PointerConvertible): void;

export declare function TclVarHashCreateVar(tablePtr: interop.PointerConvertible, key: string, newPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclInitVarHashTable(tablePtr: interop.PointerConvertible, nsPtr: interop.PointerConvertible): void;

export declare function TclBackgroundException(interp: interop.PointerConvertible, code: number): void;

export declare function TclDbDumpActiveObjects(outFile: interop.PointerConvertible): void;

export declare function TclGetAndDetachPids(interp: interop.PointerConvertible, chan: interop.PointerConvertible): void;

export declare function TclpCloseFile(file: interop.PointerConvertible): number;

export declare function TclpCreateCommandChannel(readFile: interop.PointerConvertible, writeFile: interop.PointerConvertible, errorFile: interop.PointerConvertible, numPids: number, pidPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclpCreatePipe(readPipe: interop.PointerConvertible, writePipe: interop.PointerConvertible): number;

export declare function TclpCreateProcess(interp: interop.PointerConvertible, argc: number, argv: interop.PointerConvertible, inputFile: interop.PointerConvertible, outputFile: interop.PointerConvertible, errorFile: interop.PointerConvertible, pidPtr: interop.PointerConvertible): number;

export declare function TclpMakeFile(channel: interop.PointerConvertible, direction: number): interop.Pointer;

export declare function TclpOpenFile(fname: string, mode: number): interop.Pointer;

export declare function TclUnixWaitForFile(fd: number, mask: number, timeout: number): number;

export declare function TclpCreateTempFile(contents: string): interop.Pointer;

export declare function TclpReaddir(dir: interop.PointerConvertible): interop.Pointer;

export declare function TclpLocaltime_unix(clock: interop.PointerConvertible): interop.Pointer;

export declare function TclpGmtime_unix(clock: interop.PointerConvertible): interop.Pointer;

export declare function TclpInetNtoa(addr: in_addr): string;

export declare function TclUnixCopyFile(src: string, dst: string, statBufPtr: interop.PointerConvertible, dontCopyAtts: number): number;

export declare function TclMacOSXGetFileAttribute(interp: interop.PointerConvertible, objIndex: number, fileName: interop.PointerConvertible, attributePtrPtr: interop.PointerConvertible): number;

export declare function TclMacOSXSetFileAttribute(interp: interop.PointerConvertible, objIndex: number, fileName: interop.PointerConvertible, attributePtr: interop.PointerConvertible): number;

export declare function TclMacOSXCopyFileAttributes(src: string, dst: string, statBufPtr: interop.PointerConvertible): number;

export declare function TclMacOSXMatchType(interp: interop.PointerConvertible, pathName: string, fileName: string, statBufPtr: interop.PointerConvertible, types: interop.PointerConvertible): number;

export declare function TclMacOSXNotifierAddRunLoopMode(runLoopMode: interop.PointerConvertible): void;

export declare function TclEvalObjvInternal(interp: interop.PointerConvertible, objc: number, objv: interop.Pointer, command: string, length: number, flags: number): number;

export declare function TclCompEvalObj(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible, invoker: interop.PointerConvertible, word: number): number;

export declare function TclCleanupByteCode(codePtr: interop.PointerConvertible): void;

export declare function TclCompileCmdWord(interp: interop.PointerConvertible, tokenPtr: interop.PointerConvertible, count: number, envPtr: interop.PointerConvertible): void;

export declare function TclCompileExpr(interp: interop.PointerConvertible, script: string, numBytes: number, envPtr: interop.PointerConvertible, optimize: number): void;

export declare function TclCompileExprWords(interp: interop.PointerConvertible, tokenPtr: interop.PointerConvertible, numWords: number, envPtr: interop.PointerConvertible): void;

export declare function TclCompileScript(interp: interop.PointerConvertible, script: string, numBytes: number, envPtr: interop.PointerConvertible): void;

export declare function TclCompileSyntaxError(interp: interop.PointerConvertible, envPtr: interop.PointerConvertible): void;

export declare function TclCompileTokens(interp: interop.PointerConvertible, tokenPtr: interop.PointerConvertible, count: number, envPtr: interop.PointerConvertible): void;

export declare function TclCreateAuxData(clientData: interop.PointerConvertible, typePtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): number;

export declare function TclCreateExceptRange(type: interop.Enum<typeof ExceptionRangeType>, envPtr: interop.PointerConvertible): number;

export declare function TclCreateExecEnv(interp: interop.PointerConvertible): interop.Pointer;

export declare function TclCreateLiteral(iPtr: interop.PointerConvertible, bytes: string, length: number, hash: number, newPtr: interop.PointerConvertible, nsPtr: interop.PointerConvertible, flags: number, globalPtrPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclDeleteExecEnv(eePtr: interop.PointerConvertible): void;

export declare function TclDeleteLiteralTable(interp: interop.PointerConvertible, tablePtr: interop.PointerConvertible): void;

export declare function TclEmitForwardJump(envPtr: interop.PointerConvertible, jumpType: interop.Enum<typeof TclJumpType>, jumpFixupPtr: interop.PointerConvertible): void;

export declare function TclGetExceptionRangeForPc(pc: interop.PointerConvertible, catchOnly: number, codePtr: interop.PointerConvertible): interop.Pointer;

export declare function TclExpandJumpFixupArray(fixupArrayPtr: interop.PointerConvertible): void;

export declare function TclExecuteByteCode(interp: interop.PointerConvertible, codePtr: interop.PointerConvertible): number;

export declare function TclFinalizeAuxDataTypeTable(): void;

export declare function TclFindCompiledLocal(name: string, nameChars: number, create: number, procPtr: interop.PointerConvertible): number;

export declare function TclLookupLiteralEntry(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible): interop.Pointer;

export declare function TclFixupForwardJump(envPtr: interop.PointerConvertible, jumpFixupPtr: interop.PointerConvertible, jumpDist: number, distThreshold: number): number;

export declare function TclFreeCompileEnv(envPtr: interop.PointerConvertible): void;

export declare function TclFreeJumpFixupArray(fixupArrayPtr: interop.PointerConvertible): void;

export declare function TclInitAuxDataTypeTable(): void;

export declare function TclInitByteCodeObj(objPtr: interop.PointerConvertible, envPtr: interop.PointerConvertible): void;

export declare function TclInitCompilation(): void;

export declare function TclInitCompileEnv(interp: interop.PointerConvertible, envPtr: interop.PointerConvertible, string: string, numBytes: number, invoker: interop.PointerConvertible, word: number): void;

export declare function TclInitJumpFixupArray(fixupArrayPtr: interop.PointerConvertible): void;

export declare function TclInitLiteralTable(tablePtr: interop.PointerConvertible): void;

export declare function TclPrintInstruction(codePtr: interop.PointerConvertible, pc: interop.PointerConvertible): number;

export declare function TclPrintObject(outFile: interop.PointerConvertible, objPtr: interop.PointerConvertible, maxChars: number): void;

export declare function TclPrintSource(outFile: interop.PointerConvertible, string: string, maxChars: number): void;

export declare function TclRegisterAuxDataType(typePtr: interop.PointerConvertible): void;

export declare function TclRegisterLiteral(envPtr: interop.PointerConvertible, bytes: string, length: number, flags: number): number;

export declare function TclReleaseLiteral(interp: interop.PointerConvertible, objPtr: interop.PointerConvertible): void;

export declare function TclSingleOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclSortingOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclVariadicOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclNoIdentOpCmd(clientData: interop.PointerConvertible, interp: interop.PointerConvertible, objc: number, objv: interop.Pointer): number;

export declare function TclWordKnownAtCompileTime(tokenPtr: interop.PointerConvertible, valuePtr: interop.PointerConvertible): number;

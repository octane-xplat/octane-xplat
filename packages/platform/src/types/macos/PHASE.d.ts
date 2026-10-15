export declare const PHASESpatialCategoryLateReverb: string;

export declare const PHASESpatialCategoryEarlyReflections: string;

export declare const PHASEErrorDomain: string;

export declare const PHASESpatialCategoryDirectPathTransmission: string;

export declare const PHASEAssetErrorDomain: string;

export declare const PHASESoundEventErrorDomain: string;

export declare const PHASEMaterialPreset: {
  Cardboard: 1833136740,
  Glass: 1833397363,
  Brick: 1833071211,
  Concrete: 1833132914,
  Drywall: 1833202295,
  Wood: 1834448228,
};

export declare const PHASEPushStreamBufferOptions: {
  Default: 1,
  Loops: 2,
  Interrupts: 4,
  InterruptsAtLoop: 8,
};

export declare const PHASEPlaybackMode: {
  OneShot: 0,
  Looping: 1,
};

export declare const PHASECullOption: {
  Terminate: 0,
  SleepWakeAtZero: 1,
  SleepWakeAtRandomOffset: 2,
  SleepWakeAtRealtimeOffset: 3,
  DoNotCull: 4,
};

export declare const PHASESoundEventPrepareState: {
  PrepareNotStarted: 0,
  PrepareInProgress: 1,
  Prepared: 2,
};

export declare const PHASESoundEventPrepareHandlerReason: {
  Failure: 0,
  Prepared: 1,
  Terminated: 2,
};

export declare const PHASEAssetError: {
  FailedToLoad: 1346920801,
  InvalidEngineInstance: 1346920802,
  BadParameters: 1346920803,
  AlreadyExists: 1346920804,
  GeneralError: 1346920805,
  MemoryAllocation: 1346920806,
};

export declare const PHASESoundEventError: {
  NotFound: 1346925665,
  BadData: 1346925666,
  InvalidInstance: 1346925667,
  APIMisuse: 1346925668,
  SystemNotInitialized: 1346925669,
  OutOfMemory: 1346925670,
};

export declare const PHASEError: {
  InitializeFailed: 1346913633,
  InvalidObject: 1346913634,
};

export declare const PHASESpatializationMode: {
  Automatic: 0,
  AlwaysUseBinaural: 1,
  AlwaysUseChannelBased: 2,
};

export declare const PHASERenderingState: {
  Stopped: 0,
  Started: 1,
  Paused: 2,
};

export declare const PHASEUpdateMode: {
  Automatic: 0,
  Manual: 1,
};

export declare const PHASENormalizationMode: {
  None: 0,
  Dynamic: 1,
};

export declare const PHASEMediumPreset: {
  PHASEMediumPresetAir: 1835286898,
};

export declare const PHASECalibrationMode: {
  None: 0,
  RelativeSpl: 1,
  AbsoluteSpl: 2,
};

export declare const PHASECurveType: {
  Linear: 1668435054,
  Squared: 1668436849,
  InverseSquared: 1668434257,
  Cubed: 1668432757,
  InverseCubed: 1668434243,
  Sine: 1668436846,
  InverseSine: 1668434259,
  Sigmoid: 1668436839,
  InverseSigmoid: 1668434247,
  HoldStartValue: 1668434003,
  JumpToEndValue: 1668434501,
};

export declare const PHASESpatialPipelineFlags: {
  DirectPathTransmission: 1,
  EarlyReflections: 2,
  LateReverb: 4,
};

export declare const PHASEAssetType: {
  Resident: 0,
  Streamed: 1,
};

export declare const PHASEPushStreamCompletionCallbackCondition: {
  PHASEPushStreamCompletionDataRendered: 0,
};

export declare const PHASESoundEventStartHandlerReason: {
  Failure: 0,
  FinishedPlaying: 1,
  Terminated: 2,
};

export declare const PHASEReverbPreset: {
  None: 1917742958,
  SmallRoom: 1918063213,
  MediumRoom: 1917669997,
  LargeRoom: 1917604401,
  LargeRoom2: 1917604402,
  MediumChamber: 1917666152,
  LargeChamber: 1917600616,
  MediumHall: 1917667377,
  MediumHall2: 1917667378,
  MediumHall3: 1917667379,
  LargeHall: 1917601841,
  LargeHall2: 1917601842,
  Cathedral: 1917023336,
};

export declare const PHASESoundEventSeekHandlerReason: {
  Failure: 0,
  FailureSeekAlreadyInProgress: 1,
  SeekSuccessful: 2,
};

/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />
/// <reference path="./Foundation.d.ts" />

declare function _MXSignpostMetricsSnapshot(): interop.Pointer

declare class MXMetricPayload extends NSObject implements NSSecureCoding {
	readonly latestApplicationVersion: string

	readonly includesMultipleApplicationVersions: boolean

	readonly timeStampBegin: NSDate

	readonly timeStampEnd: NSDate

	readonly cpuMetrics: MXCPUMetric

	readonly gpuMetrics: MXGPUMetric

	readonly cellularConditionMetrics: MXCellularConditionMetric

	readonly applicationTimeMetrics: MXAppRunTimeMetric

	readonly locationActivityMetrics: MXLocationActivityMetric

	readonly networkTransferMetrics: MXNetworkTransferMetric

	readonly applicationLaunchMetrics: MXAppLaunchMetric

	readonly applicationResponsivenessMetrics: MXAppResponsivenessMetric

	readonly diskIOMetrics: MXDiskIOMetric

	readonly memoryMetrics: MXMemoryMetric

	readonly displayMetrics: MXDisplayMetric

	readonly animationMetrics: MXAnimationMetric

	readonly applicationExitMetrics: MXAppExitMetric

	readonly signpostMetrics: NSArray

	readonly metaData: MXMetaData

	JSONRepresentation(): NSData

	dictionaryRepresentation(): NSDictionary

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class MXMemoryMetric extends MXMetric {
	readonly peakMemoryUsage: NSMeasurement

	readonly averageSuspendedMemory: MXAverage
}

declare class MXAppResponsivenessMetric extends MXMetric {
	readonly histogrammedApplicationHangTime: MXHistogram
}

declare class MXLocationActivityMetric extends MXMetric {
	readonly cumulativeBestAccuracyTime: NSMeasurement

	readonly cumulativeBestAccuracyForNavigationTime: NSMeasurement

	readonly cumulativeNearestTenMetersAccuracyTime: NSMeasurement

	readonly cumulativeHundredMetersAccuracyTime: NSMeasurement

	readonly cumulativeKilometerAccuracyTime: NSMeasurement

	readonly cumulativeThreeKilometersAccuracyTime: NSMeasurement
}

declare class MXUnitAveragePixelLuminance extends NSDimension {
	static readonly apl: MXUnitAveragePixelLuminance
}

declare class MXUnitSignalBars extends NSDimension {
	static readonly bars: MXUnitSignalBars
}

declare class MXGPUMetric extends MXMetric {
	readonly cumulativeGPUTime: NSMeasurement
}

declare class MXAppLaunchMetric extends MXMetric {
	readonly histogrammedTimeToFirstDraw: MXHistogram

	readonly histogrammedApplicationResumeTime: MXHistogram
}

declare class MXAppRunTimeMetric extends MXMetric {
	readonly cumulativeForegroundTime: NSMeasurement

	readonly cumulativeBackgroundTime: NSMeasurement

	readonly cumulativeBackgroundAudioTime: NSMeasurement

	readonly cumulativeBackgroundLocationTime: NSMeasurement
}

declare class MXSignpostIntervalData extends NSObject implements NSSecureCoding {
	readonly histogrammedSignpostDuration: MXHistogram

	readonly cumulativeCPUTime: NSMeasurement

	readonly averageMemory: MXAverage

	readonly cumulativeLogicalWrites: NSMeasurement

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class MXNetworkTransferMetric extends MXMetric {
	readonly cumulativeWifiUpload: NSMeasurement

	readonly cumulativeWifiDownload: NSMeasurement

	readonly cumulativeCellularUpload: NSMeasurement

	readonly cumulativeCellularDownload: NSMeasurement
}

declare class MXForegroundExitData extends NSObject implements NSSecureCoding {
	readonly cumulativeNormalAppExitCount: number

	readonly cumulativeMemoryResourceLimitExitCount: number

	readonly cumulativeBadAccessExitCount: number

	readonly cumulativeAbnormalExitCount: number

	readonly cumulativeIllegalInstructionExitCount: number

	readonly cumulativeAppWatchdogExitCount: number

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class MXAppExitMetric extends MXMetric {
	readonly foregroundExitData: MXForegroundExitData

	readonly backgroundExitData: MXBackgroundExitData
}

declare class MXSignpostMetric extends MXMetric {
	readonly signpostName: string

	readonly signpostCategory: string

	readonly signpostIntervalData: MXSignpostIntervalData

	readonly totalCount: number
}

declare class MXAnimationMetric extends MXMetric {
	readonly scrollHitchTimeRatio: NSMeasurement
}

declare class MXMetric extends NSObject implements NSSecureCoding {
	JSONRepresentation(): NSData

	dictionaryRepresentation(): NSDictionary

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class MXCellularConditionMetric extends MXMetric {
	readonly histogrammedCellularConditionTime: MXHistogram
}

declare class MXCPUMetric extends MXMetric {
	readonly cumulativeCPUTime: NSMeasurement

	readonly cumulativeCPUInstructions: NSMeasurement
}

declare class MXBackgroundExitData extends NSObject implements NSSecureCoding {
	readonly cumulativeNormalAppExitCount: number

	readonly cumulativeMemoryResourceLimitExitCount: number

	readonly cumulativeCPUResourceLimitExitCount: number

	readonly cumulativeMemoryPressureExitCount: number

	readonly cumulativeBadAccessExitCount: number

	readonly cumulativeAbnormalExitCount: number

	readonly cumulativeIllegalInstructionExitCount: number

	readonly cumulativeAppWatchdogExitCount: number

	readonly cumulativeSuspendedWithLockedFileExitCount: number

	readonly cumulativeBackgroundTaskAssertionTimeoutExitCount: number

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class MXDisplayMetric extends MXMetric {
	readonly averagePixelLuminance: MXAverage
}

declare class MXDiskIOMetric extends MXMetric {
	readonly cumulativeLogicalWrites: NSMeasurement
}

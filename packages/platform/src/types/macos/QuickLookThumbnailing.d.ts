import type { NSImage } from './AppKit'

import type { CGSize } from './CoreFoundation'

import type { NSCoder, NSCopying, NSError, NSSecureCoding, NSURL } from './Foundation'

import type { UTType } from './UniformTypeIdentifiers'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'



export declare const QLThumbnailErrorDomain: string;

export declare const QLThumbnailError: {
  GenerationFailed: 0,
  SavingToURLFailed: 1,
  NoCachedThumbnail: 2,
  NoCloudThumbnail: 3,
  RequestInvalid: 4,
  RequestCancelled: 5,
};

export declare const QLThumbnailGenerationRequestRepresentationTypes: {
  Icon: 1,
  LowQualityThumbnail: 2,
  Thumbnail: 4,
  All: -1,
};

export declare const QLThumbnailRepresentationType: {
  Icon: 0,
  LowQualityThumbnail: 1,
  Thumbnail: 2,
};

export declare class QLFileThumbnailRequest extends NSObject {
  readonly maximumSize: CGSize;

  readonly minimumSize: CGSize;

  readonly scale: number;

  readonly fileURL: NSURL;
}

export declare class QLThumbnailProvider extends NSObject {
  provideThumbnailForFileRequestCompletionHandler(request: QLFileThumbnailRequest, handler: (p1: QLThumbnailReply, p2: NSError) => void | null): void;
}

export declare class QLThumbnailRepresentation extends NSObject {
  readonly type: interop.Enum<typeof QLThumbnailRepresentationType>;

  readonly CGImage: interop.Object;

  readonly NSImage: NSImage;
}

export declare class QLThumbnailGenerationRequest extends NSObject implements NSCopying, NSSecureCoding {
  initWithFileAtURLSizeScaleRepresentationTypes(url: NSURL, size: CGSize, scale: number, representationTypes: interop.Enum<typeof QLThumbnailGenerationRequestRepresentationTypes>): this;

  contentType: UTType;

  minimumDimension: number;

  iconMode: boolean;

  readonly size: CGSize;

  readonly scale: number;

  readonly representationTypes: interop.Enum<typeof QLThumbnailGenerationRequestRepresentationTypes>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class QLThumbnailReply extends NSObject {
  static replyWithContextSizeDrawingBlock<This extends abstract new (...args: any) => any>(this: This, contextSize: CGSize, drawingBlock: (p1: interop.PointerConvertible) => boolean): InstanceType<This>;

  static replyWithContextSizeCurrentContextDrawingBlock<This extends abstract new (...args: any) => any>(this: This, contextSize: CGSize, drawingBlock: () => boolean): InstanceType<This>;

  static replyWithImageFileURL<This extends abstract new (...args: any) => any>(this: This, fileURL: NSURL): InstanceType<This>;
}

export declare class QLThumbnailGenerator extends NSObject {
  static readonly sharedGenerator: QLThumbnailGenerator;

  generateBestRepresentationForRequestCompletionHandler(request: QLThumbnailGenerationRequest, completionHandler: (p1: QLThumbnailRepresentation, p2: NSError) => void | null): void;

  generateRepresentationsForRequestUpdateHandler(request: QLThumbnailGenerationRequest, updateHandler: (p1: QLThumbnailRepresentation, p2: interop.Enum<typeof QLThumbnailRepresentationType>, p3: NSError) => void | null): void;

  cancelRequest(request: QLThumbnailGenerationRequest): void;

  saveBestRepresentationForRequestToFileAtURLAsContentTypeCompletionHandler(request: QLThumbnailGenerationRequest, fileURL: NSURL, contentType: UTType, completionHandler: (p1: NSError) => void | null): void;

  saveBestRepresentationForRequestToFileAtURLWithContentTypeCompletionHandler(request: QLThumbnailGenerationRequest, fileURL: NSURL, contentType: string, completionHandler: (p1: NSError) => void | null): void;
}

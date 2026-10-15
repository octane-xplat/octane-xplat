import type { CGRect, CGSize } from './CoreFoundation'

import type { NSObject } from './Runtime'

import type { interop } from './objc-runtime'



export declare const kQLThumbnailOptionIconModeKey: interop.Pointer;

export declare const kQLPreviewContentIDScheme: interop.Pointer;

export declare const kQLPreviewPropertyAttachmentsKey: interop.Pointer;

export declare const kQLPreviewPropertyAttachmentDataKey: interop.Pointer;

export declare const kQLPreviewPropertyMIMETypeKey: interop.Pointer;

export declare const kQLPreviewPropertyStringEncodingKey: interop.Pointer;

export declare const kQLPreviewPropertyHeightKey: interop.Pointer;

export declare const kQLThumbnailPropertyBaseBundlePathKey: interop.Pointer;

export declare const kQLThumbnailPropertyExtensionKey: interop.Pointer;

export declare const kQLPreviewPropertyTextEncodingNameKey: interop.Pointer;

export declare const kQLPreviewPropertyBaseBundlePathKey: interop.Pointer;

export declare const kQLPreviewPropertyCursorKey: interop.Pointer;

export declare const kQLThumbnailOptionScaleFactorKey: interop.Pointer;

export declare const kQLPreviewOptionCursorKey: interop.Pointer;

export declare const kQLThumbnailPropertyBadgeImageKey: interop.Pointer;

export declare const kQLPreviewPropertyWidthKey: interop.Pointer;

export declare const kQLPreviewPropertyDisplayNameKey: interop.Pointer;

export declare const kQLPreviewPropertyPDFStyleKey: interop.Pointer;

export declare const QLPreviewPDFStyle: {
  Standard: 0,
  PagesWithThumbnailsOnRight: 3,
  PagesWithThumbnailsOnLeft: 4,
};

export declare class __QLThumbnailRequest {
  constructor(init?: __QLThumbnailRequest);
}

export declare class __QLPreviewRequest {
  constructor(init?: __QLPreviewRequest);
}

export declare class __QLThumbnail {
  constructor(init?: __QLThumbnail);
}

export declare function QLThumbnailRequestGetTypeID(): number;

export declare function QLThumbnailRequestCopyURL(thumbnail: interop.Object): interop.Object;

export declare function QLThumbnailRequestCopyOptions(thumbnail: interop.Object): interop.Object;

export declare function QLThumbnailRequestCopyContentUTI(thumbnail: interop.Object): interop.Object;

export declare function QLThumbnailRequestGetMaximumSize(thumbnail: interop.Object): CGSize;

export declare function QLThumbnailRequestGetGeneratorBundle(thumbnail: interop.Object): interop.Object;

export declare function QLThumbnailRequestSetDocumentObject(thumbnail: interop.Object, object: interop.PointerConvertible, callbacks: interop.PointerConvertible): void;

export declare function QLThumbnailRequestGetDocumentObject(thumbnail: interop.Object): interop.Pointer;

export declare function QLThumbnailRequestSetImage(thumbnail: interop.Object, image: interop.Object, properties: interop.Object): void;

export declare function QLThumbnailRequestSetImageWithData(thumbnail: interop.Object, data: interop.Object, properties: interop.Object): void;

export declare function QLThumbnailRequestCreateContext(thumbnail: interop.Object, size: CGSize, isBitmap: number, properties: interop.Object): interop.Object;

export declare function QLThumbnailRequestFlushContext(thumbnail: interop.Object, context: interop.Object): void;

export declare function QLThumbnailRequestSetImageAtURL(thumbnail: interop.Object, url: interop.Object, properties: interop.Object): void;

export declare function QLThumbnailRequestSetThumbnailWithDataRepresentation(thumbnail: interop.Object, data: interop.Object, contentTypeUTI: interop.Object, previewProperties: interop.Object, properties: interop.Object): void;

export declare function QLThumbnailRequestSetThumbnailWithURLRepresentation(thumbnail: interop.Object, url: interop.Object, contentTypeUTI: interop.Object, previewProperties: interop.Object, properties: interop.Object): void;

export declare function QLThumbnailRequestIsCancelled(thumbnail: interop.Object): number;

export declare function QLPreviewRequestGetTypeID(): number;

export declare function QLPreviewRequestCopyURL(preview: interop.Object): interop.Object;

export declare function QLPreviewRequestCopyOptions(preview: interop.Object): interop.Object;

export declare function QLPreviewRequestCopyContentUTI(preview: interop.Object): interop.Object;

export declare function QLPreviewRequestGetGeneratorBundle(preview: interop.Object): interop.Object;

export declare function QLPreviewRequestSetDocumentObject(preview: interop.Object, object: interop.PointerConvertible, callbacks: interop.PointerConvertible): void;

export declare function QLPreviewRequestGetDocumentObject(preview: interop.Object): interop.Pointer;

export declare function QLPreviewRequestIsCancelled(preview: interop.Object): number;

export declare function QLPreviewRequestSetDataRepresentation(preview: interop.Object, data: interop.Object, contentTypeUTI: interop.Object, properties: interop.Object): void;

export declare function QLPreviewRequestSetURLRepresentation(preview: interop.Object, url: interop.Object, contentTypeUTI: interop.Object, properties: interop.Object): void;

export declare function QLPreviewRequestCreateContext(preview: interop.Object, size: CGSize, isBitmap: number, properties: interop.Object): interop.Object;

export declare function QLPreviewRequestCreatePDFContext(preview: interop.Object, mediaBox: interop.PointerConvertible, auxiliaryInfo: interop.Object, properties: interop.Object): interop.Object;

export declare function QLPreviewRequestFlushContext(preview: interop.Object, context: interop.Object): void;

export declare function QLThumbnailImageCreate(allocator: interop.Object, url: interop.Object, maxThumbnailSize: CGSize, options: interop.Object): interop.Object;

export declare function QLThumbnailGetTypeID(): number;

export declare function QLThumbnailCreate(allocator: interop.Object, url: interop.Object, maxThumbnailSize: CGSize, options: interop.Object): interop.Object;

export declare function QLThumbnailCopyDocumentURL(thumbnail: interop.Object): interop.Object;

export declare function QLThumbnailGetMaximumSize(thumbnail: interop.Object): CGSize;

export declare function QLThumbnailCopyOptions(thumbnail: interop.Object): interop.Object;

export declare function QLThumbnailDispatchAsync(thumbnail: interop.Object, queue: NSObject, completion: () => void): void;

export declare function QLThumbnailCopyImage(thumbnail: interop.Object): interop.Object;

export declare function QLThumbnailGetContentRect(thumbnail: interop.Object): CGRect;

export declare function QLThumbnailCancel(thumbnail: interop.Object): void;

export declare function QLThumbnailIsCancelled(thumbnail: interop.Object): number;

import type { NSAppearance, NSColor, NSImage } from './AppKit'

import type { CNPostalAddress } from './Contacts'

import type { CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { CLHeading } from './CoreLocation'

import type { NSArray, NSCoder, NSCoding, NSCopying, NSData, NSDate, NSDictionary, NSEdgeInsets, NSError, NSIndexSet, NSLocale, NSSecureCoding, NSSet, NSTimeZone, NSURL, _NSRange } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { CLLocation, CLLocationCoordinate2D } from './_LocationEssentials'

import type { interop } from './objc-runtime'

import { NSView } from './AppKit'

import { CGRectEdge } from './CoreFoundation'

import { CGLineCap, CGLineJoin } from './CoreGraphics'

import { CLPlacemark } from './CoreLocation'

import { NSFormatter } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const MKMapViewDefaultClusterAnnotationViewReuseIdentifier: string;

export declare const MKMapViewDefaultAnnotationViewReuseIdentifier: string;

export declare const MKAnnotationViewZPriorityDefaultSelected: number;

export declare const MKAnnotationViewZPriorityMax: number;

export declare const MKFeatureDisplayPriorityDefaultLow: number;

export declare const MKFeatureDisplayPriorityRequired: number;

export declare const MKPointsOfInterestRequestMaxRadius: number;

export declare const MKLaunchOptionsCameraKey: string;

export declare const MKLaunchOptionsMapSpanKey: string;

export declare const MKLaunchOptionsDirectionsModeTransit: string;

export declare const MKLaunchOptionsDirectionsModeWalking: string;

export declare const MKLaunchOptionsDirectionsModeDriving: string;

export declare const MKLaunchOptionsDirectionsModeDefault: string;

export declare const MKLaunchOptionsShowsTrafficKey: string;

export declare const MKLaunchOptionsMapTypeKey: string;

export declare const MKPointOfInterestCategoryZoo: string;

export declare const MKPointOfInterestCategoryWinery: string;

export declare const MKPointOfInterestCategoryTheater: string;

export declare const MKPointOfInterestCategorySchool: string;

export declare const MKPointOfInterestCategoryRestaurant: string;

export declare const MKPointOfInterestCategoryPolice: string;

export declare const MKPointOfInterestCategoryPark: string;

export declare const MKPointOfInterestCategoryNightlife: string;

export declare const MKPointOfInterestCategoryNationalPark: string;

export declare const MKPointOfInterestCategoryGasStation: string;

export declare const MKPointOfInterestCategoryFoodMarket: string;

export declare const MKPointOfInterestCategoryCampground: string;

export declare const MKPointOfInterestCategoryCafe: string;

export declare const MKPointOfInterestCategoryBrewery: string;

export declare const MKPointOfInterestCategoryBeach: string;

export declare const MKPointOfInterestCategoryAquarium: string;

export declare const MKMapRectWorld: MKMapRect;

export declare const MKErrorDomain: string;

export declare const MKPointOfInterestCategoryLibrary: string;

export declare const MKPointOfInterestCategoryHospital: string;

export declare const MKPointOfInterestCategoryMarina: string;

export declare const MKPointOfInterestCategoryHotel: string;

export declare const MKPointOfInterestCategoryMuseum: string;

export declare const MKMapRectNull: MKMapRect;

export declare const MKMapItemTypeIdentifier: string;

export declare const MKPointOfInterestCategoryStore: string;

export declare const MKPointOfInterestCategoryAmusementPark: string;

export declare const MKLaunchOptionsDirectionsModeKey: string;

export declare const MKPointOfInterestCategoryAirport: string;

export declare const MKPointOfInterestCategoryStadium: string;

export declare const MKPointOfInterestCategoryPostOffice: string;

export declare const MKPointOfInterestCategoryPublicTransport: string;

export declare const MKLaunchOptionsMapCenterKey: string;

export declare const MKLaunchOptionsDirectionsModeCycling: string;

export declare const MKAnnotationViewZPriorityDefaultUnselected: number;

export declare const MKMapSizeWorld: MKMapSize;

export declare const MKFeatureDisplayPriorityDefaultHigh: number;

export declare const MKMapCameraZoomDefault: number;

export declare const MKPointOfInterestCategoryCarRental: string;

export declare const MKPointOfInterestCategoryRestroom: string;

export declare const MKPointOfInterestCategoryBakery: string;

export declare const MKPointOfInterestCategoryEVCharger: string;

export declare const MKAnnotationCalloutInfoDidChangeNotification: string;

export declare const MKPointOfInterestCategoryPharmacy: string;

export declare const MKPointOfInterestCategoryMovieTheater: string;

export declare const MKPointOfInterestCategoryLaundry: string;

export declare const MKPointOfInterestCategoryBank: string;

export declare const MKAnnotationViewZPriorityMin: number;

export declare const MKPointOfInterestCategoryATM: string;

export declare const MKPointOfInterestCategoryUniversity: string;

export declare const MKPointOfInterestCategoryFireStation: string;

export declare const MKPointOfInterestCategoryFitnessCenter: string;

export declare const MKPointOfInterestCategoryParking: string;

export declare const MKPinAnnotationColor: {
  Red: 0,
  Green: 1,
  Purple: 2,
};

export declare const MKStandardMapEmphasisStyle: {
  Default: 0,
  Muted: 1,
};

export declare const MKUserTrackingMode: {
  None: 0,
  Follow: 1,
};

export declare const MKOverlayLevel: {
  Roads: 0,
  Labels: 1,
};

export declare const MKMapElevationStyle: {
  Flat: 0,
  Realistic: 1,
};

export declare const MKLocalSearchResultType: {
  Address: 1,
  PointOfInterest: 2,
};

export declare const MKFeatureVisibility: {
  Adaptive: 0,
  Hidden: 1,
  Visible: 2,
};

export declare const MKErrorCode: {
  Unknown: 1,
  ServerFailure: 2,
  LoadingThrottled: 3,
  PlacemarkNotFound: 4,
  DirectionsNotFound: 5,
  DecodingFailed: 6,
};

export declare const MKMapType: {
  Standard: 0,
  Satellite: 1,
  Hybrid: 2,
  SatelliteFlyover: 3,
  HybridFlyover: 4,
  MutedStandard: 5,
};

export declare const MKLocalSearchCompleterResultType: {
  Address: 1,
  PointOfInterest: 2,
  Query: 4,
};

export declare const MKDistanceFormatterUnitStyle: {
  Default: 0,
  Abbreviated: 1,
  Full: 2,
};

export declare const MKAnnotationViewCollisionMode: {
  Rectangle: 0,
  Circle: 1,
  None: 2,
};

export declare const MKDirectionsTransportType: {
  Automobile: 1,
  Walking: 2,
  Transit: 4,
  Cycling: 8,
  Any: 268435455,
};

export declare const MKSearchCompletionFilterType: {
  AndQueries: 0,
  Only: 1,
};

export declare const MKDirectionsRoutePreference: {
  Any: 0,
  Avoid: 1,
};

export declare const MKAnnotationViewDragState: {
  None: 0,
  Starting: 1,
  Dragging: 2,
  Canceling: 3,
  Ending: 4,
};

export declare const MKDistanceFormatterUnits: {
  Default: 0,
  Metric: 1,
  Imperial: 2,
  ImperialWithYards: 3,
};

export declare class MKMapRect {
  constructor(init?: MKMapRect);
  origin: MKMapPoint;
  size: MKMapSize;
}

export declare class MKMapPoint {
  constructor(init?: MKMapPoint);
  x: number;
  y: number;
}

export declare class MKTileOverlayPath {
  constructor(init?: MKTileOverlayPath);
  x: number;
  y: number;
  z: number;
  contentScaleFactor: number;
}

export declare class MKMapSize {
  constructor(init?: MKMapSize);
  width: number;
  height: number;
}

export declare class MKCoordinateSpan {
  constructor(init?: MKCoordinateSpan);
  latitudeDelta: number;
  longitudeDelta: number;
}

export declare class MKCoordinateRegion {
  constructor(init?: MKCoordinateRegion);
  center: CLLocationCoordinate2D;
  span: MKCoordinateSpan;
}

export declare function MKCoordinateRegionMakeWithDistance(centerCoordinate: CLLocationCoordinate2D, latitudinalMeters: number, longitudinalMeters: number): MKCoordinateRegion;

export declare function MKMapPointForCoordinate(coordinate: CLLocationCoordinate2D): MKMapPoint;

export declare function MKCoordinateForMapPoint(mapPoint: MKMapPoint): CLLocationCoordinate2D;

export declare function MKMetersPerMapPointAtLatitude(latitude: number): number;

export declare function MKMapPointsPerMeterAtLatitude(latitude: number): number;

export declare function MKMetersBetweenMapPoints(a: MKMapPoint, b: MKMapPoint): number;

export declare function MKMapRectUnion(rect1: MKMapRect, rect2: MKMapRect): MKMapRect;

export declare function MKMapRectIntersection(rect1: MKMapRect, rect2: MKMapRect): MKMapRect;

export declare function MKMapRectInset(rect: MKMapRect, dx: number, dy: number): MKMapRect;

export declare function MKMapRectOffset(rect: MKMapRect, dx: number, dy: number): MKMapRect;

export declare function MKMapRectDivide(rect: MKMapRect, slice: interop.PointerConvertible, remainder: interop.PointerConvertible, amount: number, edge: interop.Enum<typeof CGRectEdge>): void;

export declare function MKMapRectContainsPoint(rect: MKMapRect, point: MKMapPoint): boolean;

export declare function MKMapRectContainsRect(rect1: MKMapRect, rect2: MKMapRect): boolean;

export declare function MKMapRectIntersectsRect(rect1: MKMapRect, rect2: MKMapRect): boolean;

export declare function MKCoordinateRegionForMapRect(rect: MKMapRect): MKCoordinateRegion;

export declare function MKMapRectSpans180thMeridian(rect: MKMapRect): boolean;

export declare function MKMapRectRemainder(rect: MKMapRect): MKMapRect;

export declare function MKRoadWidthAtZoomScale(zoomScale: number): number;

export declare interface MKAnnotation extends NSObjectProtocol {
  readonly coordinate: CLLocationCoordinate2D;

  readonly title?: string;

  readonly subtitle?: string;
}

export declare class MKAnnotation extends NativeObject implements MKAnnotation {
}

export declare interface MKLocalSearchCompleterDelegate extends NSObjectProtocol {
  completerDidUpdateResults?(completer: MKLocalSearchCompleter): void;

  completerDidFailWithError?(completer: MKLocalSearchCompleter, error: NSError): void;
}

export declare class MKLocalSearchCompleterDelegate extends NativeObject implements MKLocalSearchCompleterDelegate {
}

export declare interface MKGeoJSONObject extends NSObjectProtocol {
}

export declare class MKGeoJSONObject extends NativeObject implements MKGeoJSONObject {
}

export declare interface MKOverlay extends MKAnnotation {
  readonly coordinate: CLLocationCoordinate2D;

  readonly boundingMapRect: MKMapRect;

  intersectsMapRect?(mapRect: MKMapRect): boolean;

  canReplaceMapContent?: boolean;
}

export declare class MKOverlay extends NativeObject implements MKOverlay {
}

export declare interface MKMapViewDelegate extends NSObjectProtocol {
  mapViewRegionWillChangeAnimated?(mapView: MKMapView, animated: boolean): void;

  mapViewRegionDidChangeAnimated?(mapView: MKMapView, animated: boolean): void;

  mapViewDidChangeVisibleRegion?(mapView: MKMapView): void;

  mapViewWillStartLoadingMap?(mapView: MKMapView): void;

  mapViewDidFinishLoadingMap?(mapView: MKMapView): void;

  mapViewDidFailLoadingMapWithError?(mapView: MKMapView, error: NSError): void;

  mapViewWillStartRenderingMap?(mapView: MKMapView): void;

  mapViewDidFinishRenderingMapFullyRendered?(mapView: MKMapView, fullyRendered: boolean): void;

  mapViewViewForAnnotation?(mapView: MKMapView, annotation: MKAnnotation): MKAnnotationView;

  mapViewDidAddAnnotationViews?(mapView: MKMapView, views: NSArray<interop.Object> | Array<interop.Object>): void;

  mapViewDidSelectAnnotationView?(mapView: MKMapView, view: MKAnnotationView): void;

  mapViewDidDeselectAnnotationView?(mapView: MKMapView, view: MKAnnotationView): void;

  mapViewWillStartLocatingUser?(mapView: MKMapView): void;

  mapViewDidStopLocatingUser?(mapView: MKMapView): void;

  mapViewDidUpdateUserLocation?(mapView: MKMapView, userLocation: MKUserLocation): void;

  mapViewDidFailToLocateUserWithError?(mapView: MKMapView, error: NSError): void;

  mapViewAnnotationViewDidChangeDragStateFromOldState?(mapView: MKMapView, view: MKAnnotationView, newState: interop.Enum<typeof MKAnnotationViewDragState>, oldState: interop.Enum<typeof MKAnnotationViewDragState>): void;

  mapViewDidChangeUserTrackingModeAnimated?(mapView: MKMapView, mode: interop.Enum<typeof MKUserTrackingMode>, animated: boolean): void;

  mapViewRendererForOverlay?(mapView: MKMapView, overlay: MKOverlay): MKOverlayRenderer;

  mapViewDidAddOverlayRenderers?(mapView: MKMapView, renderers: NSArray<interop.Object> | Array<interop.Object>): void;

  mapViewClusterAnnotationForMemberAnnotations?(mapView: MKMapView, memberAnnotations: NSArray<interop.Object> | Array<interop.Object>): MKClusterAnnotation;
}

export declare class MKMapViewDelegate extends NativeObject implements MKMapViewDelegate {
}

export declare class MKPitchControl extends NSView {
  static pitchControlWithMapView<This extends abstract new (...args: any) => any>(this: This, mapView: MKMapView | null): InstanceType<This>;

  mapView: MKMapView;
}

export declare class MKMapCameraZoomRange extends NSObject implements NSSecureCoding, NSCopying {
  initWithMinCenterCoordinateDistanceMaxCenterCoordinateDistance(minDistance: number, maxDistance: number): this;

  initWithMinCenterCoordinateDistance(minDistance: number): this;

  initWithMaxCenterCoordinateDistance(maxDistance: number): this;

  readonly minCenterCoordinateDistance: number;

  readonly maxCenterCoordinateDistance: number;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class MKTileOverlay extends NSObject implements MKOverlay {
  initWithURLTemplate(URLTemplate: string | null): this;

  tileSize: CGSize;

  geometryFlipped: boolean;

  minimumZ: number;

  maximumZ: number;

  readonly URLTemplate: string;

  canReplaceMapContent: boolean;

  isGeometryFlipped(): boolean;

  URLForTilePath(path: MKTileOverlayPath): NSURL;

  loadTileAtPathResult(path: MKTileOverlayPath, result: (p1: NSData, p2: NSError) => void | null): void;

  readonly coordinate: CLLocationCoordinate2D;

  readonly boundingMapRect: MKMapRect;

  intersectsMapRect(mapRect: MKMapRect): boolean;

  readonly title: string;

  readonly subtitle: string;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKCircleRenderer extends MKOverlayPathRenderer {
  initWithCircle(circle: MKCircle): this;

  readonly circle: MKCircle;

  strokeStart: number;

  strokeEnd: number;
}

export declare class MKMultiPolylineRenderer extends MKOverlayPathRenderer {
  initWithMultiPolyline(multiPolyline: MKMultiPolyline): this;

  readonly multiPolyline: MKMultiPolyline;
}

export declare class MKMultiPolygonRenderer extends MKOverlayPathRenderer {
  initWithMultiPolygon(multiPolygon: MKMultiPolygon): this;

  readonly multiPolygon: MKMultiPolygon;
}

export declare class MKOverlayPathRenderer extends MKOverlayRenderer {
  fillColor: NSColor;

  strokeColor: NSColor;

  lineWidth: number;

  lineJoin: interop.Enum<typeof CGLineJoin>;

  lineCap: interop.Enum<typeof CGLineCap>;

  miterLimit: number;

  lineDashPhase: number;

  get lineDashPattern(): NSArray;
  set lineDashPattern(value: NSArray<interop.Object> | Array<interop.Object>);

  shouldRasterize: boolean;

  createPath(): void;

  path: interop.Object;

  invalidatePath(): void;

  applyStrokePropertiesToContextAtZoomScale(context: interop.Object, zoomScale: number): void;

  applyFillPropertiesToContextAtZoomScale(context: interop.Object, zoomScale: number): void;

  strokePathInContext(path: interop.Object, context: interop.Object): void;

  fillPathInContext(path: interop.Object, context: interop.Object): void;
}

export declare class MKClusterAnnotation extends NSObject implements MKAnnotation {
  title: string;

  subtitle: string;

  readonly memberAnnotations: NSArray;

  initWithMemberAnnotations(memberAnnotations: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly coordinate: CLLocationCoordinate2D;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKUserLocation extends NSObject implements MKAnnotation {
  readonly updating: boolean;

  readonly location: CLLocation;

  readonly heading: CLHeading;

  title: string;

  subtitle: string;

  isUpdating(): boolean;

  readonly coordinate: CLLocationCoordinate2D;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKMarkerAnnotationView extends MKAnnotationView {
  titleVisibility: interop.Enum<typeof MKFeatureVisibility>;

  subtitleVisibility: interop.Enum<typeof MKFeatureVisibility>;

  markerTintColor: NSColor;

  glyphTintColor: NSColor;

  glyphText: string;

  glyphImage: NSImage;

  selectedGlyphImage: NSImage;

  animatesWhenAdded: boolean;
}

export declare class MKMapSnapshotter extends NSObject {
  initWithOptions(options: MKMapSnapshotOptions): this;

  startWithCompletionHandler(completionHandler: (p1: MKMapSnapshot, p2: NSError) => void): void;

  startWithQueueCompletionHandler(queue: NSObject, completionHandler: (p1: MKMapSnapshot, p2: NSError) => void): void;

  cancel(): void;

  readonly loading: boolean;

  isLoading(): boolean;
}

export declare class MKMapSnapshotOptions extends NSObject implements NSCopying {
  camera: MKMapCamera;

  mapRect: MKMapRect;

  region: MKCoordinateRegion;

  mapType: interop.Enum<typeof MKMapType>;

  pointOfInterestFilter: MKPointOfInterestFilter;

  showsPointsOfInterest: boolean;

  showsBuildings: boolean;

  size: CGSize;

  appearance: NSAppearance;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class MKMapView extends NSView implements NSCoding {
  delegate: MKMapViewDelegate;

  mapType: interop.Enum<typeof MKMapType>;

  region: MKCoordinateRegion;

  setRegionAnimated(region: MKCoordinateRegion, animated: boolean): void;

  centerCoordinate: CLLocationCoordinate2D;

  setCenterCoordinateAnimated(coordinate: CLLocationCoordinate2D, animated: boolean): void;

  regionThatFits(region: MKCoordinateRegion): MKCoordinateRegion;

  visibleMapRect: MKMapRect;

  setVisibleMapRectAnimated(mapRect: MKMapRect, animate: boolean): void;

  mapRectThatFits(mapRect: MKMapRect): MKMapRect;

  setVisibleMapRectEdgePaddingAnimated(mapRect: MKMapRect, insets: NSEdgeInsets, animate: boolean): void;

  mapRectThatFitsEdgePadding(mapRect: MKMapRect, insets: NSEdgeInsets): MKMapRect;

  camera: MKMapCamera;

  setCameraAnimated(camera: MKMapCamera, animated: boolean): void;

  cameraZoomRange: MKMapCameraZoomRange;

  setCameraZoomRangeAnimated(cameraZoomRange: MKMapCameraZoomRange | null, animated: boolean): void;

  cameraBoundary: MKMapCameraBoundary;

  setCameraBoundaryAnimated(cameraBoundary: MKMapCameraBoundary | null, animated: boolean): void;

  convertCoordinateToPointToView(coordinate: CLLocationCoordinate2D, view: NSView | null): CGPoint;

  convertPointToCoordinateFromView(point: CGPoint, view: NSView | null): CLLocationCoordinate2D;

  convertRegionToRectToView(region: MKCoordinateRegion, view: NSView | null): CGRect;

  convertRectToRegionFromView(rect: CGRect, view: NSView | null): MKCoordinateRegion;

  zoomEnabled: boolean;

  scrollEnabled: boolean;

  rotateEnabled: boolean;

  pitchEnabled: boolean;

  showsPitchControl: boolean;

  showsZoomControls: boolean;

  showsCompass: boolean;

  showsScale: boolean;

  pointOfInterestFilter: MKPointOfInterestFilter;

  showsPointsOfInterest: boolean;

  showsBuildings: boolean;

  showsTraffic: boolean;

  showsUserLocation: boolean;

  readonly userLocation: MKUserLocation;

  userTrackingMode: interop.Enum<typeof MKUserTrackingMode>;

  setUserTrackingModeAnimated(mode: interop.Enum<typeof MKUserTrackingMode>, animated: boolean): void;

  readonly userLocationVisible: boolean;

  addAnnotation(annotation: MKAnnotation): void;

  addAnnotations(annotations: NSArray<interop.Object> | Array<interop.Object>): void;

  removeAnnotation(annotation: MKAnnotation): void;

  removeAnnotations(annotations: NSArray<interop.Object> | Array<interop.Object>): void;

  readonly annotations: NSArray;

  annotationsInMapRect(mapRect: MKMapRect): NSSet;

  viewForAnnotation(annotation: MKAnnotation): MKAnnotationView;

  dequeueReusableAnnotationViewWithIdentifier(identifier: string): MKAnnotationView;

  dequeueReusableAnnotationViewWithIdentifierForAnnotation(identifier: string, annotation: MKAnnotation): MKAnnotationView;

  registerClassForAnnotationViewWithReuseIdentifier(viewClass: interop.PointerConvertible, identifier: string): void;

  selectAnnotationAnimated(annotation: MKAnnotation, animated: boolean): void;

  deselectAnnotationAnimated(annotation: MKAnnotation | null, animated: boolean): void;

  get selectedAnnotations(): NSArray;
  set selectedAnnotations(value: NSArray<interop.Object> | Array<interop.Object>);

  readonly annotationVisibleRect: CGRect;

  showAnnotationsAnimated(annotations: NSArray<interop.Object> | Array<interop.Object>, animated: boolean): void;

  isZoomEnabled(): boolean;

  isScrollEnabled(): boolean;

  isRotateEnabled(): boolean;

  isPitchEnabled(): boolean;

  isUserLocationVisible(): boolean;

  addOverlayLevel(overlay: MKOverlay, level: interop.Enum<typeof MKOverlayLevel>): void;

  addOverlaysLevel(overlays: NSArray<interop.Object> | Array<interop.Object>, level: interop.Enum<typeof MKOverlayLevel>): void;

  removeOverlay(overlay: MKOverlay): void;

  removeOverlays(overlays: NSArray<interop.Object> | Array<interop.Object>): void;

  insertOverlayAtIndexLevel(overlay: MKOverlay, index: number, level: interop.Enum<typeof MKOverlayLevel>): void;

  insertOverlayAboveOverlay(overlay: MKOverlay, sibling: MKOverlay): void;

  insertOverlayBelowOverlay(overlay: MKOverlay, sibling: MKOverlay): void;

  exchangeOverlayWithOverlay(overlay1: MKOverlay, overlay2: MKOverlay): void;

  readonly overlays: NSArray;

  overlaysInLevel(level: interop.Enum<typeof MKOverlayLevel>): NSArray;

  rendererForOverlay(overlay: MKOverlay): MKOverlayRenderer;

  addOverlay(overlay: MKOverlay): void;

  addOverlays(overlays: NSArray<interop.Object> | Array<interop.Object>): void;

  insertOverlayAtIndex(overlay: MKOverlay, index: number): void;

  exchangeOverlayAtIndexWithOverlayAtIndex(index1: number, index2: number): void;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class MKOverlayRenderer extends NSObject {
  initWithOverlay(overlay: MKOverlay): this;

  readonly overlay: MKOverlay;

  pointForMapPoint(mapPoint: MKMapPoint): CGPoint;

  mapPointForPoint(point: CGPoint): MKMapPoint;

  rectForMapRect(mapRect: MKMapRect): CGRect;

  mapRectForRect(rect: CGRect): MKMapRect;

  canDrawMapRectZoomScale(mapRect: MKMapRect, zoomScale: number): boolean;

  drawMapRectZoomScaleInContext(mapRect: MKMapRect, zoomScale: number, context: interop.Object): void;

  setNeedsDisplay(): void;

  setNeedsDisplayInMapRect(mapRect: MKMapRect): void;

  setNeedsDisplayInMapRectZoomScale(mapRect: MKMapRect, zoomScale: number): void;

  alpha: number;

  readonly contentScaleFactor: number;
}

export declare class MKLocalSearchCompleter extends NSObject {
  queryFragment: string;

  region: MKCoordinateRegion;

  filterType: interop.Enum<typeof MKSearchCompletionFilterType>;

  resultTypes: interop.Enum<typeof MKLocalSearchCompleterResultType>;

  pointOfInterestFilter: MKPointOfInterestFilter;

  delegate: MKLocalSearchCompleterDelegate;

  readonly results: NSArray;

  readonly searching: boolean;

  cancel(): void;

  isSearching(): boolean;
}

export declare class MKLocalPointsOfInterestRequest extends NSObject implements NSCopying {
  initWithCenterCoordinateRadius(coordinate: CLLocationCoordinate2D, radius: number): this;

  initWithCoordinateRegion(region: MKCoordinateRegion): this;

  readonly coordinate: CLLocationCoordinate2D;

  readonly radius: number;

  readonly region: MKCoordinateRegion;

  pointOfInterestFilter: MKPointOfInterestFilter;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class MKPointOfInterestFilter extends NSObject implements NSSecureCoding, NSCopying {
  static readonly filterIncludingAllCategories: MKPointOfInterestFilter;

  static readonly filterExcludingAllCategories: MKPointOfInterestFilter;

  initIncludingCategories(categories: NSArray<interop.Object> | Array<interop.Object>): this;

  initExcludingCategories(categories: NSArray<interop.Object> | Array<interop.Object>): this;

  includesCategory(category: string): boolean;

  excludesCategory(category: string): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class MKGeoJSONFeature extends NSObject implements MKGeoJSONObject {
  readonly identifier: string;

  readonly properties: NSData;

  readonly geometry: NSArray;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKMultiPolygon extends MKShape implements MKOverlay, MKGeoJSONObject {
  initWithPolygons(polygons: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly polygons: NSArray;

  readonly coordinate: CLLocationCoordinate2D;

  readonly boundingMapRect: MKMapRect;

  intersectsMapRect(mapRect: MKMapRect): boolean;

  canReplaceMapContent: boolean;

  // @ts-ignore MemberDecl.tsIgnore
  readonly title: string;

  // @ts-ignore MemberDecl.tsIgnore
  readonly subtitle: string;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKPolygon extends MKMultiPoint implements MKOverlay, MKGeoJSONObject {
  static polygonWithPointsCount<This extends abstract new (...args: any) => any>(this: This, points: interop.PointerConvertible, count: number): InstanceType<This>;

  static polygonWithPointsCountInteriorPolygons<This extends abstract new (...args: any) => any>(this: This, points: interop.PointerConvertible, count: number, interiorPolygons: NSArray<interop.Object> | Array<interop.Object> | null): InstanceType<This>;

  static polygonWithCoordinatesCount<This extends abstract new (...args: any) => any>(this: This, coords: interop.PointerConvertible, count: number): InstanceType<This>;

  static polygonWithCoordinatesCountInteriorPolygons<This extends abstract new (...args: any) => any>(this: This, coords: interop.PointerConvertible, count: number, interiorPolygons: NSArray<interop.Object> | Array<interop.Object> | null): InstanceType<This>;

  readonly interiorPolygons: NSArray;

  readonly coordinate: CLLocationCoordinate2D;

  readonly boundingMapRect: MKMapRect;

  intersectsMapRect(mapRect: MKMapRect): boolean;

  canReplaceMapContent: boolean;

  // @ts-ignore MemberDecl.tsIgnore
  readonly title: string;

  // @ts-ignore MemberDecl.tsIgnore
  readonly subtitle: string;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKMultiPolyline extends MKShape implements MKOverlay, MKGeoJSONObject {
  initWithPolylines(polylines: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly polylines: NSArray;

  readonly coordinate: CLLocationCoordinate2D;

  readonly boundingMapRect: MKMapRect;

  intersectsMapRect(mapRect: MKMapRect): boolean;

  canReplaceMapContent: boolean;

  // @ts-ignore MemberDecl.tsIgnore
  readonly title: string;

  // @ts-ignore MemberDecl.tsIgnore
  readonly subtitle: string;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKPolyline extends MKMultiPoint implements MKOverlay, MKGeoJSONObject {
  static polylineWithPointsCount<This extends abstract new (...args: any) => any>(this: This, points: interop.PointerConvertible, count: number): InstanceType<This>;

  static polylineWithCoordinatesCount<This extends abstract new (...args: any) => any>(this: This, coords: interop.PointerConvertible, count: number): InstanceType<This>;

  readonly coordinate: CLLocationCoordinate2D;

  readonly boundingMapRect: MKMapRect;

  intersectsMapRect(mapRect: MKMapRect): boolean;

  canReplaceMapContent: boolean;

  // @ts-ignore MemberDecl.tsIgnore
  readonly title: string;

  // @ts-ignore MemberDecl.tsIgnore
  readonly subtitle: string;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKPointAnnotation extends MKShape implements MKGeoJSONObject {
  init(): this;

  initWithCoordinate(coordinate: CLLocationCoordinate2D): this;

  initWithCoordinateTitleSubtitle(coordinate: CLLocationCoordinate2D, title: string | null, subtitle: string | null): this;

  // @ts-ignore MemberDecl.tsIgnore
  coordinate: CLLocationCoordinate2D;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKDistanceFormatter extends NSFormatter {
  stringFromDistance(distance: number): string;

  distanceFromString(distance: string): number;

  locale: NSLocale;

  units: interop.Enum<typeof MKDistanceFormatterUnits>;

  unitStyle: interop.Enum<typeof MKDistanceFormatterUnitStyle>;
}

export declare class MKETAResponse extends NSObject {
  readonly source: MKMapItem;

  readonly destination: MKMapItem;

  readonly expectedTravelTime: number;

  readonly distance: number;

  readonly expectedArrivalDate: NSDate;

  readonly expectedDepartureDate: NSDate;

  readonly transportType: interop.Enum<typeof MKDirectionsTransportType>;
}

export declare class MKRouteStep extends NSObject {
  readonly instructions: string;

  readonly notice: string;

  readonly polyline: MKPolyline;

  readonly distance: number;

  readonly transportType: interop.Enum<typeof MKDirectionsTransportType>;
}

export declare class MKRoute extends NSObject {
  readonly name: string;

  readonly advisoryNotices: NSArray;

  readonly distance: number;

  readonly expectedTravelTime: number;

  readonly transportType: interop.Enum<typeof MKDirectionsTransportType>;

  readonly polyline: MKPolyline;

  readonly steps: NSArray;
}

export declare class MKDirectionsRequest extends NSObject {
  source: MKMapItem;

  destination: MKMapItem;

  transportType: interop.Enum<typeof MKDirectionsTransportType>;

  requestsAlternateRoutes: boolean;

  departureDate: NSDate;

  arrivalDate: NSDate;

  initWithContentsOfURL(url: NSURL): this;

  static isDirectionsRequestURL(url: NSURL): boolean;
}

export declare class MKMapItem extends NSObject implements NSSecureCoding {
  readonly placemark: MKPlacemark;

  readonly isCurrentLocation: boolean;

  name: string;

  phoneNumber: string;

  url: NSURL;

  timeZone: NSTimeZone;

  pointOfInterestCategory: string;

  static mapItemForCurrentLocation(): MKMapItem;

  initWithPlacemark(placemark: MKPlacemark): this;

  openInMapsWithLaunchOptions(launchOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): boolean;

  static openMapsWithItemsLaunchOptions(mapItems: NSArray<interop.Object> | Array<interop.Object>, launchOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class MKPlacemark extends CLPlacemark implements MKAnnotation {
  initWithCoordinate(coordinate: CLLocationCoordinate2D): this;

  initWithCoordinateAddressDictionary(coordinate: CLLocationCoordinate2D, addressDictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithCoordinatePostalAddress(coordinate: CLLocationCoordinate2D, postalAddress: CNPostalAddress): this;

  readonly countryCode: string;

  readonly coordinate: CLLocationCoordinate2D;

  readonly title: string;

  readonly subtitle: string;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKShape extends NSObject implements MKAnnotation {
  title: string;

  subtitle: string;

  readonly coordinate: CLLocationCoordinate2D;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKMapCamera extends NSObject implements NSSecureCoding, NSCopying {
  centerCoordinate: CLLocationCoordinate2D;

  centerCoordinateDistance: number;

  heading: number;

  pitch: number;

  altitude: number;

  static camera<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  static cameraLookingAtCenterCoordinateFromEyeCoordinateEyeAltitude<This extends abstract new (...args: any) => any>(this: This, centerCoordinate: CLLocationCoordinate2D, eyeCoordinate: CLLocationCoordinate2D, eyeAltitude: number): InstanceType<This>;

  static cameraLookingAtCenterCoordinateFromDistancePitchHeading<This extends abstract new (...args: any) => any>(this: This, centerCoordinate: CLLocationCoordinate2D, distance: number, pitch: number, heading: number): InstanceType<This>;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class MKDirectionsResponse extends NSObject {
  readonly source: MKMapItem;

  readonly destination: MKMapItem;

  readonly routes: NSArray;
}

export declare class MKGradientPolylineRenderer extends MKPolylineRenderer {
  readonly locations: NSArray;

  readonly colors: NSArray;

  setColorsAtLocations(colors: NSArray<interop.Object> | Array<interop.Object>, locations: NSArray<interop.Object> | Array<interop.Object>): void;
}

export declare class MKAnnotationView extends NSView {
  initWithAnnotationReuseIdentifier(annotation: MKAnnotation | null, reuseIdentifier: string | null): this;

  initWithCoder(coder: NSCoder): this;
  initWithCoder(aDecoder: NSCoder): this;

  readonly reuseIdentifier: string;

  prepareForReuse(): void;

  prepareForDisplay(): void;

  annotation: MKAnnotation;

  image: NSImage;

  centerOffset: CGPoint;

  calloutOffset: CGPoint;

  leftCalloutOffset: CGPoint;

  rightCalloutOffset: CGPoint;

  enabled: boolean;

  highlighted: boolean;

  selected: boolean;

  setSelectedAnimated(selected: boolean, animated: boolean): void;

  canShowCallout: boolean;

  leftCalloutAccessoryView: NSView;

  rightCalloutAccessoryView: NSView;

  detailCalloutAccessoryView: NSView;

  draggable: boolean;

  dragState: interop.Enum<typeof MKAnnotationViewDragState>;

  setDragStateAnimated(newDragState: interop.Enum<typeof MKAnnotationViewDragState>, animated: boolean): void;

  clusteringIdentifier: string;

  readonly clusterAnnotationView: MKAnnotationView;

  displayPriority: number;

  zPriority: number;

  selectedZPriority: number;

  collisionMode: interop.Enum<typeof MKAnnotationViewCollisionMode>;

  isEnabled(): boolean;

  isHighlighted(): boolean;

  isSelected(): boolean;

  isDraggable(): boolean;
}

export declare class MKCompassButton extends NSView {
  static compassButtonWithMapView<This extends abstract new (...args: any) => any>(this: This, mapView: MKMapView | null): InstanceType<This>;

  mapView: MKMapView;

  compassVisibility: interop.Enum<typeof MKFeatureVisibility>;
}

export declare class MKMapCameraBoundary extends NSObject implements NSSecureCoding, NSCopying {
  initWithMapRect(mapRect: MKMapRect): this;

  initWithCoordinateRegion(region: MKCoordinateRegion): this;

  initWithCoder(coder: NSCoder): this;

  readonly mapRect: MKMapRect;

  readonly region: MKCoordinateRegion;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class MKDirections extends NSObject {
  initWithRequest(request: MKDirectionsRequest): this;

  calculateDirectionsWithCompletionHandler(completionHandler: (p1: MKDirectionsResponse, p2: NSError) => void): void;

  calculateETAWithCompletionHandler(completionHandler: (p1: MKETAResponse, p2: NSError) => void): void;

  cancel(): void;

  readonly calculating: boolean;

  isCalculating(): boolean;
}

export declare class MKMapSnapshot extends NSObject {
  readonly image: NSImage;

  readonly appearance: NSAppearance;

  pointForCoordinate(coordinate: CLLocationCoordinate2D): CGPoint;
}

export declare class MKUserLocationView extends MKAnnotationView {
}

export declare class MKLocalSearchCompletion extends NSObject {
  readonly title: string;

  readonly titleHighlightRanges: NSArray;

  readonly subtitle: string;

  readonly subtitleHighlightRanges: NSArray;
}

export declare class MKTileOverlayRenderer extends MKOverlayRenderer {
  initWithTileOverlay(overlay: MKTileOverlay): this;

  reloadData(): void;
}

export declare class MKPolylineRenderer extends MKOverlayPathRenderer {
  initWithPolyline(polyline: MKPolyline): this;

  readonly polyline: MKPolyline;

  strokeStart: number;

  strokeEnd: number;
}

export declare class MKPinAnnotationView extends MKAnnotationView {
  static redPinColor(): NSColor;

  static greenPinColor(): NSColor;

  static purplePinColor(): NSColor;

  pinTintColor: NSColor;

  animatesDrop: boolean;

  pinColor: interop.Enum<typeof MKPinAnnotationColor>;
}

export declare class MKZoomControl extends NSView {
  static zoomControlWithMapView<This extends abstract new (...args: any) => any>(this: This, mapView: MKMapView | null): InstanceType<This>;

  mapView: MKMapView;
}

export declare class MKLocalSearchRequest extends NSObject implements NSCopying {
  init(): this;

  initWithNaturalLanguageQuery(naturalLanguageQuery: string): this;

  initWithNaturalLanguageQueryRegion(naturalLanguageQuery: string, region: MKCoordinateRegion): this;

  naturalLanguageQuery: string;

  region: MKCoordinateRegion;

  resultTypes: interop.Enum<typeof MKLocalSearchResultType>;

  pointOfInterestFilter: MKPointOfInterestFilter;

  initWithCompletion(completion: MKLocalSearchCompletion): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class MKMultiPoint extends MKShape implements MKGeoJSONObject {
  points(): interop.Pointer;

  readonly pointCount: number;

  getCoordinatesRange(coords: interop.PointerConvertible, range: _NSRange): void;

  locationAtPointIndex(index: number): number;

  locationsAtPointIndexes(indexes: NSIndexSet): NSArray;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKLocalSearchResponse extends NSObject {
  readonly mapItems: NSArray;

  readonly boundingRegion: MKCoordinateRegion;
}

export declare class MKPolygonRenderer extends MKOverlayPathRenderer {
  initWithPolygon(polygon: MKPolygon): this;

  readonly polygon: MKPolygon;

  strokeStart: number;

  strokeEnd: number;
}

export declare class MKGeoJSONDecoder extends NSObject {
  geoJSONObjectsWithDataError(data: NSData, errorPtr: interop.PointerConvertible): NSArray | null;
}

export declare class MKLocalSearch extends NSObject {
  initWithRequest(request: MKLocalSearchRequest): this;

  initWithPointsOfInterestRequest(request: MKLocalPointsOfInterestRequest): this;

  startWithCompletionHandler(completionHandler: (p1: MKLocalSearchResponse, p2: NSError) => void): void;

  cancel(): void;

  readonly searching: boolean;

  isSearching(): boolean;
}

export declare class MKCircle extends MKShape implements MKOverlay {
  static circleWithCenterCoordinateRadius<This extends abstract new (...args: any) => any>(this: This, coord: CLLocationCoordinate2D, radius: number): InstanceType<This>;

  static circleWithMapRect<This extends abstract new (...args: any) => any>(this: This, mapRect: MKMapRect): InstanceType<This>;

  readonly coordinate: CLLocationCoordinate2D;

  readonly radius: number;

  readonly boundingMapRect: MKMapRect;

  intersectsMapRect(mapRect: MKMapRect): boolean;

  canReplaceMapContent: boolean;

  // @ts-ignore MemberDecl.tsIgnore
  readonly title: string;

  // @ts-ignore MemberDecl.tsIgnore
  readonly subtitle: string;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class MKGeodesicPolyline extends MKPolyline {
  static polylineWithPointsCount<This extends abstract new (...args: any) => any>(this: This, points: interop.PointerConvertible, count: number): InstanceType<This>;

  static polylineWithCoordinatesCount<This extends abstract new (...args: any) => any>(this: This, coords: interop.PointerConvertible, count: number): InstanceType<This>;
}

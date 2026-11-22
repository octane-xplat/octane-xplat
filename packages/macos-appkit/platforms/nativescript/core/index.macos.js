// macOS Core provider: curated root index — a platform's index
// exports only the modules it implements (the same pattern upstream PR
// #11089 uses for its index.macos.ts). Names the renderer driver needs but
// macOS does not yet implement stay placeholder classes so the driver's
// element registry and instanceof guards remain complete and safe; anything
// that tries to instantiate one throws through the normal create path.
export { Observable } from '@nativescript/core/data/observable';
export { ViewBase } from '@nativescript/core/ui/core/view-base';
export { View } from '@nativescript/core/ui/core/view';
export { ContentView } from '@nativescript/core/ui/content-view';
export { LayoutBase } from '@nativescript/core/ui/layouts/layout-base';
export { StackLayout } from '@nativescript/core/ui/layouts/stack-layout';
export { GridLayout } from '@nativescript/core/ui/layouts/grid-layout';
export { TextBase } from '@nativescript/core/ui/text-base';
export { Span } from '@nativescript/core/ui/text-base/span';
export { FormattedString } from '@nativescript/core/ui/text-base/formatted-string';
export { Label } from '@nativescript/core/ui/label';
export { Button } from '@nativescript/core/ui/button';
export { EditableTextBase } from '@nativescript/core/ui/editable-text-base';
export { TextField } from '@nativescript/core/ui/text-field';
export { TextView } from '@nativescript/core/ui/text-view';
export { ScrollView } from '@nativescript/core/ui/scroll-view';
export { Image } from '@nativescript/core/ui/image';
export { RootLayout } from '@nativescript/core/ui/layouts/root-layout';
export { Page } from '@nativescript/core/ui/page';
export { Frame } from '@nativescript/core/ui/frame';
export { ProxyViewContainer } from '@nativescript/core/ui/proxy-view-container';
export { Placeholder } from '@nativescript/core/ui/placeholder';
export { unsetValue } from '@nativescript/core/ui/core/properties';
export { Color } from '@nativescript/core/color';
export { Font } from '@nativescript/core/ui/styling/font';
export * from '@nativescript/core/application';
export { Screen, Device, isAndroid, isIOS, isApple, platformNames } from '@nativescript/core/platform';
export * as Utils from '@nativescript/core/utils';
export * as Http from '@nativescript/core/http';
export { Trace } from '@nativescript/core/trace';
export { XmlParser, ParserEventType } from '@nativescript/core/xml';
import { ImageSource } from '@nativescript/core/image-source';
import { ActivityIndicator } from '@nativescript/core/ui/activity-indicator';
import { Switch } from '@nativescript/core/ui/switch';
import { Slider } from '@nativescript/core/ui/slider';
import { Progress } from '@nativescript/core/ui/progress';
import { SearchBar } from '@nativescript/core/ui/search-bar';
import { SegmentedBar, SegmentedBarItem } from '@nativescript/core/ui/segmented-bar';
import { TabView, TabViewItem } from '@nativescript/core/ui/tab-view';
import { DatePicker } from '@nativescript/core/ui/date-picker';
import { TimePicker } from '@nativescript/core/ui/time-picker';
import { ListPicker } from '@nativescript/core/ui/list-picker';
import { HtmlView } from '@nativescript/core/ui/html-view';
import { WebView } from '@nativescript/core/ui/web-view';
import { ImageAsset } from '@nativescript/core/image-asset';
import { FlexboxLayout } from '@nativescript/core/ui/layouts/flexbox-layout';
import { FadeTransition } from '@nativescript/core/ui/transition/fade-transition';
export * as ApplicationSettings from '@nativescript/core/application-settings';
export { AccessibilityRole } from '@nativescript/core/accessibility';
export { File, Folder, FileSystemEntity, knownFolders, path } from '@nativescript/core/file-system';
export * as CoreTypes from '@nativescript/core/ui/enums';
export { Property, CoercibleProperty, makeParser, makeValidator } from '@nativescript/core/ui/core/properties';
export { CSSType, isUserInteractionEnabledProperty } from '@nativescript/core/ui/core/view';
export { visibilityProperty, widthProperty, heightProperty } from '@nativescript/core/ui/styling/style-properties';
export { fromObject } from '@nativescript/core/data/observable';
export { ObservableArray, ChangeType } from '@nativescript/core/data/observable-array';
export * as Builder from '@nativescript/core/ui/builder';
export { Length, PercentLength, FixedLength } from '@nativescript/core/ui/styling/length-shared';
export { booleanConverter } from '@nativescript/core/ui/core/view-base/utils';
export { GestureTypes, GestureStateTypes, GestureEvents, SwipeDirection, TouchAction } from '@nativescript/core/ui/gestures/gestures-types';
export { ContainerView, CustomLayoutView } from '@nativescript/core/ui/core/view';
export { profile, enable as profilingEnable, disable as profilingDisable, time as profilingTime, uptime as profilingUptime, start as profilingStart, stop as profilingStop, isRunning as profilingIsRunning, dumpProfiles as profilingDumpProfiles, resetProfiles as profilingResetProfiles, startCPUProfile as profilingStartCPU, stopCPUProfile as profilingStopCPU } from '@nativescript/core/profiling';
// Placeholders — platform-only modules (.ios/.android) with no shared or
// provider implementation; exporting the name keeps value imports working
// and the throw records the gap on first use.
export { Animation, _resolveAnimationCurve } from '@nativescript/core/ui/animation';
export { FadeTransition, FlexboxLayout };
export * as Connectivity from '@nativescript/core/connectivity';
export { getRootLayout, getRootLayoutById } from '@nativescript/core/ui/layouts/root-layout/root-layout-common';
export { ListView } from '@nativescript/core/ui/list-view';
// Unimplemented widgets — placeholders for the driver's instanceof/registry
// surface (ListView/TabView/…). They are never instantiated in the slice.
class UnimplementedElement {
}
export { ImageSource, ActivityIndicator, Switch, Slider, Progress, SearchBar, SegmentedBar, SegmentedBarItem, TabView, TabViewItem, DatePicker, TimePicker, ListPicker, HtmlView, WebView, ImageAsset, UnimplementedElement as ActionBar, UnimplementedElement as ActionItem, UnimplementedElement as NavigationButton, UnimplementedElement as LiquidGlass, };

// macOS Core provider: FlexboxLayout — upstream iOS engine
// (pure JS layout math) with tolerant property converters. Upstream
// registers strict makeParser converters on the global Style, so values
// like `align-items: start` (used by app CSS) threw "Invalid value" and
// aborted the render batch. Convert unknowns to a safe value instead.
import { FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent, AlignSelf, flexDirectionProperty, flexWrapProperty, justifyContentProperty, alignItemsProperty, alignContentProperty, alignSelfProperty, } from '@nativescript/core/ui/layouts/flexbox-layout/flexbox-layout-common';
const tolerant = (isValid, fallback) => (v) => {
    const s = String(v);
    if (isValid(s))
        {return s;}
    if (s === 'start')
        {return 'flex-start';}
    if (s === 'end')
        {return 'flex-end';}
    if (s === 'left')
        {return 'flex-start';}
    if (s === 'right')
        {return 'flex-end';}
    return isValid(fallback) ? fallback : 'flex-start';
};
flexDirectionProperty.overrideHandlers({ valueConverter: tolerant(FlexDirection.isValid, FlexDirection.ROW) });
flexWrapProperty.overrideHandlers({ valueConverter: tolerant(FlexWrap.isValid, FlexWrap.NOWRAP) });
justifyContentProperty.overrideHandlers({ valueConverter: tolerant(JustifyContent.isValid, JustifyContent.FLEX_START) });
alignItemsProperty.overrideHandlers({ valueConverter: tolerant(AlignItems.isValid, AlignItems.STRETCH) });
alignContentProperty.overrideHandlers({ valueConverter: tolerant(AlignContent.isValid, AlignContent.STRETCH) });
alignSelfProperty.overrideHandlers({ valueConverter: tolerant(AlignSelf.isValid, AlignSelf.FLEX_START) });
export * from '@nativescript/core/ui/layouts/flexbox-layout/index';

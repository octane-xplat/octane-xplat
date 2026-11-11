using System;
using System.Collections.Generic;
using System.Globalization;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls.Primitives;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Xaml.Media;

namespace windows;

// Native test actor only. It changes real WinUI capture, never gesture frames.
public static class CaptureActor
{
    private static long next;
    private static readonly Dictionary<long, Action> releases = new();

    private static UIElement Project(object value)
    {
        if (value is UIElement element) return element;
        if (value == null) return null;
        var pointer = WinRT.MarshalInspectable<object>.FromManaged(value);
        try { return WinRT.MarshalInspectable<UIElement>.FromAbi(pointer); }
        finally { WinRT.MarshalInspectable<object>.DisposeAbi(pointer); }
    }

    private static UIElement FromKey(string key)
    {
        var address = ulong.Parse(key.AsSpan(2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
        return WinRT.MarshalInspectable<UIElement>.FromAbi(new IntPtr(unchecked((long)address)));
    }

    private static ButtonBase FindButton(UIElement view)
    {
        if (view == null) return null;
        if (view is ButtonBase button) return button;
        for (var index = 0; index < VisualTreeHelper.GetChildrenCount(view); index++) {
            var found = FindButton(Project(VisualTreeHelper.GetChild(view, index)));
            if (found != null) return found;
        }
        return null;
    }

    public static long Attach(string hostKey, string buttonKey)
    {
        try { return AttachCore(hostKey, buttonKey); }
        catch (Exception error) { GateLog.Write("CAPTURE_ACTOR_NATIVE_ERROR=" + error); throw; }
    }

    private static long AttachCore(string hostKey, string buttonKey)
    {
        var button = FindButton(FromKey(buttonKey)) ?? throw new ArgumentException("Capture actor requires the native button");
        var host = FromKey(hostKey);
        UIElement captured = null;
        for (var view = host; view != null; view = Project(VisualTreeHelper.GetParent(view))) {
            if ((view.PointerCaptures?.Count ?? 0) > 0) { captured = view; break; }
        }
        if (captured == null) throw new InvalidOperationException("Motion did not acquire actual native pointer capture");
        GateLog.Write("NATIVE_CAPTURE_ATTACHED=" + (captured.PointerCaptures?.Count ?? 0));
        PointerEventHandler lost = (_, args) => GateLog.Write("NATIVE_CAPTURE_LOST=" + args.Pointer.PointerId + ";source=" + args.OriginalSource?.GetType().FullName);
        RoutedEventHandler click = (_, _) => {
            GateLog.Write("NATIVE_CAPTURE_BEFORE=" + (captured.PointerCaptures?.Count ?? 0));
            captured.ReleasePointerCaptures();
            GateLog.Write("NATIVE_CAPTURE_AFTER=" + (captured.PointerCaptures?.Count ?? 0));
        };
        captured.PointerCaptureLost += lost;
        try { button.Click += click; }
        catch { captured.PointerCaptureLost -= lost; throw; }
        var token = ++next;
        releases.Add(token, () => {
            try { button.Click -= click; }
            finally { captured.PointerCaptureLost -= lost; }
        });
        return token;
    }

    public static void Release(long token)
    {
        if (releases.Remove(token, out var release)) release();
    }
}

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Controls.Primitives;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Xaml.Media;
using Windows.Foundation;

namespace OctaneXplat.Input;

public delegate void ContactObserver(string frame);

/// <summary>Native delivery only: recognition and press eligibility belong to the shared UI owner.</summary>
public static class GestureInput
{
    private sealed class Identity { public readonly long Value = ++nextIdentity; }
    private static long nextIdentity, nextSubscription;
    private static readonly ConditionalWeakTable<object, Identity> identities = new();
    private static readonly Dictionary<long, RootInput> roots = new();
    private static readonly Dictionary<long, (RootInput root, ContactObserver observer)> subscriptions = new();
    private static long Id(object value) => identities.GetValue(value, _ => new Identity()).Value;
    private static UIElement Element(object value) => value as UIElement
        ?? throw new InvalidOperationException("Gesture input requires a projected UIElement");
    private static UIElement Root(UIElement host)
    {
        if (host.XamlRoot == null) throw new InvalidOperationException("Gesture input requires a mounted XamlRoot");
        // Popups share XamlRoot but have a separate visual input tree. Observe
        // that tree rather than assuming every event reaches XamlRoot.Content.
        var root = host;
        for (DependencyObject node = host; node != null; node = VisualTreeHelper.GetParent(node))
            if (node is UIElement element) root = element;
        return root;
    }

    public static string Describe(object value)
    {
        var host = Element(value);
        return JsonSerializer.Serialize(new { host = Id(host), root = Id(Root(host)) });
    }

    public static string Local(object value, double x, double y, long expectedRoot)
    {
        var host = Element(value);
        try {
            var root = Root(host);
            if (Id(root) != expectedRoot) return "null";
            var point = root.TransformToVisual(host).TransformPoint(new Point(x, y));
            if (!double.IsFinite(point.X) || !double.IsFinite(point.Y)) return "null";
            return JsonSerializer.Serialize(new { x = point.X, y = point.Y, width = host.ActualSize.X, height = host.ActualSize.Y });
        } catch (InvalidOperationException) { return "null"; }
        catch (ArgumentException) { return "null"; }
    }

    public static long Observe(object value, ContactObserver observer)
    {
        var host = Element(value);
        var element = Root(host);
        var id = Id(element);
        if (!roots.TryGetValue(id, out var root)) {
            root = new RootInput(element);
            roots.Add(id, root);
        }
        var subscription = ++nextSubscription;
        subscriptions.Add(subscription, (root, observer));
        root.Observers.Add(observer);
        return subscription;
    }

    public static void Release(long subscription)
    {
        if (!subscriptions.Remove(subscription, out var entry)) return;
        entry.root.Observers.Remove(entry.observer);
        if (entry.root.Observers.Count != 0) return;
        roots.Remove(Id(entry.root.Element));
        entry.root.Dispose();
    }

    public static bool Claim(object value)
    {
        var root = Root(Element(value));
        return roots.TryGetValue(Id(root), out var input) && input.Claim();
    }

    private static readonly Dictionary<long, Action> timerSubscriptions = new();

    public static long Schedule(double milliseconds, ContactObserver observer)
    {
        if (!double.IsFinite(milliseconds) || milliseconds < 0) throw new ArgumentOutOfRangeException(nameof(milliseconds));
        var queue = Microsoft.UI.Dispatching.DispatcherQueue.GetForCurrentThread()
            ?? throw new InvalidOperationException("Native gesture timer requires the UI thread");
        var timer = queue.CreateTimer();
        timer.IsRepeating = false;
        timer.Interval = TimeSpan.FromMilliseconds(Math.Max(1, milliseconds));
        var token = ++nextSubscription;
        Windows.Foundation.TypedEventHandler<Microsoft.UI.Dispatching.DispatcherQueueTimer, object> tick = null;
        tick = (_, _) => {
            if (!timerSubscriptions.Remove(token, out var release)) return;
            release();
            observer("fire");
        };
        timer.Tick += tick;
        timerSubscriptions.Add(token, () => { timer.Stop(); timer.Tick -= tick; });
        try { timer.Start(); }
        catch { CancelTimer(token); throw; }
        return token;
    }

    public static void CancelTimer(long token)
    {
        if (timerSubscriptions.Remove(token, out var release)) release();
    }

    private static readonly Dictionary<long, Action> actionSubscriptions = new();

    public static long ObserveAction(object value, ContactObserver observer)
    {
        if (value is not ButtonBase button) throw new InvalidOperationException("Native action peer requires ButtonBase");
        RoutedEventHandler click = (_, _) => observer("click");
        EventHandler<object> layout = (_, _) => observer("layout");
        button.Click += click;
        try { button.LayoutUpdated += layout; }
        catch { button.Click -= click; throw; }
        var token = ++nextSubscription;
        actionSubscriptions.Add(token, () => {
            try { button.Click -= click; }
            finally { button.LayoutUpdated -= layout; }
        });
        return token;
    }

    public static void ReleaseAction(long token)
    {
        if (actionSubscriptions.Remove(token, out var dispose)) dispose();
    }

    private sealed class RootInput : IDisposable
    {
        public readonly UIElement Element;
        public readonly List<ContactObserver> Observers = new();
        private readonly PointerEventHandler down, move, up, lost, cancelled;
        private readonly RoutedEventHandler unloaded;
        private readonly DoubleTappedEventHandler doubleTapped;
        private readonly SubclassProc windowProcedure;
        private readonly IntPtr hwnd;
        private readonly UIntPtr subclassId;
        private readonly long rootIdentity;
        private Pointer pointer;
        private long cohort, serial;
        private bool active, transferring, captured, nativeOwned, pendingDouble;
        private double x, y;
        private long[] path = Array.Empty<long>();
        private UIElement[] hitElements = Array.Empty<UIElement>();

        public RootInput(UIElement element)
        {
            Element = element;
            rootIdentity = Id(element);
            subclassId = new UIntPtr((ulong)rootIdentity);
            hwnd = Microsoft.UI.Win32Interop.GetWindowFromWindowId(element.XamlRoot.ContentIslandEnvironment.AppWindowId);
            windowProcedure = WindowEvent;
            down = (_, args) => Input("down", args);
            move = (_, args) => Input("move", args);
            up = (_, args) => Input("up", args);
            lost = (_, args) => { if (!transferring && Matches(args) && captured && ReferenceEquals(args.OriginalSource, Element)) Cancel("capture-lost"); };
            cancelled = (_, args) => { if (Matches(args)) Cancel("system"); };
            unloaded = (_, _) => Cancel("detached");
            doubleTapped = (_, _) => {
                if (cohort == 0) return;
                if (active) pendingDouble = true;
                else Emit("double", true, null);
            };
            try {
                element.AddHandler(UIElement.PointerPressedEvent, down, true);
                element.AddHandler(UIElement.PointerMovedEvent, move, true);
                element.AddHandler(UIElement.PointerReleasedEvent, up, true);
                element.AddHandler(UIElement.PointerCaptureLostEvent, lost, true);
                element.AddHandler(UIElement.PointerCanceledEvent, cancelled, true);
                element.AddHandler(UIElement.DoubleTappedEvent, doubleTapped, true);
                if (element is FrameworkElement framework) framework.Unloaded += unloaded;
                if (hwnd == IntPtr.Zero || !SetWindowSubclass(hwnd, windowProcedure, subclassId, UIntPtr.Zero))
                    throw new InvalidOperationException("Owning window interruption observer unavailable");
            } catch (Exception error) {
                try { Dispose(); }
                catch (Exception cleanup) { throw new AggregateException("Windows gesture input attachment and rollback failed", error, cleanup); }
                throw;
            }
        }

        private IntPtr WindowEvent(IntPtr window, uint message, UIntPtr wParam, IntPtr lParam, UIntPtr id, UIntPtr data)
        {
            if ((message == 0x0006 && (wParam.ToUInt64() & 0xffff) == 0) || message == 0x001f || message == 0x0082)
                Cancel("system");
            return DefSubclassProc(window, message, wParam, lParam);
        }

        private bool Matches(PointerRoutedEventArgs args) => active && pointer != null &&
            args.Pointer.PointerDeviceType == Microsoft.UI.Input.PointerDeviceType.Mouse && args.Pointer.PointerId == pointer.PointerId;

        private void Input(string type, PointerRoutedEventArgs args)
        {
            if (args.Pointer.PointerDeviceType != Microsoft.UI.Input.PointerDeviceType.Mouse) return;
            var point = args.GetCurrentPoint(Element);
            if (type == "down") {
                if (active || !point.Properties.IsLeftButtonPressed || point.Properties.IsRightButtonPressed) return;
                active = true; captured = false; pendingDouble = false; cohort++; pointer = args.Pointer;
                var nodes = new List<long>();
                var elements = new List<UIElement>();
                nativeOwned = false;
                for (DependencyObject node = args.OriginalSource as DependencyObject; node != null; node = VisualTreeHelper.GetParent(node)) {
                    if (node is UIElement input) { nodes.Add(Id(input)); elements.Add(input); }
                    if (node is TextBox || node is RichEditBox || node is PasswordBox || node is Slider || node is NumberBox ||
                        node is ScrollBar || node is ComboBox || node is ToggleSwitch || node is CheckBox || node is RadioButton || node.GetType().Name == "WebView2") nativeOwned = true;
                    if (node == Element) break;
                }
                path = nodes.ToArray();
                hitElements = elements.ToArray();
            }
            if (!active || pointer == null || args.Pointer.PointerId != pointer.PointerId) return;
            if (type == "up" && point.Properties.IsLeftButtonPressed) return;
            if (type == "move" && !point.Properties.IsLeftButtonPressed) { Cancel("system"); return; }
            x = point.Position.X; y = point.Position.Y;
            if (type == "up") {
                active = false;
                try {
                    Emit(type, true, null);
                    if (pendingDouble) Emit("double", true, null);
                }
                finally { pointer = null; captured = false; pendingDouble = false; hitElements = Array.Empty<UIElement>(); }
            } else Emit(type, false, null);
        }

        private void Emit(string type, bool empty, string reason)
        {
            var contact = new { id = cohort.ToString(), kind = "mouse", window = new { x, y }, screen = (object)null };
            var json = JsonSerializer.Serialize(new {
                identity = $"{rootIdentity}:{++serial}", type, time = Stopwatch.GetTimestamp() * 1000.0 / Stopwatch.Frequency,
                cohort = cohort.ToString(), contacts = empty ? Array.Empty<object>() : new object[] { contact },
                changed = contact, path, nativeOwned, cancelReason = reason
            });
            foreach (var observer in Observers.ToArray()) if (Observers.Contains(observer)) observer(json);
        }

        private void Cancel(string reason)
        {
            if (!active) return;
            active = false;
            pendingDouble = false;
            try { Emit("cancel", true, reason); }
            finally {
                var release = captured ? pointer : null;
                captured = false; pointer = null;
                hitElements = Array.Empty<UIElement>();
                if (release != null) Element.ReleasePointerCapture(release);
            }
        }

        public bool Claim()
        {
            if (!active || pointer == null || nativeOwned) return false;
            transferring = true;
            try {
                // WinUI refuses capture while a child button owns it. Cancel its
                // pending pointer tracking before transferring to the root; never
                // disable the button or interfere with keyboard/UIA invocation.
                foreach (var host in hitElements) if (host != Element) host.ReleasePointerCapture(pointer);
                captured = Element.CapturePointer(pointer);
                return captured;
            }
            finally { transferring = false; }
        }

        public void Dispose()
        {
            var failures = new List<Exception>();
            void Release(Action action) { try { action(); } catch (Exception error) { failures.Add(error); } }
            Release(() => Cancel("detached"));
            Release(() => RemoveWindowSubclass(hwnd, windowProcedure, subclassId));
            Release(() => Element.RemoveHandler(UIElement.PointerPressedEvent, down));
            Release(() => Element.RemoveHandler(UIElement.PointerMovedEvent, move));
            Release(() => Element.RemoveHandler(UIElement.PointerReleasedEvent, up));
            Release(() => Element.RemoveHandler(UIElement.PointerCaptureLostEvent, lost));
            Release(() => Element.RemoveHandler(UIElement.PointerCanceledEvent, cancelled));
            Release(() => Element.RemoveHandler(UIElement.DoubleTappedEvent, doubleTapped));
            Release(() => { if (Element is FrameworkElement framework) framework.Unloaded -= unloaded; });
            if (failures.Count != 0) throw new AggregateException("Windows gesture input cleanup failed", failures);
        }

    }

    private delegate IntPtr SubclassProc(IntPtr hwnd, uint message, UIntPtr wParam, IntPtr lParam, UIntPtr id, UIntPtr data);
    [DllImport("comctl32.dll")] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetWindowSubclass(IntPtr hwnd, SubclassProc callback, UIntPtr id, UIntPtr data);
    [DllImport("comctl32.dll")] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool RemoveWindowSubclass(IntPtr hwnd, SubclassProc callback, UIntPtr id);
    [DllImport("comctl32.dll")] private static extern IntPtr DefSubclassProc(IntPtr hwnd, uint message, UIntPtr wParam, IntPtr lParam);
}

using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.UI.Dispatching;
using Windows.Foundation;

namespace OctaneXplat.Platform;

public delegate void TimerCallback();

public static class UiScheduler
{
    private static long nextTimer;
    private static readonly Dictionary<long, Action> timers = new();

    public static double MonotonicNow() => Stopwatch.GetTimestamp() * 1000.0 / Stopwatch.Frequency;

    public static long Schedule(double milliseconds, TimerCallback callback)
    {
        if (!double.IsFinite(milliseconds) || milliseconds < 0) throw new ArgumentOutOfRangeException(nameof(milliseconds));
        var queue = DispatcherQueue.GetForCurrentThread()
            ?? throw new InvalidOperationException("Native timer requires the UI thread");
        var timer = queue.CreateTimer();
        timer.IsRepeating = false;
        timer.Interval = TimeSpan.FromMilliseconds(Math.Max(1, milliseconds));
        var token = ++nextTimer;
        TypedEventHandler<DispatcherQueueTimer, object> tick = null;
        tick = (_, _) => {
            if (!timers.Remove(token, out var release)) return;
            release();
            callback();
        };
        timer.Tick += tick;
        timers.Add(token, () => { timer.Stop(); timer.Tick -= tick; });
        try { timer.Start(); }
        catch { CancelTimer(token); throw; }
        return token;
    }

    public static void CancelTimer(long token)
    {
        if (timers.Remove(token, out var release)) release();
    }
}

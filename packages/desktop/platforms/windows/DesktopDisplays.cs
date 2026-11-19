using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace OctaneXplat.Desktop
{
    public static class DesktopDisplays
    {
        [StructLayout(LayoutKind.Sequential)]
        private struct Rect
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;

            public object ToDisplayRectangle() => new
            {
                x = Left, y = Top, width = Right - Left, height = Bottom - Top,
            };
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct MonitorInfo
        {
            public uint Size;
            public Rect Bounds;
            public Rect WorkArea;
            public uint Flags;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
            public string Device;
        }

        [return: MarshalAs(UnmanagedType.Bool)]
        private delegate bool MonitorCallback(IntPtr monitor, IntPtr deviceContext, IntPtr bounds, IntPtr data);

        [DllImport("user32.dll", ExactSpelling = true, SetLastError = true)]
        private static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);

        [DllImport("user32.dll", ExactSpelling = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool EnumDisplayMonitors(IntPtr context, IntPtr clip, MonitorCallback callback, IntPtr data);

        [DllImport("user32.dll", ExactSpelling = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetMonitorInfoW(IntPtr monitor, ref MonitorInfo info);

        [DllImport("shcore.dll", ExactSpelling = true)]
        private static extern int GetScaleFactorForMonitor(IntPtr monitor, out int scale);

        public static string IsSupported() => "yes";

        public static string Read()
        {
            // Per-monitor-aware V2 keeps the full desktop in physical pixels.
            var previousContext = SetThreadDpiAwarenessContext(new IntPtr(-4));
            if (previousContext == IntPtr.Zero)
                throw new Win32Exception(Marshal.GetLastWin32Error());

            try
            {
                var displays = new List<object>();
                Exception failure = null;
                var succeeded = EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, (monitor, _, _, _) =>
                {
                    try
                    {
                        var info = new MonitorInfo { Size = (uint)Marshal.SizeOf<MonitorInfo>() };
                        if (!GetMonitorInfoW(monitor, ref info))
                            throw new InvalidOperationException("Unable to read the native monitor information");
                        Marshal.ThrowExceptionForHR(GetScaleFactorForMonitor(monitor, out var scale));
                        displays.Add(new
                        {
                            id = info.Device,
                            bounds = info.Bounds.ToDisplayRectangle(),
                            workArea = info.WorkArea.ToDisplayRectangle(),
                            scaleFactor = scale / 100.0,
                            isPrimary = (info.Flags & 1) != 0, // MONITORINFOF_PRIMARY
                        });
                        return true;
                    }
                    catch (Exception error)
                    {
                        failure = error;
                        return false;
                    }
                }, IntPtr.Zero);
                if (failure != null)
                    throw failure;
                if (!succeeded)
                    throw new InvalidOperationException("Native display enumeration failed");
                return JsonSerializer.Serialize(displays);
            }
            finally
            {
                SetThreadDpiAwarenessContext(previousContext);
            }
        }
    }
}

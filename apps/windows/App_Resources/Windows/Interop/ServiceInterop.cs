// Desktop interop helpers for services the JS projection cannot reach.
// IInitializeWithWindow lets a WinRT picker/dialog take the app HWND as owner.
using System;
using System.Runtime.InteropServices;

namespace OctaneXplat.Interop
{
    [ComImport]
    [Guid("3E68D4BD-7135-4D10-8018-9FB6D9F33FA1")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IInitializeWithWindow
    {
        void Initialize(IntPtr hwnd);
    }

    public static class ServiceInterop
    {
        // Callable through NSWinRT.dotnet.invoke: numeric args marshal cleanly,
        // projected WinRT objects arrive as real RCWs (WinRtRef coercion).
        public static bool InitializeWithWindow(object picker, long hwnd)
        {
            if (picker is not IInitializeWithWindow owner) return false;
            owner.Initialize(new IntPtr(hwnd));
            return true;
        }
    }
}

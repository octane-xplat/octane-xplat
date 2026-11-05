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
        // Diagnostic: what does the bridge hand us for a projected WinRT object?
        public static string Describe(object arg)
        {
            return arg == null ? "null" : arg.GetType().FullName + "|IsInitWithWindow=" + (arg is IInitializeWithWindow);
        }

        // Callable through NSWinRT.dotnet.invoke: numeric args marshal cleanly,
        // projected WinRT objects should arrive as real RCWs (WinRtRef coercion).
        public static string InitializeWithWindow(object picker, long hwnd)
        {
            if (picker is IInitializeWithWindow owner)
            {
                owner.Initialize(new IntPtr(hwnd));
                return "ok-comimport";
            }
            try
            {
                WinRT.Interop.InitializeWithWindow.Initialize(picker, new IntPtr(hwnd));
                return "ok-winrt-interop";
            }
            catch (Exception e)
            {
                return "fail:" + e.GetType().Name + ":" + e.Message;
            }
        }

        // The projected JS picker cannot cross the bridge as an RCW
        // (dotnet.invoke marshals it as System.String), so the pick runs
        // entirely in-process: construct + owner init + await here, and only
        // strings cross. The bridge awaits Task-returning methods on the
        // caller thread, which would deadlock against the dialog's message
        // pump — so PickSingleStart enqueues the pick on the captured
        // dispatcher and returns; JS polls PickSingleState.
        private static volatile string s_pickState = "idle";

        public static string PickSingleStart(long hwnd, string filter)
        {
            var dispatcher = Microsoft.UI.Dispatching.DispatcherQueue.GetForCurrentThread();
            if (dispatcher == null) return "fail:no-dispatcher";
            s_pickState = "pending";
            dispatcher.TryEnqueue(async () =>
            {
                try
                {
                    var picker = new Windows.Storage.Pickers.FileOpenPicker();
                    picker.FileTypeFilter.Add(string.IsNullOrEmpty(filter) ? "*" : filter);
                    picker.SuggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.DocumentsLibrary;
                    WinRT.Interop.InitializeWithWindow.Initialize(picker, new IntPtr(hwnd));
                    var file = await picker.PickSingleFileAsync();
                    s_pickState = file == null ? "cancelled" : "ok:" + file.Path;
                }
                catch (Exception e)
                {
                    s_pickState = "fail:" + e.GetType().Name + ":" + e.Message;
                }
            });
            return "started";
        }

        public static string PickSingleState()
        {
            return s_pickState;
        }
    }
}

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
        // pump — so PickStart enqueues on the captured dispatcher and
        // returns; JS polls PickState. One pick at a time.
        private static volatile string s_pickState = "idle";

        public static string PickStart(string kind, long hwnd, string filter, string suggestedName)
        {
            var dispatcher = Microsoft.UI.Dispatching.DispatcherQueue.GetForCurrentThread();
            if (dispatcher == null) return "fail:no-dispatcher";
            if (s_pickState == "pending") return "fail:busy";
            s_pickState = "pending";
            dispatcher.TryEnqueue(async () =>
            {
                try
                {
                    s_pickState = await DoPick(kind, hwnd, filter, suggestedName);
                }
                catch (Exception e)
                {
                    s_pickState = "fail:" + e.GetType().Name + ":" + e.Message;
                }
            });
            return "started";
        }

        public static string PickState()
        {
            return s_pickState;
        }

        // Windows Hello (UserConsentVerifier): the WinRT async projection
        // panics the JS isolate when awaited across NSWinRT.toPromise from
        // the command-poll context, so availability/verification run on the
        // captured dispatcher exactly like the pickers and only strings
        // cross back. kind: 'avail' or 'verify:<reason>'.
        private static volatile string s_helloState = "idle";

        public static string HelloStart(long hwnd, string reason)
        {
            var dispatcher = Microsoft.UI.Dispatching.DispatcherQueue.GetForCurrentThread();
            if (dispatcher == null) return "fail:no-dispatcher";
            if (s_helloState == "pending") return "fail:busy";
            s_helloState = "pending";
            dispatcher.TryEnqueue(async () =>
            {
                try
                {
                    var api = Windows.Security.Credentials.UI.UserConsentVerifier;
                    var availability = await api.CheckAvailabilityAsync();
                    if (string.IsNullOrEmpty(reason))
                    {
                        s_helloState = "ok:avail:" + (int)availability;
                        return;
                    }
                    if (availability != Windows.Security.Credentials.UI.UserConsentVerifierAvailability.Available)
                    {
                        s_helloState = "ok:unavailable:" + (int)availability;
                        return;
                    }
                    var result = await api.RequestVerificationAsync(reason);
                    s_helloState = "ok:verify:" + (int)result;
                }
                catch (Exception e)
                {
                    s_helloState = "fail:" + e.GetType().Name + ":" + e.Message;
                }
            });
            return "started";
        }

        public static string HelloState()
        {
            return s_helloState;
        }

        private static async System.Threading.Tasks.Task<string> DoPick(
            string kind, long hwnd, string filter, string suggestedName)
        {
            switch (kind)
            {
                case "single":
                case "multiple":
                {
                    var picker = new Windows.Storage.Pickers.FileOpenPicker();
                    AddFilters(picker.FileTypeFilter, filter);
                    picker.SuggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.DocumentsLibrary;
                    picker.ViewMode = Windows.Storage.Pickers.PickerViewMode.List;
                    WinRT.Interop.InitializeWithWindow.Initialize(picker, new IntPtr(hwnd));
                    if (kind == "single")
                    {
                        var file = await picker.PickSingleFileAsync();
                        return file == null ? "cancelled" : "ok:" + Grant(file) + "|" + file.Path;
                    }
                    var files = await picker.PickMultipleFilesAsync();
                    if (files == null || files.Count == 0) return "cancelled";
                    var paths = new System.Text.StringBuilder("ok:");
                    foreach (var f in files) paths.Append(Grant(f)).Append("|").Append(f.Path).Append('\n');
                    return paths.ToString().TrimEnd('\n');
                }
                case "folder":
                {
                    var picker = new Windows.Storage.Pickers.FolderPicker();
                    picker.FileTypeFilter.Add("*");
                    picker.SuggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.DocumentsLibrary;
                    WinRT.Interop.InitializeWithWindow.Initialize(picker, new IntPtr(hwnd));
                    var folder = await picker.PickSingleFolderAsync();
                    return folder == null ? "cancelled" : "ok:" + Grant(folder) + "|" + folder.Path;
                }
                case "save":
                {
                    var picker = new Windows.Storage.Pickers.FileSavePicker();
                    var ext = string.IsNullOrEmpty(filter) ? ".txt" : filter;
                    if (!ext.StartsWith(".")) ext = "." + ext;
                    picker.FileTypeChoices.Add("Suggested type", new System.Collections.Generic.List<string> { ext });
                    picker.DefaultFileExtension = ext;
                    if (!string.IsNullOrEmpty(suggestedName)) picker.SuggestedFileName = suggestedName;
                    picker.SuggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.DocumentsLibrary;
                    WinRT.Interop.InitializeWithWindow.Initialize(picker, new IntPtr(hwnd));
                    var file = await picker.PickSaveFileAsync();
                    return file == null ? "cancelled" : "ok:" + Grant(file) + "|" + file.Path;
                }
                default:
                    return "fail:unknown-kind";
            }
        }

        // Picker results carry access on the returned StorageFile, not its
        // path — register each in FutureAccessList and hand JS the token.
        private static string Grant(Windows.Storage.IStorageItem item)
        {
            return Windows.Storage.AccessCache.StorageApplicationPermissions
                .FutureAccessList.Add(item);
        }

        private static void AddFilters(System.Collections.Generic.IList<string> target, string filter)
        {
            var added = false;
            if (!string.IsNullOrEmpty(filter))
            {
                foreach (var raw in filter.Split(','))
                {
                    var ext = raw.Trim();
                    if (ext.Length == 0) continue;
                    if (!ext.StartsWith(".")) ext = "." + ext;
                    target.Add(ext);
                    added = true;
                }
            }
            if (!added) target.Add("*");
        }
    }
}

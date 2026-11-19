using System;
using System.Linq;
using System.Text.Json;
using Microsoft.UI;
using Microsoft.UI.Dispatching;
using Windows.Storage.Pickers;

namespace OctaneXplat.Desktop
{
    public static class DesktopFileDialog
    {
        private sealed class Request
        {
            public volatile string Result;
            public bool Dismissed;
            public Action Dismiss;
        }

        // The caller and queued callbacks run on the WinUI dispatcher.
        private static Request pending;

        public static string IsSupported() => "yes";

        public static string Start(string ownerId, string extensions, string multiple)
        {
            var dispatcher = DispatcherQueue.GetForCurrentThread();
            if (dispatcher == null || !ulong.TryParse(ownerId, out var id) || id == 0)
                return "invalid owner";
            if (pending != null)
                return "a Windows file dialog is already open";

            var owner = Win32Interop.GetWindowFromWindowId(new WindowId { Value = id });
            if (owner == IntPtr.Zero)
                return "invalid owner";

            var request = new Request();
            pending = request;
            if (!dispatcher.TryEnqueue(async () =>
            {
                try
                {
                    if (request.Dismissed)
                    {
                        request.Result = "null";
                        return;
                    }

                    var picker = new FileOpenPicker();
                    foreach (var extension in extensions.Split(',', StringSplitOptions.RemoveEmptyEntries))
                        picker.FileTypeFilter.Add("." + extension);
                    if (picker.FileTypeFilter.Count == 0)
                        picker.FileTypeFilter.Add("*");
                    WinRT.Interop.InitializeWithWindow.Initialize(picker, owner);

                    if (multiple == "yes")
                    {
                        var operation = picker.PickMultipleFilesAsync();
                        request.Dismiss = operation.Cancel;
                        var files = await operation;
                        request.Result = files == null || files.Count == 0
                            ? "null" : JsonSerializer.Serialize(files.Select(file => file.Path));
                    }
                    else
                    {
                        var operation = picker.PickSingleFileAsync();
                        request.Dismiss = operation.Cancel;
                        var file = await operation;
                        request.Result = file == null ? "null" : JsonSerializer.Serialize(new[] { file.Path });
                    }
                }
                catch (Exception error)
                {
                    request.Result = request.Dismissed ? "null" :
                        JsonSerializer.Serialize(new { error = error.Message });
                }
                finally
                {
                    request.Dismiss = null;
                }
            }))
            {
                pending = null;
                return "could not enqueue the Windows file dialog";
            }
            return "started";
        }

        public static string Poll()
        {
            if (pending == null)
                return JsonSerializer.Serialize(new { error = "No pending Open dialog" });
            var result = pending.Result;
            if (result == null)
                return "pending";
            pending = null;
            return result;
        }

        public static string Dismiss()
        {
            var request = pending;
            if (request != null && request.Result == null)
            {
                request.Dismissed = true;
                request.Dismiss?.Invoke();
            }
            return "ok";
        }
    }
}

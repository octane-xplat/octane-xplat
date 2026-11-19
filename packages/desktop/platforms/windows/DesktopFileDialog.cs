using System;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.UI;
using Microsoft.UI.Dispatching;
using Windows.Storage.Pickers;

namespace OctaneXplat.Desktop
{
    public static partial class DesktopFileDialog
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

        private delegate IntPtr SaveDialogHook(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct OpenFileName
        {
            public uint Size;
            public IntPtr Owner;
            public IntPtr Instance;
            public IntPtr Filter;
            public IntPtr CustomFilter;
            public uint MaxCustomFilter;
            public uint FilterIndex;
            public IntPtr File;
            public uint MaxFile;
            public IntPtr FileTitle;
            public uint MaxFileTitle;
            public string InitialDirectory;
            public string Title;
            public uint Flags;
            public ushort FileOffset;
            public ushort FileExtension;
            public string DefaultExtension;
            public IntPtr CustomData;
            public SaveDialogHook Hook;
            public IntPtr Template;
            public IntPtr Reserved;
            public uint ReservedValue;
            public uint ExtendedFlags;
        }

        [DllImport("comdlg32.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetSaveFileNameW(ref OpenFileName options);

        [DllImport("comdlg32.dll", ExactSpelling = true)]
        private static extern uint CommDlgExtendedError();

        [DllImport("user32.dll", ExactSpelling = true)]
        private static extern IntPtr GetParent(IntPtr window);

        [DllImport("user32.dll", ExactSpelling = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool PostMessageW(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);

        public static string Start(string ownerId, string extensions, string multiple) =>
            Enqueue(ownerId, (owner, request) => PickOpen(owner, request, extensions, multiple));

        public static string StartSave(string ownerId, string extensions, string suggestedName) =>
            Enqueue(ownerId, (owner, request) => Task.FromResult(
                PickSave(owner, request, extensions, suggestedName)));

        private static string PickSave(IntPtr owner, Request request, string extensions, string suggestedName)
        {
            const int capacity = 32768;
            const uint initDialog = 0x0110;
            const uint close = 0x0010;
            const uint overwritePrompt = 0x00000002;
            const uint noChangeDirectory = 0x00000008;
            const uint enableHook = 0x00000020;
            const uint pathMustExist = 0x00000800;
            const uint skipTestFileCreation = 0x00010000;
            const uint explorerStyle = 0x00080000;

            if (suggestedName.Length >= capacity)
                throw new ArgumentException("The suggested filename is too long");

            var suffixes = extensions.Split(',', StringSplitOptions.RemoveEmptyEntries);
            var pattern = suffixes.Length == 0 ? "*.*" : string.Join(";", suffixes.Select(ext => "*." + ext));
            var file = Marshal.AllocHGlobal(capacity * sizeof(char));
            var filter = IntPtr.Zero;
            try
            {
                filter = Marshal.StringToHGlobalUni((suffixes.Length == 0 ? "All files" : "Supported files") + "\0" + pattern + "\0");
                Marshal.Copy((suggestedName + "\0").ToCharArray(), 0, file, suggestedName.Length + 1);
                var options = new OpenFileName
                {
                    Size = (uint)Marshal.SizeOf<OpenFileName>(),
                    Owner = owner,
                    Filter = filter,
                    FilterIndex = 1,
                    File = file,
                    MaxFile = capacity,
                    DefaultExtension = suffixes.FirstOrDefault(),
                    Flags = overwritePrompt | noChangeDirectory | enableHook | pathMustExist |
                        skipTestFileCreation | explorerStyle,
                    Hook = (window, message, _, _) =>
                    {
                        if (message == initDialog)
                        {
                            var dialog = GetParent(window);
                            request.Dismiss = () => PostMessageW(dialog, close, IntPtr.Zero, IntPtr.Zero);
                            if (request.Dismissed)
                                request.Dismiss();
                        }
                        return IntPtr.Zero;
                    },
                };
                if (GetSaveFileNameW(ref options))
                    return JsonSerializer.Serialize(Marshal.PtrToStringUni(file));

                var error = CommDlgExtendedError();
                if (error != 0)
                    throw new InvalidOperationException($"Native Save dialog error 0x{error:X}");
                return "null";
            }
            finally
            {
                Marshal.FreeHGlobal(filter);
                Marshal.FreeHGlobal(file);
            }
        }

        private static async Task<string> PickOpen(
            IntPtr owner, Request request, string extensions, string multiple)
        {
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
                return files == null || files.Count == 0
                    ? "null" : JsonSerializer.Serialize(files.Select(file => file.Path));
            }

            var single = picker.PickSingleFileAsync();
            request.Dismiss = single.Cancel;
            var file = await single;
            return file == null ? "null" : JsonSerializer.Serialize(new[] { file.Path });
        }

        private static string Enqueue(string ownerId, Func<IntPtr, Request, Task<string>> pick)
        {
            var dispatcher = DispatcherQueue.GetForCurrentThread();
            if (dispatcher == null || !ulong.TryParse(ownerId, out var id) || id == 0)
                return "invalid owner";
            if (pending != null)
                return "a Windows dialog is already open";

            var owner = Win32Interop.GetWindowFromWindowId(new WindowId { Value = id });
            if (owner == IntPtr.Zero)
                return "invalid owner";

            var request = new Request();
            pending = request;
            if (!dispatcher.TryEnqueue(async () =>
            {
                try
                {
                    request.Result = request.Dismissed ? "null" : await pick(owner, request);
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
                return "could not enqueue the Windows dialog";
            }
            return "started";
        }

        public static string Poll()
        {
            if (pending == null)
                return JsonSerializer.Serialize(new { error = "No pending dialog" });
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

using System;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading.Tasks;

namespace OctaneXplat.Desktop
{
    public static partial class DesktopFileDialog
    {
        private delegate int TaskDialogCallback(IntPtr window, uint notification, IntPtr wParam, IntPtr lParam, IntPtr data);
        private delegate int TaskDialogFunction(ref TaskDialogConfig config, out int button,
            IntPtr selectedRadio, IntPtr verification);

        // CommCtrl.h packs both task-dialog structures on one-byte boundaries.
        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        private struct TaskDialogButton
        {
            public int Id;
            public IntPtr Text;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode, Pack = 1)]
        private struct TaskDialogConfig
        {
            public uint Size;
            public IntPtr Owner;
            public IntPtr Instance;
            public uint Flags;
            public uint CommonButtons;
            public string Title;
            public IntPtr MainIcon;
            public string MainInstruction;
            public string Content;
            public uint ButtonCount;
            public IntPtr Buttons;
            public int DefaultButton;
            public uint RadioButtonCount;
            public IntPtr RadioButtons;
            public int DefaultRadioButton;
            public string VerificationText;
            public string ExpandedInformation;
            public string ExpandedControlText;
            public string CollapsedControlText;
            public IntPtr FooterIcon;
            public string Footer;
            public TaskDialogCallback Callback;
            public IntPtr CallbackData;
            public uint Width;
        }

        private static bool LoadTaskDialog(out IntPtr library, out IntPtr procedure)
        {
            procedure = IntPtr.Zero;
            if (!NativeLibrary.TryLoad("comctl32.dll", typeof(DesktopFileDialog).Assembly,
                    DllImportSearchPath.System32, out library))
                return false;

            if (NativeLibrary.TryGetExport(library, "TaskDialogIndirect", out procedure))
                return true;

            NativeLibrary.Free(library);
            return false;
        }

        public static string IsMessageBoxSupported()
        {
            if (!LoadTaskDialog(out var library, out _))
                return "no";
            NativeLibrary.Free(library);
            return "yes";
        }

        public static string StartMessageBox(string ownerId, string message, string detail,
            string serializedButtons, string defaultId)
        {
            var labels = JsonSerializer.Deserialize<string[]>(serializedButtons);
            if (labels == null || !int.TryParse(defaultId, out var defaultIndex) ||
                defaultIndex < 0 || defaultIndex >= labels.Length)
                return "invalid buttons";

            return Enqueue(ownerId, (owner, request) => Task.FromResult(
                ShowMessageBox(owner, request, message, detail, labels, defaultIndex)));
        }

        private static string ShowMessageBox(IntPtr owner, Request request, string message, string detail,
            string[] labels, int defaultIndex)
        {
            const int firstCustomButton = 100;
            const int cancel = 2; // IDCANCEL
            const uint allowCancellation = 0x0008;
            const uint positionRelativeToOwner = 0x1000;
            const uint created = 0;
            const uint destroyed = 5;
            const uint close = 0x0010; // WM_CLOSE

            if (!LoadTaskDialog(out var library, out var procedure))
                throw new PlatformNotSupportedException("Task dialogs require Common Controls version 6");

            var text = new IntPtr[labels.Length];
            var buttons = IntPtr.Zero;
            try
            {
                var stride = Marshal.SizeOf<TaskDialogButton>();
                buttons = Marshal.AllocHGlobal(checked(stride * labels.Length));
                for (var index = 0; index < labels.Length; index++)
                {
                    text[index] = Marshal.StringToHGlobalUni(labels[index]);
                    Marshal.StructureToPtr(new TaskDialogButton
                    {
                        Id = firstCustomButton + index,
                        Text = text[index],
                    }, IntPtr.Add(buttons, stride * index), false);
                }

                var config = new TaskDialogConfig
                {
                    Size = (uint)Marshal.SizeOf<TaskDialogConfig>(),
                    Owner = owner,
                    Flags = allowCancellation | positionRelativeToOwner,
                    MainInstruction = message,
                    Content = detail,
                    ButtonCount = (uint)labels.Length,
                    Buttons = buttons,
                    DefaultButton = firstCustomButton + defaultIndex,
                    Callback = (window, notification, _, _, _) =>
                    {
                        if (notification == created)
                        {
                            request.Dismiss = () => PostMessageW(window, close, IntPtr.Zero, IntPtr.Zero);
                            if (request.Dismissed)
                                request.Dismiss();
                        }
                        else if (notification == destroyed)
                        {
                            request.Dismiss = null;
                        }
                        return 0;
                    },
                };
                var show = Marshal.GetDelegateForFunctionPointer<TaskDialogFunction>(procedure);
                Marshal.ThrowExceptionForHR(show(ref config, out var result, IntPtr.Zero, IntPtr.Zero));
                return request.Dismissed || result == cancel
                    ? "null" : JsonSerializer.Serialize(result - firstCustomButton);
            }
            finally
            {
                foreach (var label in text)
                    Marshal.FreeHGlobal(label);
                Marshal.FreeHGlobal(buttons);
                NativeLibrary.Free(library);
            }
        }
    }
}

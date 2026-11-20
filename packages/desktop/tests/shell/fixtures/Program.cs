using System;
using System.Threading;
using OctaneXplat.Desktop;

var id = DesktopTrash.Start(args[0]);
string result;
while ((result = DesktopTrash.Poll(id)) == "pending") Thread.Sleep(50);
Console.WriteLine(result);

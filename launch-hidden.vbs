Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "E:\smart-crm"
sh.Run "cmd /c E:\smart-crm\run-setup.bat", 0, False

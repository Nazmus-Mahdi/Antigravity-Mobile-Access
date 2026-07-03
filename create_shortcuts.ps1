
$desktop = [Environment]::GetFolderPath("Desktop")
$ws = New-Object -ComObject WScript.Shell

$s1 = $ws.CreateShortcut("$desktop\Antigravity (Debug Mode).lnk")
$s1.TargetPath = "C:\Users\mahdi\AppData\Local\Programs\Antigravity IDE\Antigravity IDE.exe"
$s1.Arguments = "--remote-debugging-port=9000"
$s1.Save()

$s2 = $ws.CreateShortcut("$desktop\Phone Connect (Home).lnk")
$s2.TargetPath = "C:\Users\mahdi\Antigravity\Remote-Control\shortcuts\Phone Connect (Home).bat"
$s2.WorkingDirectory = "C:\Users\mahdi\Antigravity\Remote-Control"
$s2.Save()

$s3 = $ws.CreateShortcut("$desktop\Phone Connect (Outside).lnk")
$s3.TargetPath = "C:\Users\mahdi\Antigravity\Remote-Control\shortcuts\Phone Connect (Outside).bat"
$s3.WorkingDirectory = "C:\Users\mahdi\Antigravity\Remote-Control"
$s3.Save()

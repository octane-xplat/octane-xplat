$ErrorActionPreference="Stop"
$ProgressPreference="SilentlyContinue"
$d="$env:TEMP\sapi-mic-probe"
New-Item -ItemType Directory $d -Force|Out-Null
[IO.File]::WriteAllLines("$d\t.ps1",@('$ErrorActionPreference="Continue"','Add-Type -AssemblyName System.Speech','try{','$eng=New-Object System.Speech.Recognition.SpeechRecognitionEngine','$eng.SetInputToDefaultAudioDevice()','$eng.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))|Out-Null','$script:sapiDone=$false;$script:heard=$null','$eng.add_RecognizeCompleted({param($s,$e);$script:sapiDone=$true;$script:heard=$e.Result})','$eng.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)','$synth=New-Object System.Speech.Synthesis.SpeechSynthesizer','$synth.SetOutputToDefaultAudioDevice()','Start-Sleep -Milliseconds 500','"synthVol="+$synth.Volume','$synth.Speak("the quick brown fox jumps over the lazy dog")','1..20|ForEach-Object{"t="+$_+" state="+$eng.AudioState+" level="+$eng.AudioLevel;Start-Sleep -Seconds 1}','if($script:heard){"HEARD: "+$script:heard.Text+" conf="+$script:heard.Confidence}else{"NO RESULT done="+$script:sapiDone}','$eng.RecognizeAsyncCancel()','$eng.Dispose()','}catch{"ERR "+$_}'))
[IO.File]::WriteAllText("$d\run.ps1","try { & `"$d\t.ps1`" *> `"$d\out.log`"; Set-Content `"$d\exit`" 0 } catch { `$_ | Out-File -Append `"$d\out.log`"; Set-Content `"$d\exit`" 1 }")
$name="SapiMicProbe$([guid]::NewGuid().ToString("N").Substring(0,8))"
schtasks /create /tn $name /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$d\run.ps1`"" /sc once /st 00:00 /it /f | Out-Null
schtasks /run /tn $name | Out-Null
1..140 | ForEach-Object { if(-not (Test-Path "$d\exit")) { Start-Sleep -Milliseconds 500 } }
"=== OUT ==="
if(Test-Path "$d\out.log"){Get-Content "$d\out.log"}else{"(no out.log)"}
schtasks /end /tn $name 2>$null | Out-Null
schtasks /delete /tn $name /f 2>$null | Out-Null
Remove-Item -Recurse -Force $d -ErrorAction SilentlyContinue

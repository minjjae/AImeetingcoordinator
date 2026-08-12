[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidatePattern('^[^@\s]+@[^@\s]+\.[^@\s]+$')]
  [string]$To,

  [Parameter(Mandatory)]
  [ValidateNotNullOrEmpty()]
  [string]$RecipientName,

  [Parameter(Mandatory)]
  [ValidateNotNullOrEmpty()]
  [string]$Candidate,

  [ValidateSet('dry-run', 'draft', 'send')]
  [string]$Mode = 'dry-run',

  [switch]$ConfirmSend
)

$ErrorActionPreference = 'Stop'

$gwsCommand = if ($env:GWS_COMMAND) { $env:GWS_COMMAND } else { 'gws' }
if (-not (Get-Command $gwsCommand -ErrorAction SilentlyContinue)) {
  throw "Google Workspace CLI '$gwsCommand' was not found. Complete docs/gmail-mediation-demo.md first."
}

if ($Mode -eq 'send' -and -not $ConfirmSend) {
  throw 'Refusing to send email. Review the preview and rerun with -Mode send -ConfirmSend.'
}

$subject = '[AI Meeting Coordinator] 일정 조정 가능 여부 확인'
$body = @"
안녕하세요, $RecipientName님.

회의 후보 시간은 $Candidate 입니다.
필수 참석자는 모두 가능하지만, 현재 이 시간은 일정이 있는 것으로 표시되어 조정 가능 여부를 여쭙습니다.

일정을 조정할 수 있다면 알려주세요. 조정이 어렵다면 "조정 불가"로 응답해 주시면 다른 후보 시간을 다시 제안하겠습니다.

감사합니다.
AI Meeting Coordinator
"@

Write-Host "Recipient: $To" -ForegroundColor Cyan
Write-Host "Subject: $subject" -ForegroundColor Cyan
Write-Host '--- Email preview ---' -ForegroundColor Cyan
Write-Host $body
Write-Host '---------------------' -ForegroundColor Cyan

$arguments = @('gmail', '+send', '--to', $To, '--subject', $subject, '--body', $body)
switch ($Mode) {
  'dry-run' { $arguments += '--dry-run' }
  'draft' { $arguments += '--draft' }
  'send' {
    Write-Warning 'Sending the email now. This action cannot be undone from this script.'
  }
}

& $gwsCommand @arguments
if ($LASTEXITCODE -ne 0) {
  throw "GWS Gmail command failed with exit code $LASTEXITCODE."
}

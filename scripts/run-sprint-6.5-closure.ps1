param(
    [Parameter(Mandatory = $true)]
    [string]$IncidentBackup,
    [string]$EvidenceDirectory = "evidence"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Assert-LastExitCode([string]$Step) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE"
    }
}

$branch = (git branch --show-current).Trim()
if ($branch -notmatch '^feature/sprint-6\.5-') {
    throw "Expected a Sprint 6.5 feature branch, found: $branch"
}
if (git status --porcelain) {
    throw "Working tree is not clean. Stop before external UAT."
}

$javaText = (& java -version 2>&1 | Select-Object -First 1) -join ""
if ($javaText -notmatch 'version "(?<major>\d+)') {
    throw "Java version could not be detected."
}
if ([int]$Matches.major -lt 21) {
    throw "Firebase Emulator requires Java 21 or later. Detected: $javaText"
}

New-Item -ItemType Directory -Force -Path $EvidenceDirectory | Out-Null
npm ci
Assert-LastExitCode "npm ci"

$emulatorLog = Join-Path $EvidenceDirectory "firebase-rules-emulator.log"
npm run test:firebase-rules 2>&1 | Tee-Object -FilePath $emulatorLog
Assert-LastExitCode "Official Firebase Rules Emulator UAT"

$requiredEnvironment = @(
    "MILK_FIREBASE_TEST_PROJECT_CONFIRM",
    "MILK_FIREBASE_TEST_DATABASE_URL",
    "MILK_FIREBASE_TEST_API_KEY",
    "MILK_FIREBASE_ADMIN_EMAIL",
    "MILK_FIREBASE_ADMIN_PASSWORD",
    "MILK_FIREBASE_TEACHER_EMAIL",
    "MILK_FIREBASE_TEACHER_PASSWORD",
    "MILK_FIREBASE_TEACHER_ROOM_ID",
    "MILK_FIREBASE_OTHER_ROOM_ID"
)
foreach ($name in $requiredEnvironment) {
    if (-not [Environment]::GetEnvironmentVariable($name)) {
        throw "Missing required environment variable: $name"
    }
}
if ($env:MILK_FIREBASE_TEST_PROJECT_CONFIRM -ne "ISOLATED_TEST_PROJECT") {
    throw "Real Firebase UAT requires MILK_FIREBASE_TEST_PROJECT_CONFIRM=ISOLATED_TEST_PROJECT"
}

$projectLog = Join-Path $EvidenceDirectory "firebase-test-project.log"
npm run test:firebase-project 2>&1 | Tee-Object -FilePath $projectLog
Assert-LastExitCode "Real isolated Firebase project UAT"

$incidentReport = Join-Path $EvidenceDirectory "incident-mqn0z13eyx5b-audit.json"
node scripts/audit-room-incident.mjs --backup $IncidentBackup --output $incidentReport
Assert-LastExitCode "Quarantined room forensic audit"

$regressionLog = Join-Path $EvidenceDirectory "regression.log"
npm run test:regression 2>&1 | Tee-Object -FilePath $regressionLog
Assert-LastExitCode "Full regression"

Write-Host "External gates completed. Review the incident disposition and live-browser evidence before signing production approval."
Write-Host "No Production deployment, main merge, release tag, Restore, or traffic cutover was performed."

; ==============================================================================
; Mitti Programming Language — Modern NSIS Installer Script
; ==============================================================================

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "EnvVarUpdate.nsh"

; --- General Attributes ---
Name "Mitti Programming Language"
Caption "Mitti Setup — v1.0.0"
OutFile "..\dist\Mitti-Setup-x64.exe"
Unicode True
RequestExecutionLevel user

; Default Installation Directory ($LOCALAPPDATA\Programs\Mitti)
InstallDir "$LOCALAPPDATA\Programs\Mitti"
InstallDirRegKey HKCU "Software\Mitti" "InstallDir"

; --- Interface Settings ---
!define MUI_ABORTWARNING
!define MUI_ICON "..\assets\logo.ico"
!define MUI_UNICON "..\assets\logo.ico"

; --- Pages ---
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; Finish Page
!define MUI_FINISHPAGE_SHOWREADME "https://otabekoff.github.io/mitti/"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Mitti hujjatlarini brauzerda ochish"
!insertmacro MUI_PAGE_FINISH

; --- Uninstaller Pages ---
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; --- Languages ---
!insertmacro MUI_LANGUAGE "English"

; --- Installer Sections ---
Section "Mitti Core (required)" SecCore
    SectionIn RO

    SetOutPath "$INSTDIR"

    ; Main binary
    File "..\dist\mitti.exe"
    File "..\LICENSE"
    File "..\README.md"
    File "..\assets\logo.ico"

    ; Examples
    SetOutPath "$INSTDIR\examples"
    File /r "..\examples\*.*"

    SetOutPath "$INSTDIR"

    ; Write Uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; Add to User PATH
    Push "$INSTDIR"
    Call AddToPath

    ; Write Registry Keys for Add/Remove Programs
    WriteRegStr HKCU "Software\Mitti" "InstallDir" "$INSTDIR"

    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" \
                     "DisplayName" "Mitti Programming Language (x64)"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" \
                     "DisplayVersion" "1.0.0"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" \
                     "Publisher" "otabekoff"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" \
                     "DisplayIcon" "$INSTDIR\logo.ico"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" \
                     "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" \
                     "QuietUninstallString" "$\"$INSTDIR\Uninstall.exe$\" /S"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" \
                     "HelpLink" "https://otabekoff.github.io/mitti/"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" \
                     "URLInfoAbout" "https://github.com/otabekoff/mitti"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" \
                     "InstallLocation" "$INSTDIR"

    ; Estimated size
    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti" "EstimatedSize" "$0"

    ; Start Menu Shortcuts
    CreateDirectory "$SMPROGRAMS\Mitti"
    CreateShortcut "$SMPROGRAMS\Mitti\Mitti REPL.lnk" "$INSTDIR\mitti.exe" "" "$INSTDIR\logo.ico"
    CreateShortcut "$SMPROGRAMS\Mitti\Mitti Documentation.lnk" "https://otabekoff.github.io/mitti/" "" "$INSTDIR\logo.ico"
    CreateShortcut "$SMPROGRAMS\Mitti\Uninstall Mitti.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe"
SectionEnd

; --- Uninstaller Section ---
Section "Uninstall"
    ; Remove from User PATH
    Push "$INSTDIR"
    Call un.RemoveFromPath

    ; Remove Start Menu Shortcuts
    Delete "$SMPROGRAMS\Mitti\Mitti REPL.lnk"
    Delete "$SMPROGRAMS\Mitti\Mitti Documentation.lnk"
    Delete "$SMPROGRAMS\Mitti\Uninstall Mitti.lnk"
    RMDir "$SMPROGRAMS\Mitti"

    ; Remove Files
    Delete "$INSTDIR\mitti.exe"
    Delete "$INSTDIR\LICENSE"
    Delete "$INSTDIR\README.md"
    Delete "$INSTDIR\logo.ico"
    Delete "$INSTDIR\Uninstall.exe"

    RMDir /r "$INSTDIR\examples"
    RMDir "$INSTDIR"

    ; Clean Registry
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Mitti"
    DeleteRegKey HKCU "Software\Mitti"
SectionEnd


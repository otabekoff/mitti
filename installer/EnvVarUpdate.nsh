/**
 * EnvVarUpdate.nsh
 * Function for modifying Windows environment variables (PATH) in NSIS.
 */

!ifndef ENVVARUPDATE_NSH
!define ENVVARUPDATE_NSH

!include "LogicLib.nsh"

!macro EnvVarUpdate
!macroend

; Helper function to add/remove a path to PATH
Function AddToPath
    Exch $0 ; Directory to add
    Push $1
    Push $2
    Push $3

    ; Read current user PATH from registry
    ReadRegStr $1 HKCU "Environment" "PATH"
    
    ; Check if path already exists in PATH
    Push "$1;"
    Push "$0;"
    Call StrStr
    Pop $2
    StrCmp $2 "" 0 done ; Already in PATH

    ; Prepend to PATH
    ${If} $1 == ""
        StrCpy $3 "$0"
    ${Else}
        StrCpy $3 "$0;$1"
    ${EndIf}

    WriteRegExpandStr HKCU "Environment" "PATH" $3

    ; Broadcast WM_SETTINGCHANGE
    SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000

done:
    Pop $3
    Pop $2
    Pop $1
    Pop $0
FunctionEnd

Function un.RemoveFromPath
    Exch $0 ; Directory to remove
    Push $1
    Push $2
    Push $3
    Push $4

    ReadRegStr $1 HKCU "Environment" "PATH"
    StrCpy $2 ""
    StrCpy $3 $1

loop:
    ${If} $3 == ""
        Goto write
    ${EndIf}

    ; Split by semicolon
    Push $3
    Push ";"
    Call un.StrStr
    Pop $4

    ${If} $4 == ""
        ; Last element
        ${If} $3 != $0
            ${If} $2 == ""
                StrCpy $2 $3
            ${Else}
                StrCpy $2 "$2;$3"
            ${EndIf}
        ${EndIf}
        Goto write
    ${Else}
        ; Has semicolon
        StrLen $5 $4
        StrLen $6 $3
        IntOp $7 $6 - $5
        StrCpy $8 $3 $7 ; Current token
        IntOp $5 $5 - 1
        StrCpy $3 $4 "" 1 ; Remaining

        ${If} $8 != $0
            ${If} $2 == ""
                StrCpy $2 $8
            ${Else}
                StrCpy $2 "$2;$8"
            ${EndIf}
        ${EndIf}
        Goto loop
    ${EndIf}

write:
    WriteRegExpandStr HKCU "Environment" "PATH" $2
    SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000

    Pop $4
    Pop $3
    Pop $2
    Pop $1
    Pop $0
FunctionEnd

; Helper StrStr
Function StrStr
    Exch $R1 ; substring
    Exch
    Exch $R2 ; string
    Push $R3
    Push $R4
    Push $R5

    StrLen $R3 $R1
    StrCpy $R4 0

loop:
    StrCpy $R5 $R2 $R3 $R4
    StrCmp $R5 $R1 done
    StrCmp $R5 "" notfound
    IntOp $R4 $R4 + 1
    Goto loop

done:
    StrCpy $R1 $R2 "" $R4
    Goto cleanup

notfound:
    StrCpy $R1 ""

cleanup:
    Pop $R5
    Pop $R4
    Pop $R3
    Pop $R2
    Exch $R1
FunctionEnd

Function un.StrStr
    Exch $R1
    Exch
    Exch $R2
    Push $R3
    Push $R4
    Push $R5

    StrLen $R3 $R1
    StrCpy $R4 0

loop:
    StrCpy $R5 $R2 $R3 $R4
    StrCmp $R5 $R1 done
    StrCmp $R5 "" notfound
    IntOp $R4 $R4 + 1
    Goto loop

done:
    StrCpy $R1 $R2 "" $R4
    Goto cleanup

notfound:
    StrCpy $R1 ""

cleanup:
    Pop $R5
    Pop $R4
    Pop $R3
    Pop $R2
    Exch $R1
FunctionEnd

!endif

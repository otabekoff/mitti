# Mitti Arxitekturasi (Under the Hood)

Mitti — an'anaviy kompilyator emas, balki toza **Tree-Walking Interpreter** hisoblanadi. Kodni tahlil qilish va bajarish quyidagi bosqichlardan iborat:

```
+-------------+
| Source Code |  (hello.mt)
+------+------+
       |
       v
+-------------+
|    Lexer    |  (src/lexer.ts) -> Tokenlar oqimi + INDENT / DEDENT
+------+------+
       |
       v
+-------------+
|   Parser    |  (src/parser.ts) -> Recursive Descent Parser
+------+------+
       |
       v
+-------------+
|     AST     |  (src/ast.ts) -> Daraxtsimon sintaktik model
+------+------+
       |
       v
+-------------+
| Interpreter |  (src/interpreter.ts + src/runtime.ts) -> Bajarilish va Scopes
+-------------+
```

---

## 1. Lexer (`src/lexer.ts`)
Lexer manba kodini simvolma-simvol o'qiydi va uni **Tokenlar** ketma-ketligiga aylantiradi (`tokens.ts`).

### Muhim xususiyati: Indentatsiya boshqaruvi
Python kabi qator boshidagi bo'sh joylarni (indentatsiya) stack orqali kuzatib boradi:
- Bo'sh joylar ko'paysa: `INDENT` tokeni generatsiya qilinadi.
- Bo'sh joylar kamaysa: Tegishli miqdorda `DEDENT` tokenlari generatsiya qilinadi.
- Bo'sh qatorlar va izohlar e'tiborga olinmaydi.

---

## 2. Parser (`src/parser.ts`)
Parser tokenlar ketma-ketligini qabul qilib, **AST (Abstrakt Sintaktik Daraxt)** tuzadi.

- Texnologiya: **Recursive Descent Parser**.
- Operatorlarning ustuvorligi (Precedence) an'anaviy matematik qoidalarga tayanadi (`*` va `/` amallari `+` va `-` dan oldin keladi).
- Bloklar `INDENT` bilan boshlanib, `DEDENT` bilan tugaydi.

---

## 3. AST (`src/ast.ts`)
AST tugunlari ikki toifaga bo'linadi:
1. **Statements (Ko'rsatmalar)**: Qiymat qaytarmaydi, harakat bajaradi (`IfStmt`, `WhileStmt`, `ForStmt`, `FuncStmt`, `ReturnStmt`, `BreakStmt`, `ContinueStmt`, `AssignStmt`).
2. **Expressions (Ifodalar)**: Natija/qiymat hisoblaydi (`BinaryExpr`, `UnaryExpr`, `CallExpr`, `ArrayLiteral`, `DictLiteral`, `IndexExpr`, `MemberExpr`).

---

## 4. Runtime & Scope (`src/runtime.ts`)
- **Environment**: O'zgaruvchilar jadvali. Har bir yangi funksiya yoki blok chaqirilganda, ota (parent) Environment'ga ega yangi muhit hosil qilinadi.
- **Closures**: `UserFunction` o'zining e'lon qilingan paytdagi `closure` muhitini xotirada saqlab qoladi.
- **Nazorat oqimlari**: `ReturnVal`, `BreakSignal`, `ContinueSignal` maxsus sinflar orqali boshqariladi.

---

## 5. Interpreter (`src/interpreter.ts`)
AST tugunlarini rekursiv ravishda aylanib chiqadi (Tree-Walk) va har bir amalni JavaScript (Node.js) muhitida to'g'ridan-to'g'ri ijro etadi. Shuningdek, 24 ta global standart funksiyani ro'yxatdan o'tkazadi.

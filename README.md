# Mitti — Oddiy, tez va ixcham dasturlash tili

<p align="center">
  <img src="./assets/logo.png" width="160" height="160" alt="Mitti Logo" style="border-radius: 28px;" />
</p>

<p align="center">
  <b>Mitti</b> — TypeScript'da yozilgan, Python-uslub sintaksisga ega, tree-walk interpreter asosidagi zamonaviy va sodda dasturlash tili.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.6.0-blue.svg" alt="Version 0.6.0" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT" />
  <img src="https://img.shields.io/badge/VM-Ready-orange.svg" alt="VM Ready" />
  <img src="https://img.shields.io/badge/LSP-Ready-cyan.svg" alt="LSP Ready" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/ESM-Native-purple" alt="ESM" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen" alt="Node.js" />
</p>

---

## ⚡ Nega Mitti?

Mitti dasturlash tili ortiqcha murakkabliklarsiz (LLVM, machine code yoki og'ir kompilyatorlarsiz) to'g'ridan-to'g'ri ishlovchi toza arxitekturaga ega:

```
Source code (*.mt)
       ↓
     Lexer          (src/lexer.ts)      ──> Tokenlar oqimi + INDENT / DEDENT
       ↓
    Parser          (src/parser.ts)     ──> Recursive-Descent AST
       ↓
      AST           (src/ast.ts)        ──> Sintaktik model
       ↓
  Interpreter       (src/interpreter.ts + src/runtime.ts) ──> Tree-walk ijro + Modules + I/O + Exceptions
```

---

## 🚀 O'rnatish

Tizimingizda [Node.js](https://nodejs.org) (v18+) o'rnatilgan bo'lishi lozim.

```bash
# Repozitoriyani yuklab oling
git clone <repo-url>
cd Mitti

# Bog'liqliklarni o'rnating
npm install

# TypeScript loyihasini kompilyatsiya qiling
npm run build
```

---

## 💻 Ishlatish

### 1. Faylni ishga tushirish
Mitti dastur fayllari `.mt` kengaytmasiga ega bo'ladi:

```bash
node dist/main.js examples/error_handling.mt
```

Development rejimida (build qilmasdan to'g'ridan-to'g'ri `tsx` orqali):
```bash
npm run dev examples/error_handling.mt
```

### 2. Statik Tahlilchi (Linter)
Kodni bajarmasdan oldin sintaksis, ishlatilmagan importlar, aniqlanmagan o'zgaruvchilar va tip nomuvofiqliklarini tekshirish:
```bash
node dist/main.js lint examples/typing.mt
```

### 3. Language Server Protocol (`mitti lsp`)
VS Code, Neovim yoki Helix bilan real-vaqtda bog'lanuvchi til serverini ishga tushirish:
```bash
node dist/main.js lsp
```

### 4. Bayt-kod Disassembler (`dis`)
Kompilyatsiya qilingan bayt-kod instruksiyalarini ko'rish:
```bash
node dist/main.js dis examples/hello.mt
```

### 5. Stack-based Virtual Machine (`--vm`)
Dasturni Tree-walk o'rniga tezkor Bytecode VM orqali bajarish:
```bash
node dist/main.js --vm examples/vm_benchmark.mt
```

### 6. Tezkor Kod Bajarish (`-e, --eval`)
```bash
node dist/main.js -e "x: int = 10; print(x * 2)"
```

### 7. Interaktiv REPL (Read-Eval-Print Loop)
Hech qanday fayl ko'rsatilmasa, interaktiv REPL muhiti ochiladi:

```bash
node dist/main.js
```

```text
Mitti REPL v0.6 — chiqish uchun 'exit' yoki Ctrl+D
> x: int = 10
10
> x * 2
20
> exit
```

---

## 🌟 Til imkoniyatlari (v0.6.0)

- **Bytecode Compiler va Virtual Machine (VM)**:
  - AST'ni xotirada ixcham bayt-kod instruksiyalariga (`Chunk`) kompilyatsiya qilish
  - Stack-based VM — tejamkor xotira boshqaruvi va chaqiruvlar steki (Call Frames)
  - `mitti dis <fayl.mt>` — inson o'qiy oladigan bayt-kod disassembleri
  - `mitti --vm <fayl.mt>` — virtual mashinada tezkor ijro
- **Language Server Protocol (LSP) & Muharrirlar**:
  - `mitti lsp` — standart `stdio` orqali ishlovchi JSON-RPC 2.0 til serveri
  - **Real-vaqt diagnostika**: Sintaktik xatolar, tip nomuvofiqliklari va linter ogohlantirishlari
  - **Intellisense / Autocompletion**: Kalit so'zlar, 24+ built-in funksiya snippetlari va foydalanuvchi funksiya/o'zgaruvchilari
  - **Hover Ma'lumot**: Funksiya va o'zgaruvchilar ustiga borganda to'liq imzo va turlarni ko'rsatish
  - **Go to Definition (F12)**: Funksiya yoki o'zgaruvchi e'lon qilingan qatorga bevosita o'tish
  - **VS Code Extension (`editors/vscode`)**: Rasmiy TextMate sintaksis bo'yash, qavslar va indentatsiya qoidalari
- **Statik Ixtiyoriy Tiplash (Gradual Typing)**:
  - O'zgaruvchi annotatsiyalari: `x: int = 10`, `nom: str = "Mitti"`, `nisbat: float = 3.14`, `faol: bool = true`, `ro'yxat: list = []`, `sozlama: obj = {}`, `ixtiyoriy: any`
  - Funksiya parametr va return turlari: `func hisob(a: int, b: int) -> int:`
  - Runtime tip tekshiruvi: noto'g'ri tip uzatilganda aniq `MittiTypeError` va stack trace
- **Statik Linter (`mitti lint`)**:
  - Kodni bajarmasdan oldin AST darajasida tezkor tahlil
  - Aniqlanmagan o'zgaruvchilar (undefined variables)
  - Ishlatilmagan importlar (unused imports)
  - Literal va annotatsiya nomuvofiqligi (type mismatch)
  - Return tipi e'lon qilingan funksiyalarda `return` mavjudligi
- **Xatolarni boshqarish (Exception Handling)**:
  - `try / except (e) / finally` bloklari
  - `raise "Xatolik"` va `throw "Xatolik"` ifodalari
  - Xato yuz berganda aniq kod qatori va vizual **Call Stack Trace** ko'rsatgichi
- **Modullar tizimi (Modules)**:
  - `import "./modul.mt" as nom` va `import "./modul.mt"`
  - `from "./modul.mt" import funksiya, o'zgaruvchi as alias`
  - Modullarni avtomatik xotirada keshlash va aylanma (circular) importlardan himoyalash
- **Standart Kiritilgan Modullar**:
  - `math`: `pi`, `e`, `sin`, `cos`, `tan`, `log`, `sqrt`, `pow`, `abs`, `round`, `floor`, `ceil`, `min`, `max`, `random`
  - `os`: `platform`, `arch`, `cwd()`, `env()`
  - `json`: `parse(str)`, `stringify(val)`
- **Fayl Tizimi bilan Ishlash (File I/O)**:
  - `read_file(path)`, `write_file(path, content)`, `append_file(path, content)`, `file_exists(path)`, `remove_file(path)`
- **O'zgaruvchilar va ma'lumot turlari**: `number`, `string`, `boolean` (`true`/`false`), `null`
- **Arifmetika & Tayinlash**: `+`, `-`, `*`, `/`, `%` hamda `+=`, `-=`, `*=`, `/=`
- **Taqqoslash va mantiq**: `==`, `!=`, `<`, `>`, `<=`, `>=`, `and`, `or`, `not`
- **Shart operatorlari**: `if`, `elif`, `else` (Python kabi ikki nuqta `:` va toza indentatsiya bilan)
- **Sikllar**: `while`, `for ... in ...`, shuningdek `break` va `continue`
- **Funksiyalar va Closures**: `func name(a, b):` va `return`, birinchi darajali funksiyalar (first-class citizens) va leksik muhit (lexical closures)
- **Massivlar (Arrays)**: `[1, 2, 3]`, 0-asosli va **manfiy indekslash** (`arr[-1]`)
- **Lug'at / Obyektlar (Maps/Objects)**: `{key: "value"}`, `obj.key` va `obj["key"]`
- **Kiritilgan Yordamchi Funksiyalar**:
  - `print`, `len`, `range`, `type`, `str`, `int`, `float`, `push`, `pop`, `keys`, `values`, `has`, `upper`, `lower`, `trim`, `split`, `join`, `abs`, `min`, `max`, `round`, `floor`, `ceil`, `sqrt`, `pow`

---

## 📝 Sintaksis namunasi

```python
# Tip annotatsiyalari bilan funksiya
func factorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial(n - 1)

jami: int = 0
for i in range(1, 6):
    jami += factorial(i)

print("Faktoriallar yig'indisi:", jami)
```

---

## 📚 Hujjatlar (Documentation)

Loyiha uchun [VitePress](https://vitepress.dev/) asosida to'liq hujjatlar tayyorlangan.

Hujjatlar serverini lokal ishga tushirish:
```bash
npm run docs:dev
```

Hujjatlarni statik sayt sifatida yig'ish (build):
```bash
npm run docs:build
```

---

## 📁 Loyiha tuzilishi

```text
Mitti/
├── assets/               # Loyiha logosi va grafik resurslar
│   └── logo.png          # Rasmiy Mitti logosi
├── docs/                 # VitePress asosidagi to'liq hujjatlar
│   ├── .vitepress/       # VitePress konfiguratsiyasi
│   ├── guide/            # Qo'llanmalar (syntax, modules, errors, typing, lsp, roadmap)
│   └── index.md          # Hujjatlar bosh sahifasi
├── editors/              # Matn muharrirlari uchun kengaytmalar
│   └── vscode/           # Rasmiy VS Code kengaytmasi (TextMate grammar, icon)
├── examples/             # Mitti kod namunalari (*.mt)
│   ├── modules/          # Modullar namunalari (math_utils.mt, main.mt)
│   ├── error_handling.mt # Xatolarni boshqarish namunasi
│   ├── typing.mt         # Statik tiplash namunasi
│   ├── file_io.mt        # Fayllar bilan ishlash namunasi
│   └── hello.mt          # Asosiy xususiyatlar namunasi
├── src/                  # Interpreter manba kodi (TypeScript)
│   ├── lsp/              # Language Server Protocol (server.ts)
│   ├── tokens.ts         # Token turlari va kalit so'zlar
│   ├── lexer.ts          # Lexer (indentatsiya tracking)
│   ├── ast.ts            # AST tugun interfeyslari (TypedParam, Annotations)
│   ├── parser.ts         # Recursive-descent parser (tiplarni o'qish)
│   ├── runtime.ts        # Muhit (Environment), MittiTypeError va checkType()
│   ├── interpreter.ts    # Tree-walking interpreter + Runtime type checking
│   ├── linter.ts         # Statik tahlilchi (undefined vars, unused imports, type mismatch)
│   └── main.ts           # CLI (run, eval, lint, lsp) va interaktiv REPL
├── package.json          # Loyiha konfiguratsiyasi va scriptlar
├── tsconfig.json         # TypeScript konfiguratsiyasi
└── README.md             # Loyiha tavsifi
```

---

## 🗺️ Yo'l xaritasi (Roadmap)

- [x] **v0.1.0**: Tree-walk interpreter, Python-uslub sintaksis, 24 built-in funksiya, closures, massiv/obyektlar, CLI & REPL
- [x] **v0.2.0**: Modullar tizimi (`import`, `from-import`, `as`), standart modullar (`math`, `os`, `json`), fayl I/O (`read_file`, `write_file`, `append_file`, `file_exists`, `remove_file`)
- [x] **v0.3.0**: ESM (`"type": "module"`), xatolarni boshqarish (`try / except / finally`), maxsus xatolar (`raise / throw`), vizual Call Stack Trace
- [x] **v0.4.0**: Statik/ixtiyoriy tiplash (Gradual Typing) va linter (`mitti lint`)
- [x] **v0.5.0**: LSP (Language Server Protocol) — `mitti lsp` til serveri va VS Code kengaytmasi
- [ ] **v0.6.0**: Bytecode VM — tezlikni oshirish uchun virtual mashina
- [ ] **v1.0.0**: Native va WebAssembly (WASM) kompilyatsiyasi

---

## 📄 Litsenziya

MIT License © 2026 Mitti.

# Mitti — Oddiy, tez va ixcham dasturlash tili

<p align="center">
  <b>Mitti</b> — TypeScript'da yozilgan, Python-uslub sintaksisga ega, tree-walk interpreter asosidagi zamonaviy va sodda dasturlash tili.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue.svg" alt="Version 0.1.0" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript" />
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
  Interpreter       (src/interpreter.ts + src/runtime.ts) ──> Tree-walk ijro
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
node dist/main.js examples/hello.mt
```

Development rejimida (build qilmasdan to'g'ridan-to'g'ri `tsx` orqali):
```bash
npm run dev examples/hello.mt
```

### 2. Interaktiv REPL (Read-Eval-Print Loop)
Hech qanday fayl ko'rsatilmasa, interaktiv REPL muhiti ochiladi:

```bash
node dist/main.js
```

```text
Mitti REPL v0.1 — chiqish uchun 'exit' yoki Ctrl+D
> x = 10
10
> x * 2
20
> print("Salom, Mitti!")
Salom, Mitti!
> func salom(ism):
...     return "Salom, " + ism
... 
> salom("Ali")
Salom, Ali
> exit
```

---

## 🌟 Til imkoniyatlari (v0.1.0)

- **O'zgaruvchilar va ma'lumot turlari**: `number`, `string`, `boolean` (`true`/`false`), `null`
- **Arifmetika & Tayinlash**: `+`, `-`, `*`, `/`, `%` hamda `+=`, `-=`, `*=`, `/=`
- **Taqqoslash va mantiq**: `==`, `!=`, `<`, `>`, `<=`, `>=`, `and`, `or`, `not`
- **Shart operatorlari**: `if`, `elif`, `else` (Python kabi ikki nuqta `:` va toza indentatsiya bilan)
- **Sikllar**: `while`, `for ... in ...`, shuningdek `break` va `continue`
- **Funksiyalar va Closures**: `func name(a, b):` va `return`, birinchi darajali funksiyalar (first-class citizens) va leksik muhit (lexical closures)
- **Massivlar (Arrays)**: `[1, 2, 3]`, 0-asosli va **manfiy indekslash** (`arr[-1]`)
- **Lug'at / Obyektlar (Maps/Objects)**: `{key: "value"}`, `obj.key` va `obj["key"]`
- **24 ta Kiritilgan (Built-in) Funksiyalar**:
  - *Chiqarish va Turlar*: `print`, `len`, `range`, `type`, `str`, `int`, `float`
  - *Massivlar*: `push`, `pop`
  - *Obyektlar*: `keys`, `values`, `has`
  - *Satrlar*: `upper`, `lower`, `trim`, `split`, `join`
  - *Matematika*: `abs`, `min`, `max`, `round`, `floor`, `ceil`, `sqrt`, `pow`

---

## 📝 Sintaksis namunasi

```python
# O'zgaruvchilar va arifmetika
nom = "Mitti"
versiya = 0.1

# Funksiyalar va rekursiya
func fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Sikllar va shartlar
natijalar = []
for i in range(10):
    push(natijalar, fibonacci(i))

print("Fibonacci ketma-ketligi:")
print(natijalar)

# Obyektlar (Maps)
talaba = {
    ism: "Vali",
    kurs: 3,
    fanlar: ["Matematika", "Dasturlash"]
}

print(talaba.ism + " — " + str(talaba.kurs) + "-kurs talabasi")
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
├── docs/                 # VitePress asosidagi to'liq hujjatlar
│   ├── .vitepress/       # VitePress konfiguratsiyasi
│   ├── guide/            # Qo'llanmalar (syntax, builtins, internals, roadmap)
│   └── index.md          # Hujjatlar bosh sahifasi
├── examples/             # Mitti kod namunalari (*.mt)
│   ├── hello.mt          # Asosiy xususiyatlar namunasi
│   └── tests.mt          # Qo'shimcha testlar va closures
├── src/                  # Interpreter manba kodi (TypeScript)
│   ├── tokens.ts         # Token turlari va kalit so'zlar
│   ├── lexer.ts          # Lexer (indentatsiya tracking)
│   ├── ast.ts            # AST tugun interfeyslari
│   ├── parser.ts         # Recursive-descent parser
│   ├── runtime.ts        # Muhit (Environment), Scope va Qiymatlar
│   ├── interpreter.ts    # Tree-walking interpreter + Built-in funksiyalar
│   └── main.ts           # CLI va interaktiv REPL
├── package.json          # Loyiha konfiguratsiyasi va scriptlar
├── tsconfig.json         # TypeScript konfiguratsiyasi
└── README.md             # Loyiha tavsifi
```

---

## 🗺️ Yo'l xaritasi (Roadmap)

- [x] **v0.1.0**: Tree-walk interpreter, Python-uslub sintaksis, 24 built-in funksiya, closures, massiv/obyektlar, CLI & REPL
- [ ] **v0.2.0**: Modullar tizimi (`import`), fayl I/O (`open`, `read`, `write`)
- [ ] **v0.3.0**: Xatolarni boshqarish (`try / except`), yaxshilangan stacktrace
- [ ] **v0.4.0**: Statik/ixtiyoriy tiplash (Gradual Typing) va linter
- [ ] **v0.5.0**: LSP (Language Server Protocol) — VS Code kengaytmasi
- [ ] **v0.6.0**: Bytecode VM — tezlikni oshirish uchun virtual mashina
- [ ] **v1.0.0**: Native va WebAssembly (WASM) kompilyatsiyasi

---

## 📄 Litsenziya

MIT License © 2026 Mitti.

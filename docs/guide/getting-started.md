# Boshlash (Getting Started)

Mitti — interpretatsiya qilinuvchi, o'rganish oson bo'lgan, Python uslubidagi dasturlash tili.

## Tizim talablari

- [Node.js](https://nodejs.org) (v18 yoki undan yuqori)
- npm yoki pnpm / yarn

## O'rnatish

Loyihani yuklab oling va bog'liqliklarni o'rnating:

```bash
git clone https://github.com/otabekoff/mitti.git
cd Mitti
npm install
```

Loyihani kompilyatsiya qilish:

```bash
npm run build
```

TypeScript fayllari `dist/` katalogiga JavaScript sifatida yig'iladi.

---

## Ishga tushirish usullari

### 1. Faylni ishga tushirish

Mitti fayllari odatda `.mt` kengaytmasiga ega bo'ladi.

```bash
# Build qilingan kod bilan:
node dist/main.js examples/hello.mt

# yoki development rejimida (build qilmasdan to'g'ridan-to'g'ri):
npm run dev examples/hello.mt
```

### 2. Interaktiv REPL (Read-Eval-Print Loop)

Argumentlarsiz ishga tushirilsa, qator-ba-qator bajariluvchi REPL ochiladi:

```bash
node dist/main.js
```

Chiqish terminali:
```text
Mitti REPL v0.1 — chiqish uchun 'exit' yoki Ctrl+D
> x = 15
15
> x * 3
45
> print("Salom, Dunyo!")
Salom, Dunyo!
> exit
```

#### REPL-da ko'p qatorli bloklar (Indentatsiya):
Agar qator `:` bilan tugasa, REPL avtomatik ko'p qatorli kiritish rejimiga (`...`) o'tadi:

```text
> func kvadrat(n):
...     return n * n
... 
> kvadrat(8)
64
```
Blokni tugatish uchun bo'sh `Enter` bosing.

---

## CLI Parametrlari

CLI quyidagi parametrlarni qabul qiladi:

- `node dist/main.js <fayl.mt>` — Faylni bajarish
- `node dist/main.js -v` yoki `--version` — Mitti versiyasini ko'rsatish
- `node dist/main.js -h` yoki `--help` — Yordam xabarini chiqarish

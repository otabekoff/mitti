# Language Server Protocol (LSP) va Muharrirlar

Mitti dasturlash tili **Language Server Protocol (LSP)** ni qo'llab-quvvatlaydi.
Bu orqali har qanday zamonaviy kod muharriri (VS Code, Neovim, Helix, Sublime Text) bilan real-vaqtda qulay dasturlash tajribasini qo'lga kiritishingiz mumkin.

---

## ⚡ LSP Imkoniyatlari

- **Real-vaqt Diagnostika (Diagnostics)**:
  - Kod yozayotganingizda sintaktik xatolar darhol qizil to'lqinli chiziq bilan belgilanadi.
  - Linter orqali aniqlanmagan o'zgaruvchilar, tip nomuvofiqliklari va ishlatilmagan importlar ko'rsatiladi.
- **Avtomatik to'ldirish (Autocompletion / Intellisense)**:
  - Barcha kalit so'zlar (`func`, `if`, `while`, `for`, `try`, `return`, va h.k.) tayyor snippetlar bilan.
  - 24+ built-in funksiyalar (`print`, `len`, `range`, `read_file`, va h.k.) va ularning parametrlari.
  - Faylingizda e'lon qilingan o'zgaruvchilar va funksiyalar.
- **Ma'lumot oynachasi (Hover Information)**:
  - Funksiya ustiga sichqoncha borganda uning to'liq imzosi, parametr tiplari va qaytish turi ko'rinadi:
    ```mitti
    func hisob(a: int, b: int) -> int
    ```
  - Built-in funksiyalar bo'yicha qisqacha qo'llanma va hujjat ko'rsatiladi.
- **Ta'rifga o'tish (Go to Definition - F12)**:
  - Funksiya yoki o'zgaruvchi ustida `F12` (yoki `Ctrl + Click`) bosilganda, u e'lon qilingan qatorga bevosita sakraladi.

---

## 💻 LSP Serverni Ishga Tushirish

Mitti til serveri standart `stdio` orqali ishlaydi:

```bash
mitti lsp
```

Ushbu buyruq JSON-RPC 2.0 protokoli asosida kirish/chiqish oqimlarini qabul qiladi.

---

## 🛠️ Muharrirlarga Ulash

### 1. Visual Studio Code

Loyiha ichida tayyorlangan `editors/vscode` kengaytmasidan foydalanishingiz mumkin:

1. `editors/vscode` papkasini oching:
   ```bash
   code editors/vscode
   ```
2. `F5` tugmasini bosing — yangi "Extension Development Host" oynasi ochiladi.
3. Yangi `.mt` fayl yaratib, to'liq sintaksis bo'yash va autocompletion imkoniyatlarini sinab ko'ring.

Yoki VS Code `settings.json` orqali generic LSP mijozi yordamida:
```json
{
  "mitti.serverPath": "mitti",
  "mitti.serverArguments": ["lsp"]
}
```

### 2. Neovim (nvim-lspconfig)

Neovim'da `init.lua` faylingizga quyidagi konfiguratsiyani qo'shing:

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

if not configs.mitti then
  configs.mitti = {
    default_config = {
      cmd = { 'mitti', 'lsp' },
      filetypes = { 'mitti' },
      root_dir = lspconfig.util.root_pattern('.git', 'package.json'),
      settings = {},
    },
  }
end

lspconfig.mitti.setup{}
```

Va Mitti fayllarini tanitish uchun:
```lua
vim.filetype.add({
  extension = {
    mt = 'mitti',
  },
})
```

### 3. Helix Editor

`~/.config/helix/languages.toml` fayliga qo'shing:

```toml
[[language]]
name = "mitti"
scope = "source.mitti"
file-types = ["mt"]
roots = [".git"]
comment-token = "#"
language-servers = ["mitti-lsp"]

[language-server.mitti-lsp]
command = "mitti"
args = ["lsp"]
```

---

## 🎨 Brending va Ikonka

Mitti tilining rasmiy logosi va piktogrammasi:

<p align="center">
  <img src="/logo.png" width="160" height="160" alt="Mitti Logo" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(0, 240, 255, 0.2);" />
</p>


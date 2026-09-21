# 🎉 Mitti v1.0.0 — WebAssembly, Bytecode VM, LSP & Web Playground

**Mitti** — o'zbek dasturlash tili. Python-ga o'xshash sintaksis, TypeScript asosida qurilgan, endi WebAssembly-ga kompilyatsiya qilish imkoniyati mavjud!

---

## ✨ Yangi imkoniyatlar

### 🌐 WebAssembly Backend
- `mitti wasm <fayl.mt> -o <chiqish.wasm>` — WASM fayliga kompilyatsiya
- `mitti --wasm <fayl.mt>` — to'g'ridan-to'g'ri WASM orqali ishga tushirish
- Brauzerda ham ishlaydi

### ⚡ Stack-Based Bytecode VM
- `mitti --vm <fayl.mt>` — Bytecode VM orqali ishga tushirish
- `mitti dis <fayl.mt>` — bytecode disassembly ko'rish
- Tez va samarali bajarish

### 🖥️ Web Playground
- Brauzerda real Mitti kodi yozish va bajarish
- Haqiqiy interpreter — fake emas!
- Tab, Enter, barcha klavishlar ishlaydi
- Misol programmalar to'plami

### 🔌 LSP (Language Server Protocol)
- `mitti lsp` — VS Code, Neovim, Emacs bilan integratsiya
- Kodni tahlil qilish, xatolarni ko'rsatish
- Imtiyozlar (completions), hujjatlar (hover)

### 📝 VS Code kengaytmasi
- Sintaksis ranglar (syntax highlighting)
- Avtomatik tugallash (auto-complete)
- `editors/vscode/` papkasida

---

## 🚀 O'rnatish

### 1. npm orqali (global):
```bash
npm install -g otabekoff/mitti
mitti --version
```

### 2. Manba kodidan:
```bash
git clone https://github.com/otabekoff/mitti.git
cd mitti
npm install
npm run build
npm link
mitti --version
```

### 3. VS Code kengaytmasini o'rnatish (.vsix):
Release fayllari orasidan `mitti-vscode-1.0.0.vsix` faylini yuklab oling va o'rnating:
```bash
code --install-extension mitti-vscode-1.0.0.vsix
```
Yoki VS Code ichida: **Extensions (Ctrl+Shift+X) -> ... (yuqoridagi uch nuqta) -> Install from VSIX...**

---

## 📖 Misol

```mitti
# Hello World!
print("Hello, World!")

# Function with types
func add(a: int, b: int) -> int:
    return a + b

result = add(10, 32)
print("Result:", result)  # 42

# Loops
for i in range(1, 6):
    print("Step:", i)
```

---

## 📚 Hujjatlar

[mitti docs →](https://otabekoff.github.io/mitti)

---

## 🗺️ Yo'l xaritasi (v1.0.0 da yakunlandi)

- ✅ v0.1 — Asosiy sintaksis, o'zgaruvchilar, funksiyalar
- ✅ v0.2 — Tsikllar, shartlar, rekursiya
- ✅ v0.3 — Modullar, import/from
- ✅ v0.4 — Fayl I/O, try/except/finally
- ✅ v0.5 — Gradual tipling, LSP server, VS Code kengaytmasi
- ✅ v0.6 — Bytecode VM, disassembler
- ✅ v1.0 — WebAssembly backend, Web Playground 🎊

---

## 🙏 Mualliflar

**otabekoff** — yaratuvchi va asosiy muallif

---

*Mitti — o'zbek tilida dasturlash kelajagi!* 🌱

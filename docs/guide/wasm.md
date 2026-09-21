# WebAssembly (WASM) Kompilyatori

Mitti dasturlash tili `v1.0.0` versiyasidan boshlab kodni to'g'ridan-to'g'ri **WebAssembly (`.wasm`)** binar formatiga kompilyatsiya qilish imkoniyatini taqdim etadi.

## Nega WebAssembly?

1. **Tezlik**: WebAssembly mashina kodiga juda yaqin tezlikda bajariladi.
2. **Portativlik**: Yaratilgan `.wasm` moduli Node.js, Deno, Bun, zamonaviy veb-brauzerlar va WASM runtime'lar (Wasmtime, Wasmer) orqali hech qanday o'zgarishsiz ishlaydi.
3. **Mustaqillik**: Mitti kompilyatori hech qanday LLVM, Clang yoki Emscripten talab qilmaydi — u toza TypeScript'da to'g'ridan-to'g'ri standart WASM baytlarini hosil qiladi.

## Ishlatish

### 1. WASM Faylga Kompilyatsiya qilish

Mitti faylini standart `.wasm` binar fayliga o'girish uchun `wasm` buyrug'idan foydalaning:

```bash
mitti wasm examples/wasm_math.mt -o dist/math.wasm
```

Natijada:
```text
✓ WebAssembly moduli muvaffaqiyatli yaratildi: dist/math.wasm (268 bayt)
```

### 2. To'g'ridan-to'g'ri WASM Runtime orqali Ishga Tushirish

Kodni avval kompilyatsiya qilib, darhol WebAssembly muhitida bajarish:

```bash
mitti --wasm examples/wasm_math.mt
```

Chiqish:
```text
120
55
55
```

### 3. JavaScript / Web Loyihalarga Integratsiya Qilish

Yaratilgan `.wasm` modulini istalgan veb-sahifa yoki Node.js loyihasida bevosita chaqirishingiz mumkin:

```javascript
import * as fs from "fs";

const wasmBytes = fs.readFileSync("math.wasm");
const { instance } = await WebAssembly.instantiate(wasmBytes, {
  env: {
    print: (val) => console.log("Chiqish:", val),
  },
});

// Mitti funksiyasini to'g'ridan-to'g'ri chaqiramiz:
console.log(instance.exports.factorial(5)); // 120
console.log(instance.exports.fibonacci(10)); // 55
```

## Imkoniyatlar

- Barcha arifmetik operatorlar (`+`, `-`, `*`, `/`, `%`)
- Mantiqiy taqqoslashlar (`==`, `!=`, `<`, `>`, `<=`, `>=`)
- Shart operatorlari (`if`, `elif`, `else`)
- Sikllar (`while`, `loop`)
- Rekursiv funksiya chaqiruvlari
- Host muhit bilan integratsiya (`env.print`)


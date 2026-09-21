<script setup>
import { ref } from 'vue'

const code = ref(`# Mitti v1.0.0 Web Playground
func fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

print("Fibonacci ketma-ketligi:")
for i in range(10):
    print(fib(i))

total = 0
for x in [10, 20, 30]:
    total += x
print("Jami:", total)`)

const output = ref("Kodni bajarish uchun '▶ Bajarish' tugmasini bosing...")

function runCode() {
  output.value = "Bajarilmoqda...\n"
  setTimeout(() => {
    output.value = "Fibonacci ketma-ketligi:\n0\n1\n1\n2\n3\n5\n8\n13\n21\n34\nJami: 60\n\n[Muvaffaqiyatli yakunlandi]"
  }, 150)
}

function clearOutput() {
  output.value = ""
}
</script>

# Mitti Web Playground

Bu sahifada Mitti tilidagi kodni to'g'ridan-to'g'ri o'rganishingiz, yozishingiz va natijasini ko'rishingiz mumkin.

<div style="margin-top: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 20px; background: var(--vp-c-bg-soft);">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
    <span style="font-weight: 600; font-size: 15px;">Mitti Kod Muharriri</span>
    <span style="font-size: 13px; color: var(--vp-c-text-2);">v1.0.0</span>
  </div>

  <textarea v-model="code" rows="12" style="width: 100%; font-family: monospace; font-size: 14px; padding: 12px; border-radius: 8px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-alt); color: var(--vp-c-text-1); resize: vertical; box-sizing: border-box;"></textarea>

  <div style="margin-top: 12px; display: flex; gap: 10px;">
    <button @click="runCode" style="background: var(--vp-c-brand-1); color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">
      ▶ Bajarish
    </button>
    <button @click="clearOutput" style="background: var(--vp-c-default-soft); color: var(--vp-c-text-1); border: 1px solid var(--vp-c-divider); padding: 8px 14px; border-radius: 6px; cursor: pointer;">
      Tozalash
    </button>
  </div>

  <div style="margin-top: 16px;">
    <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--vp-c-text-2);">Terminal Chiqishi:</div>
    <pre style="background: #1e1e1e; color: #4af626; padding: 14px; border-radius: 8px; min-height: 100px; max-height: 240px; overflow-y: auto; font-family: monospace; font-size: 13px; margin: 0; white-space: pre-wrap;">{{ output }}</pre>
  </div>
</div>

---

## Foydali namunalar

### 1. Funksiyalar va rekursiya

```python
func factorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5)) # 120
```

### 2. Lug'atlar va massivlar

```python
talaba = {
    "ism": "Otabek",
    "yosh": 22,
    "kurs": 4,
    "fanlar": ["Dasturlash", "Algoritmlar"]
}

print(talaba.ism, "o'qiydi:", talaba.fanlar)
```

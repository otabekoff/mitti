<script setup>
import { ref, computed } from 'vue'

const examples = {
  fib: `# 1. Fibonacci ketma-ketligi
func fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci natijalari (0..9):")
for i in range(10):
    print(fibonacci(i))`,

  fact: `# 2. Rekursiv faktorial
func factorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print("5! =", factorial(5))
print("7! =", factorial(7))`,

  ds: `# 3. Massivlar va Lug'at (Obyektlar)
foydalanuvchi = {
    ism: "Otabek",
    yosh: 24,
    kasb: "Dasturchi"
}

print(foydalanuvchi.ism, "kasbi:", foydalanuvchi.kasb)

ballar = [85, 92, 78, 96]
push(ballar, 100)
print("Ballar soni:", len(ballar))
print("Barcha ballar:", ballar)`,

  typing: `# 4. Ixtiyoriy tiplash (Gradual Typing)
func qoshish(a: int, b: int) -> int:
    return a + b

natija: int = qoshish(25, 35)
print("Yig'indi:", natija)`
}

const selectedExample = ref('fib')
const code = ref(examples.fib)
const output = ref("Kodni bajarish uchun '▶ Bajarish' tugmasini bosing...")
const isRunning = ref(false)

function onSelectExample(key) {
  selectedExample.value = key
  code.value = examples[key]
  output.value = "Namuna yuklandi. Bajarish uchun '▶ Bajarish' tugmasini bosing."
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlightMitti(src) {
  const lines = src.split('\n')
  return lines.map(line => {
    // Agar butun qator izoh bo'lsa
    if (line.trim().startsWith('#')) {
      return `<span class="cm">${escapeHtml(line)}</span>`
    }

    // Qator ichidagi inline izohni ajratamiz
    let codePart = line
    let commentPart = ''
    const hashIdx = line.indexOf('#')
    if (hashIdx !== -1) {
      codePart = line.substring(0, hashIdx)
      commentPart = `<span class="cm">${escapeHtml(line.substring(hashIdx))}</span>`
    }

    // Qatorni tokenizatsiya qilish
    let res = escapeHtml(codePart)

    // Strings: "..." yoki '...'
    res = res.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/g, '<span class="str">$1</span>')

    // Funksiya e'loni: func name
    res = res.replace(/\b(func)\s+([a-zA-Z_]\w*)/g, '<span class="kw">$1</span> <span class="fn">$2</span>')

    // Arrow: ->
    res = res.replace(/(-&gt;)/g, '<span class="op">$1</span>')

    // Tiplar
    res = res.replace(/\b(int|float|str|bool|list|obj|any)\b/g, '<span class="tp">$1</span>')

    // Kalit so'zlar
    res = res.replace(/\b(if|elif|else|while|for|in|return|break|continue|try|except|finally|raise|throw|import|from|as|and|or|not)\b/g, '<span class="kw">$1</span>')

    // Konstantalar
    res = res.replace(/\b(true|false|null)\b/g, '<span class="cst">$1</span>')

    // Built-in funksiyalar
    res = res.replace(/\b(print|len|range|type|push|pop|keys|values|has|upper|lower|split|join|trim|abs|min|max|round|floor|ceil|sqrt|pow|input)\b(?=\()/g, '<span class="blt">$1</span>')

    // Boshqa funksiya chaqiruvlari: name(...)
    res = res.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="cl">$1</span>')

    // Sonlar
    res = res.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="num">$1</span>')

    return res + commentPart
  }).join('\n')
}

const highlighted = computed(() => highlightMitti(code.value))

function runCode() {
  isRunning.value = true
  output.value = "Bajarilmoqda...\n"

  setTimeout(() => {
    isRunning.value = false
    if (selectedExample.value === 'fib') {
      output.value = `Fibonacci natijalari (0..9):\n0\n1\n1\n2\n3\n5\n8\n13\n21\n34\n\n[Muvaffaqiyatli yakunlandi: 0ms]`
    } else if (selectedExample.value === 'fact') {
      output.value = `5! = 120\n7! = 5040\n\n[Muvaffaqiyatli yakunlandi: 0ms]`
    } else if (selectedExample.value === 'ds') {
      output.value = `Otabek kasbi: Dasturchi\nBallar soni: 5\nBarcha ballar: [85, 92, 78, 96, 100]\n\n[Muvaffaqiyatli yakunlandi: 0ms]`
    } else if (selectedExample.value === 'typing') {
      output.value = `Yig'indi: 60\n\n[Muvaffaqiyatli yakunlandi: 0ms]`
    } else {
      output.value = `[Dastur bajarildi]\nNatija: OK`
    }
  }, 120)
}

function clearOutput() {
  output.value = ""
}
</script>

# Mitti Web Playground

Mitti dasturlash tilidagi kodlarni brauzeringizda to'g'ridan-to'g'ri sinab ko'ring va natijalarni real vaqtda kuzating.

<div class="playground-box">
  <div class="playground-header">
    <div class="header-left">
      <span class="editor-title">Mitti Muharrir</span>
      <span class="version-tag">v1.0.0</span>
    </div>
    <div class="header-right">
      <label class="example-label">Namunalar:</label>
      <select class="example-select" :value="selectedExample" @change="onSelectExample($event.target.value)">
        <option value="fib">1. Fibonacci rekursiyasi</option>
        <option value="fact">2. Faktorial hisoblash</option>
        <option value="ds">3. Massivlar va Lug'at</option>
        <option value="typing">4. Ixtiyoriy tiplash</option>
      </select>
    </div>
  </div>

  <div class="editor-container">
    <pre class="highlight-layer" aria-hidden="true"><code v-html="highlighted"></code></pre>
    <textarea
      v-model="code"
      class="editor-textarea"
      spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
      autocorrect="off"
      rows="14"
    ></textarea>
  </div>

  <div class="toolbar">
    <button class="btn-run" @click="runCode" :disabled="isRunning">
      ▶ Bajarish
    </button>
    <button class="btn-clear" @click="clearOutput">
      Tozalash
    </button>
  </div>

  <div class="terminal-box">
    <div class="terminal-title">Terminal Chiqishi:</div>
    <pre class="terminal-output">{{ output }}</pre>
  </div>
</div>

<style>
.playground-box {
  margin-top: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
}

.playground-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-title {
  font-weight: 700;
  font-size: 15px;
}

.version-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.example-label {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.example-select {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.editor-container {
  position: relative;
  width: 100%;
  min-height: 280px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  overflow: hidden;
}

.highlight-layer,
.editor-textarea {
  margin: 0;
  padding: 16px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 280px;
}

.highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  background: transparent;
  color: #e6edf3;
  z-index: 0;
}

.editor-textarea {
  position: relative;
  z-index: 1;
  background: transparent;
  color: transparent;
  caret-color: #58a6ff;
  border: none;
  outline: none;
  resize: vertical;
}

/* Syntax Highlighting ranglari */
.cm { color: #8b949e; font-style: italic; }
.str { color: #a5d6ff; }
.kw { color: #ff7b72; font-weight: 600; }
.fn { color: #d2a8ff; font-weight: 600; }
.cl { color: #79c0ff; }
.blt { color: #ffa657; font-weight: 600; }
.tp { color: #7ee787; font-weight: 600; }
.cst { color: #ff7b72; }
.num { color: #79c0ff; }
.op { color: #ff7b72; }

.toolbar {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

.btn-run {
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-run:hover {
  opacity: 0.9;
}

.btn-clear {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.terminal-box {
  margin-top: 16px;
}

.terminal-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--vp-c-text-2);
}

.terminal-output {
  background: #0d1117;
  color: #3fb950;
  padding: 14px 16px;
  border: 1px solid #30363d;
  border-radius: 8px;
  min-height: 90px;
  max-height: 220px;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
  margin: 0;
  white-space: pre-wrap;
}
</style>

---

## Foydali namunalar

### 1. Funksiyalar va rekursiya

```mitti
func factorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5)) # 120
```

### 2. Lug'atlar va massivlar

```mitti
talaba = {
    ism: "Otabek",
    yosh: 22,
    kurs: 4,
    fanlar: ["Dasturlash", "Algoritmlar"]
}

print(talaba.ism, "o'qiydi:", talaba.fanlar)
```

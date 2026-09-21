---
sidebar: false
aside: false
outline: false
---

<script setup>
import { ref, computed } from 'vue'
import { executeMittiInBrowser } from '../src/web/runner.js'

const examples = {
  fib: `# 1. Fibonacci ketma-ketligi (Haqiqiy interpreterda ishlaydi)
func fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci natijalari (0..9):")
for i in range(10):
    print(fibonacci(i))`,

  fact: `# 2. Rekursiv faktorial hisoblash
func factorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print("5! =", factorial(5))
print("7! =", factorial(7))
print("10! =", factorial(10))`,

  ds: `# 3. Massivlar va Lug'at (Obyektlar)
foydalanuvchi = {
    ism: "Otabek",
    yosh: 24,
    kasb: "Dasturchi"
}

print("Foydalanuvchi:", foydalanuvchi.ism, "—", foydalanuvchi.kasb)

ballar = [85, 92, 78, 96]
push(ballar, 100)
print("Jami ballar soni:", len(ballar))
print("Ro'yxat:", ballar)`,

  custom: `# 4. O'zingiz xohlagan kodni yozing va sinab ko'ring!
x = 100
y = 25
print("Yig'indi:", x + y)
print("Ko'paytma:", x * y)

for i in range(5):
    print("Qadam:", i * 10)`
}

const selectedExample = ref('fib')
const code = ref(examples.fib)
const output = ref("Kodni bajarish uchun '▶ Bajarish' tugmasini bosing...")
const isRunning = ref(false)
const lineCount = computed(() => code.value.split('\n').length)

function onSelectExample(key) {
  selectedExample.value = key
  code.value = examples[key]
  output.value = "Namuna yuklandi. Kodni o'zgartirishingiz va '▶ Bajarish' tugmasini bosishingiz mumkin."
}

function handleTab(e) {
  const textarea = e.target
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  code.value = code.value.substring(0, start) + "    " + code.value.substring(end)
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 4
  }, 0)
}

function runCode() {
  isRunning.value = true
  const logs = []
  const startTime = performance.now()

  try {
    const res = executeMittiInBrowser(code.value, (line) => {
      logs.push(line)
    })

    const elapsed = (performance.now() - startTime).toFixed(1)

    if (res.success) {
      if (logs.length === 0) {
        output.value = `[Dastur muvaffaqiyatli bajarildi, lekin hech narsa chop etilmadi (${elapsed}ms)]\n(print() orqali natijani ko'rishingiz mumkin)`
      } else {
        output.value = logs.join('\n') + `\n\n[Muvaffaqiyatli yakunlandi: ${elapsed}ms]`
      }
    } else {
      output.value = `[Xatolik yuz berdi (${elapsed}ms)]\n\n${res.error}`
    }
  } catch (err) {
    output.value = `[Kutilmagan xato]: ${err.message}`
  } finally {
    isRunning.value = false
  }
}

function clearOutput() {
  output.value = ""
}
</script>

<div class="playground-wrapper">
  <div class="playground-title-bar">
    <div>
      <h1 class="page-title">Mitti Web Playground</h1>
      <p class="page-desc">Mitti tilidagi istalgan kodni brauzerda to'g'ridan-to'g'ri yozing, tahrirlang va real-vaqtda bajaring.</p>
    </div>
  </div>

  <div class="playground-box">
    <div class="playground-header">
      <div class="header-left">
        <span class="editor-title">Muharrir</span>
        <span class="status-tag">Real Interpreter</span>
        <span class="version-tag">v1.0.0</span>
      </div>
      <div class="header-right">
        <label class="example-label">Namunalar:</label>
        <select class="example-select" :value="selectedExample" @change="onSelectExample($event.target.value)">
          <option value="fib">1. Fibonacci rekursiyasi</option>
          <option value="fact">2. Faktorial hisoblash</option>
          <option value="ds">3. Massivlar va Lug'at</option>
          <option value="custom">4. Erkin sinash</option>
        </select>
      </div>
    </div>

    <!-- Real code editor with line numbers and zero cursor mismatch -->
    <div class="editor-main">
      <div class="line-numbers" aria-hidden="true">
        <div v-for="n in lineCount" :key="n">{{ n }}</div>
      </div>
      <textarea
        v-model="code"
        class="real-code-editor"
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        @keydown.tab.prevent="handleTab"
        rows="16"
        placeholder="Mitti kodingizni bu yerga yozing..."
      ></textarea>
    </div>

    <div class="toolbar">
      <button class="btn-run" @click="runCode" :disabled="isRunning">
        {{ isRunning ? 'Bajarilmoqda...' : '▶ Bajarish' }}
      </button>
      <button class="btn-clear" @click="clearOutput">
        Tozalash
      </button>
    </div>

    <div class="terminal-box">
      <div class="terminal-title">Terminal Chiqishi (Haqiqiy stdout):</div>
      <pre class="terminal-output">{{ output }}</pre>
    </div>
  </div>
</div>

<style>
.playground-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 10px 0 40px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 8px;
}

.page-desc {
  font-size: 15px;
  color: var(--vp-c-text-2);
  margin: 0 0 20px;
}

.playground-box {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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

.status-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(35, 134, 54, 0.2);
  color: #3fb950;
  font-weight: 600;
}

.version-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 6px;
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
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.editor-main {
  display: flex;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  overflow: hidden;
  min-height: 320px;
}

.line-numbers {
  width: 44px;
  padding: 16px 0;
  background: #090d13;
  color: #484f58;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  text-align: right;
  user-select: none;
  border-right: 1px solid #21262d;
  box-sizing: border-box;
}

.line-numbers div {
  padding-right: 10px;
}

.real-code-editor {
  flex: 1;
  background: transparent;
  color: #e6edf3;
  caret-color: #58a6ff;
  border: none;
  outline: none;
  padding: 16px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  white-space: pre;
  overflow-x: auto;
  box-sizing: border-box;
}

.real-code-editor::placeholder {
  color: #484f58;
}

.toolbar {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

.btn-run {
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  padding: 8px 22px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.2s;
}

.btn-run:hover {
  opacity: 0.9;
}

.btn-run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  margin-top: 18px;
}

.terminal-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--vp-c-text-2);
}

.terminal-output {
  background: #090d13;
  color: #3fb950;
  padding: 14px 16px;
  border: 1px solid #30363d;
  border-radius: 8px;
  min-height: 100px;
  max-height: 260px;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}
</style>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { executeMittiInBrowser } from '../../../src/web/runner.js'

// ── Syntax highlighter ───────────────────────────────────────────────────────
const KEYWORDS = /\b(func|return|if|elif|else|for|while|in|and|or|not|import|from|as|try|except|finally|raise|break|continue)\b/g
const BUILTINS = /\b(print|len|range|str|int|float|type|push|pop|keys|values|has|upper|lower|split|join|trim|abs|min|max|round|floor|ceil|sqrt|pow|input|read_file|write_file|append_file|file_exists|remove_file)\b/g
const TYPES    = /\b(int|float|str|bool|list|obj)\b/g

function highlight(code) {
  // Escape HTML first
  let h = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Strings (single and double quoted) — handle before keywords
  h = h.replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, m => `<span class="hl-str">${m}</span>`)

  // Comments
  h = h.replace(/(#[^\n]*)/g, m => `<span class="hl-comment">${m}</span>`)

  // Numbers
  h = h.replace(/\b(\d+\.?\d*)\b/g, m => `<span class="hl-num">${m}</span>`)

  // Keywords (skip inside strings/comments already tagged)
  h = h.replace(
    /(?<!<[^>]*)(?<!\w)(func|return|if|elif|else|for|while|in|and|or|not|import|from|as|try|except|finally|raise|break|continue)(?!\w)(?![^<]*>)/g,
    m => `<span class="hl-kw">${m}</span>`
  )

  // Built-ins
  h = h.replace(
    /(?<!<[^>]*)(?<!\w)(print|len|range|str|int|float|type|push|pop|keys|values|has|upper|lower|split|join|trim|abs|min|max|round|floor|ceil|sqrt|pow|input|read_file|write_file|append_file|file_exists|remove_file)(?!\w)(?![^<]*>)/g,
    m => `<span class="hl-builtin">${m}</span>`
  )

  // Function names after `func`
  h = h.replace(/(<span class="hl-kw">func<\/span>) (\w+)/g, (_, kw, name) =>
    `${kw} <span class="hl-fn">${name}</span>`
  )

  // Operators
  h = h.replace(/(?<!<[^>]*)(->|==|!=|&lt;=|&gt;=|[+\-*/%=&lt;&gt;])(?![^<]*>)/g,
    m => `<span class="hl-op">${m}</span>`
  )

  return h + '\n' // trailing newline prevents height collapse
}

// ── Examples ─────────────────────────────────────────────────────────────────
const examples = {
  fib: `# Fibonacci sequence
func fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci (0..9):")
for i in range(10):
    print(fibonacci(i))`,

  fact: `# Recursive factorial
func factorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print("5!  =", factorial(5))
print("10! =", factorial(10))
print("20! =", factorial(20))`,

  ds: `# Arrays and objects
user = {
    name: "Otabek",
    age: 24,
    job: "Developer"
}

print("User:", user.name, "—", user.job)

scores = [85, 92, 78, 96]
push(scores, 100)
print("Count:", len(scores))
print("Max:", max(scores))
print("Scores:", scores)`,

  custom: `# Write your own code here!
x = 100
y = 25
print("Sum:", x + y)
print("Product:", x * y)

for i in range(5):
    print("Step:", i * 10)`
}

const selectedExample = ref('fib')
const code = ref(examples.fib)
const output = ref("Click '▶ Run' to execute code...")
const isRunning = ref(false)
const highlighted = computed(() => highlight(code.value))
const hlRef = ref(null)
const lineNumsRef = ref(null)

function onSelectExample(key) {
  selectedExample.value = key
  code.value = examples[key]
  output.value = "Example loaded. Edit and run with '▶ Run'."
}

function handleTab(e) {
  const ta = e.target
  const start = ta.selectionStart
  const end = ta.selectionEnd
  code.value = code.value.substring(0, start) + '    ' + code.value.substring(end)
  nextTick(() => {
    ta.selectionStart = ta.selectionEnd = start + 4
    syncScroll({ target: ta })
  })
}

function syncScroll(e) {
  if (hlRef.value) {
    hlRef.value.scrollTop = e.target.scrollTop
    hlRef.value.scrollLeft = e.target.scrollLeft
  }
  if (lineNumsRef.value) {
    lineNumsRef.value.scrollTop = e.target.scrollTop
  }
}

function runCode() {
  isRunning.value = true
  const logs = []
  const t0 = performance.now()
  try {
    const res = executeMittiInBrowser(code.value, line => logs.push(line))
    const ms = (performance.now() - t0).toFixed(1)
    if (res.success) {
      output.value = logs.length
        ? logs.join('\n') + `\n\n[Done in ${ms}ms]`
        : `[Program finished with no output (${ms}ms)]\n(Use print() to show results)`
    } else {
      output.value = `[Error (${ms}ms)]\n\n${res.error}`
    }
  } catch (err) {
    output.value = `[Unexpected error]: ${err.message}`
  } finally {
    isRunning.value = false
  }
}

function clearOutput() { output.value = '' }
</script>

<template>
  <div class="playground-wrapper">
    <div class="playground-title-bar">
      <h1 class="page-title">Mitti Web Playground</h1>
      <p class="page-desc">Write, edit, and run Mitti code directly in the browser — real interpreter, instant output.</p>
    </div>

    <div class="playground-box">
      <div class="playground-header">
        <div class="header-left">
          <span class="editor-title">Editor</span>
          <span class="status-tag">● Real Interpreter</span>
          <span class="version-tag">v1.0.0</span>
        </div>
        <div class="header-right">
          <label class="example-label">Examples:</label>
          <select class="example-select" :value="selectedExample" @change="onSelectExample($event.target.value)">
            <option value="fib">1. Fibonacci</option>
            <option value="fact">2. Factorial</option>
            <option value="ds">3. Arrays &amp; Objects</option>
            <option value="custom">4. Scratch</option>
          </select>
        </div>
      </div>

      <!-- Highlighted editor: pre (highlight layer) + textarea (transparent overlay) -->
      <div class="editor-wrap">
        <div ref="lineNumsRef" class="line-nums" aria-hidden="true">
          <span v-for="(_, i) in code.split('\n')" :key="i">{{ i + 1 }}</span>
        </div>
        <div class="editor-inner">
          <pre ref="hlRef" class="hl-layer" aria-hidden="true" v-html="highlighted"></pre>
          <textarea
            v-model="code"
            class="code-input"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            @keydown.tab.prevent="handleTab"
            @scroll="syncScroll"
            placeholder="Write Mitti code here..."
          ></textarea>
        </div>
      </div>

      <div class="toolbar">
        <button class="btn-run" @click="runCode" :disabled="isRunning">
          {{ isRunning ? '⏳ Running...' : '▶ Run' }}
        </button>
        <button class="btn-clear" @click="clearOutput">Clear output</button>
      </div>

      <div class="terminal-box">
        <div class="terminal-title">Output:</div>
        <pre class="terminal-output">{{ output }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────────── */
.playground-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 10px 0 40px;
}
.page-title { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
.page-desc  { font-size: 15px; color: var(--vp-c-text-2); margin: 0 0 20px; }

.playground-box {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 4px 20px rgba(0,0,0,.15);
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.playground-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}
.header-left  { display: flex; align-items: center; gap: 8px; }
.header-right { display: flex; align-items: center; gap: 8px; }
.editor-title { font-weight: 700; font-size: 15px; }
.status-tag {
  font-size: 11px; padding: 2px 7px; border-radius: 6px;
  background: rgba(35,134,54,.2); color: #3fb950; font-weight: 600;
}
.version-tag {
  font-size: 11px; padding: 2px 7px; border-radius: 6px;
  background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-weight: 600;
}
.example-label { font-size: 13px; color: var(--vp-c-text-2); }
.example-select {
  padding: 5px 12px; border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg); color: var(--vp-c-text-1);
  font-size: 13px; outline: none; cursor: pointer;
}

/* ── Editor: overlay ─────────────────────────────────────────────────────────── */
/* CRITICAL: font-family / font-size / line-height / padding must be identical
   in both .hl-layer and .code-input so the cursor aligns with the highlight. */
:root {
  --editor-font: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  --editor-size: 13.5px;
  --editor-lh:   1.65;
  --editor-pad:  14px 16px;
}

.editor-wrap {
  display: flex;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
}

.line-nums {
  display: flex;
  flex-direction: column;
  min-width: 40px;
  padding: var(--editor-pad);
  background: #090d13;
  color: #484f58;
  font-family: var(--editor-font);
  font-size: var(--editor-size);
  line-height: var(--editor-lh);
  text-align: right;
  user-select: none;
  border-right: 1px solid #21262d;
  overflow: hidden;
  box-sizing: border-box;
}
.line-nums span { display: block; padding-right: 8px; }

.editor-inner {
  position: relative;
  flex: 1;
  min-height: 300px;
}

/* The highlighted pre sits behind the textarea */
.hl-layer {
  position: absolute;
  top: 0; left: 0;
  right: 0; bottom: 0;
  margin: 0;
  padding: var(--editor-pad);
  font-family: var(--editor-font);
  font-size: var(--editor-size);
  line-height: var(--editor-lh);
  box-sizing: border-box;
  white-space: pre;
  word-wrap: normal;
  overflow: hidden;
  pointer-events: none;
  color: #e6edf3;
  background: transparent;
}

/* The textarea is transparent text but visible caret, sits on top */
.code-input {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-height: 300px;
  margin: 0;
  padding: var(--editor-pad);
  font-family: var(--editor-font);
  font-size: var(--editor-size);
  line-height: var(--editor-lh);
  box-sizing: border-box;
  background: transparent;
  color: transparent;
  caret-color: #58a6ff;
  border: none;
  outline: none;
  resize: vertical;
  white-space: pre;
  overflow: auto;
  tab-size: 4;
}
.code-input::placeholder { color: #484f58; }
.code-input::selection   { background: rgba(88,166,255,.25); color: transparent; }

/* ── Syntax colours ─────────────────────────────────────────────────────────── */
:deep(.hl-kw)      { color: #ff7b72; }  /* keywords    — red    */
:deep(.hl-builtin) { color: #79c0ff; }  /* builtins    — blue   */
:deep(.hl-fn)      { color: #d2a8ff; }  /* func names  — purple */
:deep(.hl-str)     { color: #a5d6ff; }  /* strings     — cyan   */
:deep(.hl-num)     { color: #79c0ff; }  /* numbers     — blue   */
:deep(.hl-comment) { color: #8b949e; font-style: italic; }  /* comments — grey */
:deep(.hl-op)      { color: #ff7b72; }  /* operators   — red    */

/* ── Toolbar ─────────────────────────────────────────────────────────────────── */
.toolbar { margin-top: 14px; display: flex; gap: 10px; }
.btn-run {
  background: var(--vp-c-brand-1); color: #fff;
  border: none; padding: 8px 22px; border-radius: 6px;
  font-weight: 600; font-size: 14px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  transition: opacity .2s;
}
.btn-run:hover    { opacity: .9; }
.btn-run:disabled { opacity: .6; cursor: not-allowed; }
.btn-clear {
  background: var(--vp-c-default-soft); color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer;
}

/* ── Terminal ─────────────────────────────────────────────────────────────────── */
.terminal-box   { margin-top: 18px; }
.terminal-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--vp-c-text-2); }
.terminal-output {
  background: #090d13; color: #3fb950;
  padding: 14px 16px;
  border: 1px solid #30363d; border-radius: 8px;
  min-height: 100px; max-height: 280px;
  overflow-y: auto;
  font-family: var(--editor-font);
  font-size: 13px; line-height: 1.5;
  margin: 0; white-space: pre-wrap;
}
</style>


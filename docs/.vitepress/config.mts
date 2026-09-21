import { defineConfig } from 'vitepress'
import mittiGrammar from '../../editors/vscode/syntaxes/mitti.tmLanguage.json' with { type: 'json' }

export default defineConfig({
  title: "Mitti",
  description: "Oddiy, tez va ixcham interpreted dasturlash tili",
  markdown: {
    languages: [
      {
        ...mittiGrammar,
        name: 'mitti',
        aliases: ['Mitti']
      } as any
    ]
  },
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Asosiy', link: '/' },
      { text: "Qo'llanma", link: '/guide/getting-started' },
      { text: 'Funksiyalar', link: '/guide/builtins' },
      { text: 'Playground', link: '/playground' },
      { text: 'LSP & Muharrirlar', link: '/guide/lsp' },
      { text: 'Arxitektura', link: '/guide/internals' }
    ],

    sidebar: [
      {
        text: "Qo'llanma",
        items: [
          { text: 'Boshlash', link: '/guide/getting-started' },
          { text: 'Sintaksis va operatorlar', link: '/guide/syntax' },
          { text: "Ma'lumot tuzilmalari", link: '/guide/data-structures' },
          { text: 'Modullar tizimi (Modules)', link: '/guide/modules' },
          { text: 'Fayllar bilan ishlash (File I/O)', link: '/guide/file-io' },
          { text: 'Xatolarni boshqarish (try/except)', link: '/guide/errors' },
          { text: 'Ixtiyoriy tiplash (Typing)', link: '/guide/typing' },
          { text: 'LSP va Muharrirlar', link: '/guide/lsp' },
          { text: 'Built-in funksiyalar', link: '/guide/builtins' }
        ]
      },
      {
        text: 'Ichki tuzilish (Under the Hood)',
        items: [
          { text: 'Interpreter arxitekturasi', link: '/guide/internals' },
          { text: 'Bayt-kod VM (Bytecode VM)', link: '/guide/bytecode-vm' },
          { text: 'WebAssembly (WASM)', link: '/guide/wasm' },
          { text: "Yo'l xaritasi (Roadmap)", link: '/guide/roadmap' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ],

    footer: {
      message: 'Mitti dasturlash tili — v1.0.0',
      copyright: 'Mitti jamoasi tomonidan ochiq manba bilan yaratilgan'
    }
  }
})

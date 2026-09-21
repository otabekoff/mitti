import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Mitti",
  description: "Oddiy, tez va ixcham interpreted dasturlash tili",
  themeConfig: {
    nav: [
      { text: 'Asosiy', link: '/' },
      { text: "Qo'llanma", link: '/guide/getting-started' },
      { text: 'Funksiyalar', link: '/guide/builtins' },
      { text: 'Arxitektura', link: '/guide/internals' }
    ],

    sidebar: [
      {
        text: "Qo'llanma",
        items: [
          { text: 'Boshlash', link: '/guide/getting-started' },
          { text: 'Sintaksis va operatorlar', link: '/guide/syntax' },
          { text: "Ma'lumot tuzilmalari", link: '/guide/data-structures' },
          { text: 'Built-in funksiyalar', link: '/guide/builtins' }
        ]
      },
      {
        text: 'Ichki tuzilish (Under the Hood)',
        items: [
          { text: 'Interpreter arxitekturasi', link: '/guide/internals' },
          { text: "Yo'l xaritasi (Roadmap)", link: '/guide/roadmap' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ],

    footer: {
      message: 'Mitti dasturlash tili — v0.1.0',
      copyright: 'Mitti jamoasi tomonidan ochiq manba bilan yaratilgan'
    }
  }
})
